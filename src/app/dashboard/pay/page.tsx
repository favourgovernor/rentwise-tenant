// src/app/dashboard/pay/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface LeaseData {
  monthly_rent: number;
  landlord_id: string;
  building_id: string;
  id: string;
}

interface BankDetails {
  bank_name: string;
  account_name: string;
  account_number: string;
  branch: string | null;
  paybill_number: string | null;
}

export default function PayPage() {
  const [lease, setLease] = useState<LeaseData | null>(null);
  const [bankDetails, setBankDetails] = useState<BankDetails | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [method, setMethod] = useState<'mpesa' | 'bank'>('mpesa');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bankRef, setBankRef] = useState('');

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: tenant } = await supabase
        .from('tenants')
        .select('id, phone, building_id')
        .eq('auth_id', user.id)
        .maybeSingle();

      if (!tenant) return;
      setTenantId(tenant.id);
      setPhone(tenant.phone ?? '');

      const { data: leaseData } = await supabase
        .from('leases')
        .select('id, monthly_rent, landlord_id, building_id')
        .eq('tenant_id', tenant.id)
        .eq('status', 'active')
        .maybeSingle();

      setLease(leaseData);

      if (leaseData?.landlord_id) {
        const { data: bank } = await supabase
          .from('landlord_bank_details')
          .select('*')
          .eq('landlord_id', leaseData.landlord_id)
          .maybeSingle();
        setBankDetails(bank);
      }
    }
    load();
  }, []);

  async function handleMpesa() {
    if (!phone.trim() || phone.trim().length < 9) {
      setError('Please enter a valid M-Pesa phone number');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/mpesa/stk-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phone.replace(/\s/g, ''),
          amount: lease?.monthly_rent,
          tenantId,
          leaseId: lease?.id,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'STK push failed');
      setSuccess(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleBankTransfer() {
    if (!bankRef.trim()) {
      setError('Please enter your transfer reference number');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      await supabase.from('payments').insert({
        tenant_id:    tenantId,
        lease_id:     lease?.id,
        landlord_id:  lease?.landlord_id,
        building_id:  lease?.building_id,
        amount:       lease?.monthly_rent,
        month_for:    new Date().toISOString().slice(0, 7) + '-01',
        due_date:     new Date().toISOString().slice(0, 7) + '-01',
        method:       'bank',
        status:       'pending_verification',
        bank_reference: bankRef.trim(),
      });
      setSuccess(true);
    } catch (e) {
      setError('Could not record payment. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div style={{
        minHeight: '80vh', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        textAlign: 'center', padding: 24,
      }}>
        <div>
          <div style={{ fontSize: 60, marginBottom: 16 }}>
            {method === 'mpesa' ? '📱' : '🏦'}
          </div>
          <p className="display" style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
            {method === 'mpesa'
              ? 'Check your phone!'
              : 'Transfer recorded'}
          </p>
          <p style={{ fontSize: 14, color: 'var(--text-mid)', lineHeight: 1.6 }}>
            {method === 'mpesa'
              ? 'An M-Pesa prompt has been sent to your phone. Enter your PIN to complete the payment.'
              : 'Your bank transfer has been recorded and is pending verification by your landlord.'}
          </p>
          <button
            className="btn-primary"
            style={{ marginTop: 24, maxWidth: 200, margin: '24px auto 0' }}
            onClick={() => { setSuccess(false); setError(null); }}
          >
            Back to payment
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px 22px 100px', maxWidth: 480, margin: '0 auto' }}>
      <p className="display" style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
        Pay Rent
      </p>
      <p style={{ fontSize: 13, color: 'var(--text-mid)', marginBottom: 24 }}>
        Choose your preferred payment method.
      </p>

      {/* Amount card */}
      <div style={{
        background: 'var(--ink)', borderRadius: 18,
        padding: '20px 22px', marginBottom: 24,
      }}>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginBottom: 4 }}>
          Amount due
        </p>
        <p className="mono" style={{ fontSize: 32, fontWeight: 700, color: '#fff' }}>
          KES {lease?.monthly_rent?.toLocaleString() ?? '—'}
        </p>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 4 }}>
          {new Date().toLocaleString('en-KE', { month: 'long', year: 'numeric' })} rent
        </p>
      </div>

      {/* Method toggle */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
        {(['mpesa', 'bank'] as const).map(m => (
          <button
            key={m}
            onClick={() => { setMethod(m); setError(null); }}
            style={{
              flex: 1, padding: '12px 0',
              borderRadius: 'var(--radius-sm)',
              border: '1.5px solid',
              borderColor: method === m ? 'var(--sky-deep)' : 'var(--rust-line)',
              background: method === m ? 'var(--sky-light)' : 'var(--surface)',
              color: method === m ? 'var(--sky-deep)' : 'var(--text-mid)',
              fontWeight: 600, fontSize: 14,
            }}
          >
            {m === 'mpesa' ? '📱 M-Pesa' : '🏦 Bank Transfer'}
          </button>
        ))}
      </div>

      {/* M-Pesa form */}
      {method === 'mpesa' && (
        <div>
          <div style={{ marginBottom: 16 }}>
            <label className="label">M-Pesa phone number</label>
            <input
              className="input-field"
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="07XX XXX XXX"
            />
            <p style={{ fontSize: 12, color: 'var(--text-light)', marginTop: 4 }}>
              You will receive an STK push prompt on this number.
            </p>
          </div>

          {error && <ErrorBanner message={error} />}

          <button
            className="btn-primary"
            disabled={loading}
            onClick={handleMpesa}
          >
            {loading ? 'Sending prompt…' : `Pay KES ${lease?.monthly_rent?.toLocaleString()} via M-Pesa`}
          </button>

          <div style={{
            marginTop: 16, padding: 14,
            background: 'var(--sky-light)',
            borderRadius: 'var(--radius-sm)',
          }}>
            <p style={{ fontSize: 12, color: 'var(--sky-deep)', lineHeight: 1.6 }}>
              <strong>How it works:</strong> After tapping Pay, your phone will buzz
              with an M-Pesa prompt. Enter your PIN to confirm — the payment
              is instant and your Kodi Score updates automatically.
            </p>
          </div>
        </div>
      )}

      {/* Bank transfer form */}
      {method === 'bank' && (
        <div>
          {bankDetails ? (
            <div style={{
              background: 'var(--surface)', borderRadius: 'var(--radius-md)',
              border: '1.5px solid var(--rust-line)', padding: 20, marginBottom: 20,
            }}>
              <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>
                Transfer to this account:
              </p>
              <BankRow label="Bank" value={bankDetails.bank_name} />
              <BankRow label="Account Name" value={bankDetails.account_name} />
              <BankRow label="Account No." value={bankDetails.account_number} />
              {bankDetails.branch && <BankRow label="Branch" value={bankDetails.branch} />}
              {bankDetails.paybill_number && (
                <BankRow label="Paybill" value={bankDetails.paybill_number} />
              )}
            </div>
          ) : (
            <div style={{
              background: 'var(--warning-light)', borderRadius: 'var(--radius-sm)',
              padding: 14, marginBottom: 20,
            }}>
              <p style={{ fontSize: 13, color: 'var(--warning)' }}>
                Your landlord hasn&apos;t added bank details yet.
                Contact them directly to get the account number.
              </p>
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <label className="label">Transfer reference / transaction code</label>
            <input
              className="input-field"
              value={bankRef}
              onChange={e => setBankRef(e.target.value)}
              placeholder="e.g. TRN12345678 or your name"
            />
            <p style={{ fontSize: 12, color: 'var(--text-light)', marginTop: 4 }}>
              Enter the reference you used when making the transfer.
            </p>
          </div>

          {error && <ErrorBanner message={error} />}

          <button
            className="btn-primary"
            disabled={loading || !bankDetails}
            onClick={handleBankTransfer}
          >
            {loading ? 'Recording…' : 'I have made the transfer'}
          </button>
        </div>
      )}
    </div>
  );
}

function BankRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between',
      padding: '8px 0', borderBottom: '1px solid var(--rust-line)',
      fontSize: 13,
    }}>
      <span style={{ color: 'var(--text-mid)' }}>{label}</span>
      <span className="mono" style={{ fontWeight: 600 }}>{value}</span>
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div style={{
      background: 'var(--danger-light)', color: 'var(--danger)',
      padding: '10px 14px', borderRadius: 8,
      fontSize: 13, marginBottom: 12,
    }}>
      {message}
    </div>
  );
}