// src/app/dashboard/refer/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Referral {
  id: string;
  referred_name: string;
  referred_phone: string;
  status: string;
  points_awarded: number;
  created_at: string;
}

export default function ReferPage() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [buildingId, setBuildingId] = useState<string | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: tenant } = await supabase
      .from('tenants').select('id, building_id')
      .eq('auth_id', user.id).maybeSingle();
    if (!tenant) return;

    setTenantId(tenant.id);
    setBuildingId(tenant.building_id);

    const { data } = await supabase
      .from('referrals')
      .select('*')
      .eq('referrer_tenant_id', tenant.id)
      .order('created_at', { ascending: false });

    setReferrals(data ?? []);
    setLoading(false);
  }

  async function handleSubmit() {
    if (!name.trim()) { setError('Please enter your friend\'s name'); return; }
    if (!phone.trim() || phone.trim().length < 9) {
      setError('Please enter a valid phone number'); return;
    }
    setSubmitting(true);
    setError(null);

    const supabase = createClient();
    const { error: err } = await supabase.from('referrals').insert({
      referrer_tenant_id: tenantId,
      referred_name:      name.trim(),
      referred_phone:     phone.trim(),
      building_id:        buildingId,
      status:             'pending',
    });

    if (err) { setError('Could not submit referral. Try again.'); setSubmitting(false); return; }

    setSuccess(true);
    setName('');
    setPhone('');
    setSubmitting(false);
    load();
  }

  const statusColor: Record<string, string> = {
    pending:   'var(--warning)',
    converted: 'var(--moss)',
    expired:   'var(--text-light)',
  };

  return (
    <div style={{ padding: '24px 22px 100px', maxWidth: 480, margin: '0 auto' }}>
      <p className="display" style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
        Refer a Friend
      </p>
      <p style={{ fontSize: 13, color: 'var(--text-mid)', marginBottom: 24 }}>
        Know someone looking for a place? Refer them and earn 50 points when they sign a lease.
      </p>

      {/* Points incentive */}
      <div style={{
        background: 'var(--pink-light)', borderRadius: 'var(--radius-md)',
        padding: '16px 18px', marginBottom: 24,
        display: 'flex', alignItems: 'center', gap: 14,
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: '50%',
          background: 'var(--pink-deep)', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20, flexShrink: 0,
        }}>
          🎁
        </div>
        <div>
          <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--pink-deep)', marginBottom: 2 }}>
            Earn 50 points per successful referral
          </p>
          <p style={{ fontSize: 12, color: 'var(--text-mid)' }}>
            Points are awarded when your friend signs their lease.
          </p>
        </div>
      </div>

      {/* Form */}
      {success && (
        <div style={{
          background: 'var(--moss-light)', color: 'var(--moss)',
          padding: '12px 16px', borderRadius: 'var(--radius-sm)',
          fontSize: 13, marginBottom: 20,
        }}>
          ✓ Referral submitted! Your landlord will be in touch with your friend.
        </div>
      )}

      <div style={{ marginBottom: 14 }}>
        <label className="label">Friend&apos;s full name</label>
        <input
          className="input-field" value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Jane Wanjiru"
        />
      </div>
      <div style={{ marginBottom: 16 }}>
        <label className="label">Friend&apos;s phone number</label>
        <input
          className="input-field" type="tel" value={phone}
          onChange={e => setPhone(e.target.value)}
          placeholder="07XX XXX XXX"
        />
      </div>

      {error && (
        <div style={{
          background: 'var(--danger-light)', color: 'var(--danger)',
          padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 12,
        }}>
          {error}
        </div>
      )}

      <button className="btn-primary" disabled={submitting} onClick={handleSubmit}>
        {submitting ? 'Submitting…' : 'Submit referral'}
      </button>

      {/* Past referrals */}
      {!loading && referrals.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Your referrals</p>
          {referrals.map((r, i) => (
            <div key={r.id} style={{
              padding: '12px 0',
              borderTop: i === 0 ? 'none' : '1px solid var(--rust-line)',
              display: 'flex', justifyContent: 'space-between',
            }}>
              <div>
                <p style={{ fontWeight: 600, fontSize: 13 }}>{r.referred_name}</p>
                <p style={{ fontSize: 12, color: 'var(--text-mid)', fontFamily: 'var(--font-mono)' }}>
                  {r.referred_phone}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: statusColor[r.status], textTransform: 'capitalize' }}>
                  {r.status}
                </p>
                {r.points_awarded > 0 && (
                  <p style={{ fontSize: 11, color: 'var(--pink-deep)', fontWeight: 600 }}>
                    +{r.points_awarded} pts
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}