// src/app/dashboard/rewards/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Reward { id: string; title: string; description: string | null; points_cost: number; reward_value: number | null; }
interface Ledger { id: string; delta: number; reason: string; created_at: string; }

export default function RewardsPage() {
  const [balance, setBalance] = useState(0);
  const [lifetimeEarned, setLifetimeEarned] = useState(0);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [ledger, setLedger] = useState<Ledger[]>([]);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: tenant } = await supabase
        .from('tenants').select('id')
        .eq('auth_id', user.id).maybeSingle();
      if (!tenant) return;

      setTenantId(tenant.id);

      const [pointsRes, rewardsRes, ledgerRes] = await Promise.all([
        supabase.from('tenant_points').select('balance, lifetime_earned').eq('tenant_id', tenant.id).maybeSingle(),
        supabase.from('rewards_catalogue').select('*').eq('active', true).order('points_cost'),
        supabase.from('points_ledger').select('*').eq('tenant_id', tenant.id).order('created_at', { ascending: false }).limit(10),
      ]);

      setBalance(pointsRes.data?.balance ?? 0);
      setLifetimeEarned(pointsRes.data?.lifetime_earned ?? 0);
      setRewards(rewardsRes.data ?? []);
      setLedger(ledgerRes.data ?? []);
      setLoading(false);
    }
    load();
  }, []);

  async function handleRedeem(reward: Reward) {
    if (balance < reward.points_cost) return;
    setRedeeming(reward.id);
    const supabase = createClient();

    await supabase.from('redemptions').insert({
      tenant_id:    tenantId,
      reward_id:    reward.id,
      points_spent: reward.points_cost,
      status:       'pending',
    });

    setSuccessMsg(`Redemption request for "${reward.title}" sent! Your landlord will apply it to your next payment.`);
    setBalance(prev => prev - reward.points_cost);
    setRedeeming(null);
  }

  const reasonLabel: Record<string, string> = {
    on_time_payment:  'On-time payment',
    paid_early:       'Early payment bonus',
    referral:         'Referral bonus',
    streak_milestone: 'Streak milestone',
    redemption:       'Points redeemed',
  };

  return (
    <div style={{ padding: '24px 22px 100px', maxWidth: 480, margin: '0 auto' }}>
      <p className="display" style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
        Rewards
      </p>
      <p style={{ fontSize: 13, color: 'var(--text-mid)', marginBottom: 24 }}>
        Earn points for paying on time. Redeem for rent discounts.
      </p>

      {/* Points balance card */}
      <div style={{
        background: 'linear-gradient(135deg, var(--pink-deep), var(--pink))',
        borderRadius: 18, padding: '24px 22px', marginBottom: 24, color: '#fff',
      }}>
        <p style={{ fontSize: 12, opacity: 0.8, marginBottom: 4 }}>Your points balance</p>
        <p className="display" style={{ fontSize: 48, fontWeight: 700, lineHeight: 1, marginBottom: 8 }}>
          {balance.toLocaleString()}
        </p>
        <p style={{ fontSize: 12, opacity: 0.7 }}>
          {lifetimeEarned.toLocaleString()} total earned
        </p>
      </div>

      {successMsg && (
        <div style={{
          background: 'var(--moss-light)', color: 'var(--moss)',
          padding: '12px 16px', borderRadius: 'var(--radius-sm)',
          fontSize: 13, marginBottom: 20, lineHeight: 1.5,
        }}>
          ✓ {successMsg}
        </div>
      )}

      {/* Rewards catalogue */}
      <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Redeem points</p>

      {loading ? (
        <p style={{ color: 'var(--text-light)', textAlign: 'center', padding: 20 }}>Loading…</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
          {rewards.map(r => {
            const canAfford = balance >= r.points_cost;
            return (
              <div key={r.id} style={{
                border: '1.5px solid',
                borderColor: canAfford ? 'var(--pink)' : 'var(--rust-line)',
                borderRadius: 'var(--radius-md)',
                padding: '16px 18px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: canAfford ? 'var(--pink-light)' : 'var(--surface)',
                opacity: canAfford ? 1 : 0.6,
              }}>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{r.title}</p>
                  {r.description && (
                    <p style={{ fontSize: 12, color: 'var(--text-mid)' }}>{r.description}</p>
                  )}
                  <p className="mono" style={{ fontSize: 12, color: 'var(--pink-deep)', marginTop: 4, fontWeight: 600 }}>
                    {r.points_cost} pts
                  </p>
                </div>
                <button
                  onClick={() => handleRedeem(r)}
                  disabled={!canAfford || redeeming === r.id}
                  style={{
                    padding: '10px 16px',
                    borderRadius: 'var(--radius-pill)',
                    border: 'none',
                    background: canAfford ? 'var(--pink-deep)' : 'var(--rust-line)',
                    color: canAfford ? '#fff' : 'var(--text-light)',
                    fontSize: 13, fontWeight: 600,
                    cursor: canAfford ? 'pointer' : 'not-allowed',
                    flexShrink: 0, marginLeft: 12,
                  }}
                >
                  {redeeming === r.id ? '…' : 'Redeem'}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Points history */}
      {ledger.length > 0 && (
        <>
          <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Points history</p>
          {ledger.map((l, i) => (
            <div key={l.id} style={{
              display: 'flex', justifyContent: 'space-between',
              padding: '10px 0',
              borderTop: i === 0 ? 'none' : '1px solid var(--rust-line)',
              fontSize: 13,
            }}>
              <div>
                <p style={{ fontWeight: 500, marginBottom: 2 }}>
                  {reasonLabel[l.reason] ?? l.reason}
                </p>
                <p style={{ fontSize: 11, color: 'var(--text-light)' }}>
                  {new Date(l.created_at).toLocaleDateString('en-KE', {
                    day: '2-digit', month: 'short', year: 'numeric',
                  })}
                </p>
              </div>
              <p style={{
                fontWeight: 700, fontFamily: 'var(--font-mono)',
                color: l.delta > 0 ? 'var(--moss)' : 'var(--danger)',
              }}>
                {l.delta > 0 ? '+' : ''}{l.delta} pts
              </p>
            </div>
          ))}
        </>
      )}
    </div>
  );
}