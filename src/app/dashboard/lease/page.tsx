// src/app/dashboard/lease/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Lease {
  id: string;
  tenant_name: string;
  tenant_phone: string;
  date_of_joining: string;
  house_no: string;
  location: string | null;
  landlord_name: string | null;
  lease_period: string | null;
  monthly_rent: number;
  deposit: number;
  place_of_work: string | null;
  tenant_signature_type: string | null;
  tenant_signature_data: string | null;
  landlord_signature_text: string | null;
  status: string;
  created_at: string;
}

export default function LeasePage() {
  const [lease, setLease] = useState<Lease | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: tenant } = await supabase
        .from('tenants').select('id')
        .eq('auth_id', user.id).maybeSingle();
      if (!tenant) return;

      const { data } = await supabase
        .from('leases').select('*')
        .eq('tenant_id', tenant.id)
        .eq('status', 'active')
        .maybeSingle();

      setLease(data);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return (
    <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-light)' }}>
      Loading your lease…
    </div>
  );

  if (!lease) return (
    <div style={{ textAlign: 'center', padding: 60 }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>📄</div>
      <p style={{ fontWeight: 600 }}>No active lease found</p>
      <p style={{ fontSize: 13, color: 'var(--text-mid)', marginTop: 4 }}>
        Contact your landlord if you believe this is an error.
      </p>
    </div>
  );

  return (
    <div style={{ padding: '24px 22px 100px', maxWidth: 700, margin: '0 auto' }}>
      <p className="display" style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
        My Lease
      </p>
      <p style={{ fontSize: 13, color: 'var(--text-mid)', marginBottom: 24 }}>
        Your signed tenancy agreement.
      </p>

      {/* Status badge */}
      <div style={{ marginBottom: 24 }}>
        <span style={{
          background: 'var(--moss-light)', color: 'var(--moss)',
          fontSize: 12, fontWeight: 700, padding: '4px 12px',
          borderRadius: 20,
        }}>
          ✓ Active
        </span>
      </div>

      {/* Agreement document */}
      <div style={{
        border: '2px solid var(--ink)', borderRadius: 8,
        padding: '28px 28px', background: '#fafafa',
      }}>
        <p style={{
          textAlign: 'center', fontWeight: 800,
          fontSize: 18, letterSpacing: 1, marginBottom: 2,
        }}>
          TENANCY AGREEMENT
        </p>
        <p style={{
          textAlign: 'center', fontSize: 12,
          color: 'var(--text-mid)', marginBottom: 24,
        }}>
          Property Managers &amp; Letting Agents — RentWise
        </p>

        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          gap: '12px 32px', marginBottom: 20,
        }}>
          <LeaseField label="DATE" value={new Date(lease.created_at).toLocaleDateString('en-KE')} />
          <LeaseField label="HOUSE NO." value={lease.house_no} />
          <LeaseField label="TENANT" value={lease.tenant_name} />
          <LeaseField label="TEL." value={lease.tenant_phone} />
          <LeaseField label="LANDLORD" value={lease.landlord_name ?? '—'} />
          <LeaseField label="LEASE PERIOD" value={lease.lease_period ?? 'One Year'} />
          <LeaseField
            label="EFFECTIVE FROM"
            value={new Date(lease.date_of_joining).toLocaleDateString('en-KE')}
          />
          <LeaseField label="STATUS" value={lease.status.toUpperCase()} />
        </div>

        <div style={{
          borderTop: '1.5px solid #ddd', paddingTop: 16,
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          gap: '12px 32px', marginBottom: 20,
        }}>
          <LeaseField
            label="MONTHLY RENT (KShs.)"
            value={`${lease.monthly_rent.toLocaleString()}`}
          />
          <LeaseField
            label="DEPOSIT (KShs.)"
            value={`${lease.deposit.toLocaleString()}`}
          />
          <LeaseField
            label="MODE OF PAYMENT"
            value="Monthly in Advance"
          />
          {lease.place_of_work && (
            <LeaseField label="PLACE OF WORK" value={lease.place_of_work} />
          )}
        </div>

        {/* Signatures */}
        <div style={{
          borderTop: '1.5px solid #ddd', paddingTop: 20,
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24,
        }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, marginBottom: 8, color: 'var(--text-mid)' }}>
              TENANT&apos;S SIGNATURE
            </p>
            <p style={{ fontSize: 12, marginBottom: 8 }}>
              Name: <strong>{lease.tenant_name}</strong>
            </p>
            {lease.tenant_signature_type === 'drawn' && lease.tenant_signature_data ? (
              <img
                src={lease.tenant_signature_data}
                alt="Tenant signature"
                style={{
                  maxWidth: '100%', height: 80, objectFit: 'contain',
                  border: '1px solid #eee', borderRadius: 4, background: '#fff',
                }}
              />
            ) : lease.tenant_signature_type === 'typed' ? (
              <p style={{
                fontFamily: 'var(--font-display)', fontSize: 22,
                fontStyle: 'italic', color: 'var(--ink)',
              }}>
                {lease.tenant_signature_data}
              </p>
            ) : null}
            <p style={{ fontSize: 11, color: 'var(--text-light)', marginTop: 6 }}>
              Signed on {new Date(lease.created_at).toLocaleDateString('en-KE')}
            </p>
          </div>

          <div>
            <p style={{ fontSize: 11, fontWeight: 700, marginBottom: 8, color: 'var(--text-mid)' }}>
              LANDLORD&apos;S SIGNATURE
            </p>
            <p style={{ fontSize: 12, marginBottom: 8 }}>
              Name: <strong>{lease.landlord_name}</strong>
            </p>
            <p style={{
              fontFamily: 'var(--font-display)', fontSize: 22,
              fontStyle: 'italic', color: 'var(--ink)',
            }}>
              {lease.landlord_signature_text}
            </p>
            <p style={{ fontSize: 11, color: 'var(--text-light)', marginTop: 6 }}>
              Signed on {new Date(lease.created_at).toLocaleDateString('en-KE')}
            </p>
          </div>
        </div>

        <p style={{
          fontSize: 11, color: 'var(--text-mid)', textAlign: 'center',
          borderTop: '1px solid #ccc', paddingTop: 12, marginTop: 16,
        }}>
          For &amp; on behalf of the tenant &nbsp;|&nbsp; For &amp; on behalf of the landlord
        </p>
      </div>
    </div>
  );
}

function LeaseField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.8, color: 'var(--text-light)', marginBottom: 2 }}>
        {label}
      </p>
      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', borderBottom: '1px solid #ddd', paddingBottom: 4 }}>
        {value}
      </p>
    </div>
  );
}