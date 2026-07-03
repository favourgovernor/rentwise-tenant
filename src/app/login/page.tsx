// src/app/login/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin() {
    if (!email.trim() || !password) {
      setError('Please enter your email and password');
      return;
    }
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError('Incorrect email or password. Please try again.');
      setLoading(false);
      return;
    }

    router.push('/dashboard');
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      padding: 24, background: 'var(--paper)',
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'var(--sky-deep)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 14px', fontSize: 24,
          }}>
            🏠
          </div>
          <p className="display" style={{ fontSize: 26, fontWeight: 700, marginBottom: 4 }}>
            RentWise
          </p>
          <p style={{ fontSize: 14, color: 'var(--text-mid)' }}>
            Sign in to your tenant portal
          </p>
        </div>

        {/* Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label className="label">Email address</label>
            <input
              className="input-field"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
            />
          </div>
          <div>
            <label className="label">Password</label>
            <input
              className="input-field"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Your password"
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
            />
          </div>
        </div>

        {error && (
          <div style={{
            background: 'var(--danger-light)', color: 'var(--danger)',
            padding: '10px 14px', borderRadius: 8,
            fontSize: 13, marginTop: 12,
          }}>
            {error}
          </div>
        )}

        <button
          className="btn-primary"
          style={{ marginTop: 20 }}
          disabled={loading}
          onClick={handleLogin}
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>

        <p style={{
          textAlign: 'center', fontSize: 13,
          color: 'var(--text-mid)', marginTop: 20,
        }}>
          Don&apos;t have an account yet?{' '}
          <span style={{ color: 'var(--sky-deep)' }}>
            Use the invite link your landlord sent you.
          </span>
        </p>
      </div>
    </div>
  );
}