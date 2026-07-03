// src/app/dashboard/page.tsx
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { KodiStamp } from '@/components/KodiStamp';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // ── Fetch tenant record ──────────────────────────
  const { data: tenant } = await supabase
    .from('tenants')
    .select('id, name, building_id, unit_id')
    .eq('auth_id', user.id)
    .maybeSingle();

  if (!tenant) {
    return (
      <div style={{ padding: 24 }}>
        <p>We couldn&apos;t find your tenant record. Please contact your landlord.</p>
      </div>
    );
  }

  // ── Fetch Kodi Score ──────────────────────────────
  const { data: kodi } = await supabase
    .from('kodi_scores')
    .select('score, current_streak')
    .eq('tenant_id', tenant.id)
    .maybeSingle();

  const score = kodi?.score ?? 600;
  const streak = kodi?.current_streak ?? 0;

  // ── Fetch points balance ──────────────────────────
  const { data: points } = await supabase
    .from('tenant_points')
    .select('balance')
    .eq('tenant_id', tenant.id)
    .maybeSingle();

  const pointsBalance = points?.balance ?? 0;

  // ── Fetch active lease for rent amount + due date ──
  const { data: lease } = await supabase
    .from('leases')
    .select('monthly_rent')
    .eq('tenant_id', tenant.id)
    .eq('status', 'active')
    .maybeSingle();

  const monthlyRent = lease?.monthly_rent ?? 0;

  // ── Recent activity (last 5 payments + maintenance) ─
  const { data: recentPayments } = await supabase
    .from('payments')
    .select('id, amount, paid_date, status, method, mpesa_receipt, created_at')
    .eq('tenant_id', tenant.id)
    .order('created_at', { ascending: false })
    .limit(3);

  const { data: recentMaintenance } = await supabase
    .from('maintenance_requests')
    .select('id, title, status, resolved_at, created_at')
    .eq('tenant_id', tenant.id)
    .order('created_at', { ascending: false })
    .limit(2);

  // ── Compute days until rent due (simple: 1st of month) ─
  const today = new Date();
  const nextDue = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  const daysUntilDue = Math.ceil(
    (nextDue.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  const firstName = tenant.name?.split(' ')[0] ?? 'there';

  return (
    <div style={{ paddingTop: 8, maxWidth: 480, margin: '0 auto' }}>
      {/* ── Greeting ─────────────────────────────── */}
      <div style={{ padding: '8px 22px 0' }}>
        <p style={{ fontSize: 13, color: 'var(--text-mid)', marginBottom: 2 }}>
          Good {greetingTime()}
        </p>
        <p
          className="display"
          style={{ fontSize: 24, fontWeight: 600, marginBottom: 18 }}
        >
          {firstName} 👋
        </p>
      </div>

      {/* ── Stamp card ───────────────────────────── */}
      <div
        className="card"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 18,
          margin: '0 22px 18px',
        }}
      >
        <KodiStamp score={score} />
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 4 }}>
            <span className="display" style={{ fontSize: 22, fontWeight: 600, color: 'var(--pink-deep)' }}>
              {streak}
            </span>
            <span style={{ fontSize: 13, color: 'var(--text-mid)' }}>
              month streak
            </span>
          </div>
          <span
            className="mono"
            style={{
              display: 'inline-flex',
              fontSize: 12,
              fontWeight: 500,
              color: 'var(--sky-deep)',
              background: 'var(--sky-light)',
              padding: '3px 8px',
              borderRadius: 20,
            }}
          >
            Score {score}
          </span>
        </div>
      </div>

      {/* ── Payment banner ───────────────────────── */}
      <Link href="/dashboard/pay">
        <div
          style={{
            margin: '0 22px 22px',
            background: 'var(--ink)',
            borderRadius: 18,
            padding: '18px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginBottom: 4 }}>
              {daysUntilDue > 0
                ? `Rent due in ${daysUntilDue} day${daysUntilDue === 1 ? '' : 's'}`
                : 'Rent due now'}
            </p>
            <p className="mono" style={{ fontSize: 20, fontWeight: 500, color: '#fff' }}>
              KES {monthlyRent.toLocaleString()}
            </p>
          </div>
          <span className="btn-primary" style={{ display: 'inline-block' }}>
            Pay now
          </span>
        </div>
      </Link>

      {/* ── Rewards nudge ────────────────────────── */}
      <Link href="/dashboard/rewards">
        <div
          style={{
            margin: '0 22px 24px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '14px 16px',
            background: 'var(--pink-light)',
            borderRadius: 14,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'var(--pink-deep)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              color: '#fff',
              fontWeight: 700,
              fontSize: 15,
            }}
          >
            ★
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--pink-deep)', marginBottom: 1 }}>
              {pointsBalance} points
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-mid)' }}>
              Tap to see what you can redeem
            </p>
          </div>
        </div>
      </Link>

      {/* ── Activity feed ────────────────────────── */}
      <div style={{ padding: '0 22px 28px' }}>
        <p
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--text-mid)',
            textTransform: 'uppercase',
            letterSpacing: '0.8px',
            marginBottom: 14,
          }}
        >
          Activity
        </p>

        {(!recentPayments || recentPayments.length === 0) &&
        (!recentMaintenance || recentMaintenance.length === 0) ? (
          <p style={{ fontSize: 13, color: 'var(--text-light)' }}>
            Nothing here yet — your activity will show up after your first payment.
          </p>
        ) : (
          <>
            {recentPayments?.map((p) => (
              <div
                key={p.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '13px 0',
                  borderTop: '1.5px solid var(--rust-line)',
                }}
              >
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: '50%',
                    background: 'var(--sky-light)',
                    color: 'var(--sky-deep)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    fontSize: 15,
                  }}
                >
                  ✓
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13.5, fontWeight: 500, marginBottom: 1 }}>
                    Rent payment — KES {p.amount?.toLocaleString()}
                  </p>
                  <p className="mono" style={{ fontSize: 11.5, color: 'var(--text-light)' }}>
                    {p.method?.toUpperCase()} {p.mpesa_receipt ? `· ${p.mpesa_receipt}` : ''}
                  </p>
                </div>
              </div>
            ))}

            {recentMaintenance?.map((m) => (
              <div
                key={m.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '13px 0',
                  borderTop: '1.5px solid var(--rust-line)',
                }}
              >
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: '50%',
                    background: 'var(--rust-line)',
                    color: 'var(--text-mid)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    fontSize: 15,
                  }}
                >
                  🔧
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13.5, fontWeight: 500, marginBottom: 1 }}>
                    {m.title}
                  </p>
                  <p className="mono" style={{ fontSize: 11.5, color: 'var(--text-light)' }}>
                    {m.status === 'resolved' ? 'Resolved' : 'In progress'}
                  </p>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

function greetingTime() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
