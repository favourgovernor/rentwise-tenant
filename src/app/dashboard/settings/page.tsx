// src/app/dashboard/settings/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function SettingsPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);
  const [passwordMsg, setPasswordMsg] = useState<string | null>(null);
  const [passwordErr, setPasswordErr] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setEmail(user.email ?? '');

      const { data: tenant } = await supabase
        .from('tenants')
        .select('id, name, phone')
        .eq('auth_id', user.id)
        .maybeSingle();

      if (tenant) {
        setTenantId(tenant.id);
        setName(tenant.name ?? '');
        setPhone(tenant.phone ?? '');
      }
    }
    load();
  }, []);

  async function handleSaveProfile() {
    setSaving(true);
    setProfileMsg(null);
    const supabase = createClient();
    await supabase.from('tenants').update({ name, phone }).eq('id', tenantId!);
    setSaving(false);
    setProfileMsg('Profile updated successfully');
    setTimeout(() => setProfileMsg(null), 3000);
  }

  async function handleChangePassword() {
    if (newPassword.length < 6) {
      setPasswordErr('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordErr('Passwords do not match');
      return;
    }
    setChangingPassword(true);
    setPasswordErr(null);
    setPasswordMsg(null);

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      setPasswordErr(error.message);
    } else {
      setPasswordMsg('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordMsg(null), 3000);
    }
    setChangingPassword(false);
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <div style={{ padding: '24px 22px 100px', maxWidth: 480, margin: '0 auto' }}>
      <p className="display" style={{ fontSize: 22, fontWeight: 700, marginBottom: 24 }}>
        Settings
      </p>

      {/* Profile section */}
      <section style={{ marginBottom: 28 }}>
        <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 14, color: 'var(--text-mid)' }}>
          PROFILE
        </p>

        <div className="card">
          <div style={{ marginBottom: 14 }}>
            <label className="label">Full name</label>
            <input
              className="input-field" value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label className="label">Phone number</label>
            <input
              className="input-field" type="tel" value={phone}
              onChange={e => setPhone(e.target.value)}
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label className="label">Email address</label>
            <input
              className="input-field" value={email}
              disabled
              style={{ color: 'var(--text-mid)', background: 'var(--rust-line)' }}
            />
            <p style={{ fontSize: 11, color: 'var(--text-light)', marginTop: 4 }}>
              Email cannot be changed. Contact your landlord if needed.
            </p>
          </div>

          {profileMsg && (
            <p style={{ fontSize: 13, color: 'var(--moss)', marginBottom: 12 }}>
              ✓ {profileMsg}
            </p>
          )}

          <button className="btn-primary" disabled={saving} onClick={handleSaveProfile}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </section>

      {/* Password section */}
      <section style={{ marginBottom: 28 }}>
        <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 14, color: 'var(--text-mid)' }}>
          PASSWORD
        </p>

        <div className="card">
          <div style={{ marginBottom: 14 }}>
            <label className="label">New password</label>
            <input
              className="input-field" type="password"
              value={newPassword} onChange={e => setNewPassword(e.target.value)}
              placeholder="At least 6 characters"
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label className="label">Confirm new password</label>
            <input
              className="input-field" type="password"
              value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
            />
          </div>

          {passwordErr && (
            <div style={{
              background: 'var(--danger-light)', color: 'var(--danger)',
              padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 12,
            }}>
              {passwordErr}
            </div>
          )}

          {passwordMsg && (
            <p style={{ fontSize: 13, color: 'var(--moss)', marginBottom: 12 }}>
              ✓ {passwordMsg}
            </p>
          )}

          <button
            className="btn-primary"
            disabled={changingPassword}
            onClick={handleChangePassword}
          >
            {changingPassword ? 'Updating…' : 'Change password'}
          </button>
        </div>
      </section>

      {/* Sign out */}
      <section>
        <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 14, color: 'var(--text-mid)' }}>
          ACCOUNT
        </p>
        <button
          onClick={handleSignOut}
          style={{
            width: '100%', padding: '14px 0',
            borderRadius: 'var(--radius-pill)',
            border: '1.5px solid var(--danger)',
            background: 'var(--danger-light)',
            color: 'var(--danger)',
            fontSize: 14, fontWeight: 600,
          }}
        >
          Sign out
        </button>
      </section>
    </div>
  );
}