// src/lib/supabase/server.ts
//
// Use this in SERVER components, Server Actions, and
// API routes. Reads the session from cookies.

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { CookieOptions } from '@supabase/ssr';

type CookieToSet = { name: string; value: string; options: CookieOptions };

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component — safe to ignore,
            // middleware handles session refresh instead.
          }
        },
      },
    }
  );
}

// ── Service role client ──────────────────────────────
// ONLY for API routes that need to bypass RLS — e.g.
// the M-Pesa callback, which runs as Safaricom's server,
// not as any logged-in user.
// NEVER import this in a client component.
import { createClient as createServiceClient } from '@supabase/supabase-js';

export function createServiceRoleClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
