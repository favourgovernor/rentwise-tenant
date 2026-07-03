// src/lib/supabase/client.ts
//
// Use this in CLIENT components ('use client' files).
// Runs in the browser, uses the public anon key.

import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
