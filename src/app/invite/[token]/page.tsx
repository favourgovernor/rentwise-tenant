// src/app/invite/[token]/page.tsx
import Link from 'next/link';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { InviteForm } from './InviteForm';

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = createServiceRoleClient();

  const { data: invite } = await supabase
    .from('invite_tokens')
    .select(
      'token, landlord_name, building_name, house_no, monthly_rent, deposit, bed_label, tenant_phone, tenant_email, status, expires_at'
    )
    .eq('token', token)
    .maybeSingle();

  if (!invite) return <InviteError reason="not_found" />;
  if (invite.status === 'used') return <InviteError reason="used" />;
  if (invite.status === 'cancelled') return <InviteError reason="cancelled" />;
  if (new Date(invite.expires_at) < new Date()) return <InviteError reason="expired" />;

  return <InviteForm invite={invite} />;
}

type Reason = 'not_found' | 'used' | 'expired' | 'cancelled';

function InviteError({ reason }: { reason: Reason }) {
  const config: Record<Reason, { emoji: string; title: string; body: string }> = {
    not_found: {
      emoji: '🔒',
      title: "This link doesn't work",
      body: 'Double check the link your landlord sent you, or ask them to send a new one.',
    },
    used: {
      emoji: '✅',
      title: 'Already registered',
      body: 'Your account has already been created. Sign in to access your dashboard.',
    },
    expired: {
      emoji: '⏰',
      title: 'This invite has expired',
      body: 'Invite links are valid for 7 days. Ask your landlord to send a new one.',
    },
    cancelled: {
      emoji: '❌',
      title: 'This invite was cancelled',
      body: 'Ask your landlord to send a new invite if this was a mistake.',
    },
  };

  const { emoji, title, body } = config[reason];

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div style={{ maxWidth: 360, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>{emoji}</div>
        <p
          className="display"
          style={{ fontSize: 22, fontWeight: 600, marginBottom: 10 }}
        >
          {title}
        </p>
        <p
          style={{
            fontSize: 14,
            color: 'var(--text-mid)',
            lineHeight: 1.6,
            marginBottom: 24,
          }}
        >
          {body}
        </p>

        {reason === 'used' && (
          <Link
            href="/login"
            style={{
              display: 'inline-block',
              background: 'var(--sky-deep)',
              color: '#fff',
              padding: '12px 24px',
              borderRadius: '999px',
              fontSize: 14,
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Sign in to dashboard
          </Link>
        )}

        {reason === 'not_found' && (
          <p
            style={{
              fontSize: 12,
              color: 'var(--text-light)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            Make sure no characters are missing from the link.
          </p>
        )}
      </div>
    </div>
  );
}