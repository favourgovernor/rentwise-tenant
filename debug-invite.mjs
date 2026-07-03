// debug-invite.mjs
//
// Run this with: node debug-invite.mjs
// Tests the EXACT query the Next.js invite page runs,
// using the EXACT same env vars, isolated from Next.js
// itself — to rule out any app-level issue.

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Manually parse .env.local since this isn't a Next.js process
const envFile = readFileSync('.env.local', 'utf-8');
const env = {};
envFile.split('\n').forEach((line) => {
  const match = line.match(/^([^=#]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim();
});

console.log('Using Supabase URL:', env.NEXT_PUBLIC_SUPABASE_URL);
console.log('Anon key starts with:', env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.slice(0, 20) + '...');

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const TOKEN = '7d3bff2c-b270-4943-a3e3-6b4ec007f0c5';

const { data, error } = await supabase
  .from('invite_tokens')
  .select(
    'token, landlord_name, building_name, house_no, monthly_rent, deposit, bed_label, tenant_phone, tenant_email, status, expires_at'
  )
  .eq('token', TOKEN)
  .maybeSingle();

console.log('\n--- RESULT ---');
console.log('data:', data);
console.log('error:', error);