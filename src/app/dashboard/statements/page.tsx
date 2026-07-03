// src/app/dashboard/statements/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Payment {
  id: string;
  amount: number;
  month_for: string;
  paid_date: string | null;
  method: string;
  status: string;
  mpesa_receipt: string | null;
  bank_reference: string | null;
  created_at: string;
}

const statusColor: Record<string, string> = {
  completed:            'var(--moss)',
  pending_verification: 'var(--warning)',
  pending:              'var(--warning)',
  failed:               'var(--danger)',
};

const statusBg: Record<string, string> = {
  completed:            'var(--moss-light)',
  pending_verification: 'var(--warning-light)',
  pending:              'var(--warning-light)',
  failed:               'var(--danger-light)',
};

const statusLabel: Record<string, string> = {
  completed:            'Paid',
  pending_verification: 'Pending verification',
  pending:              'Pending',
  failed:               'Failed',
};

export default function StatementsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPaid, setTotalPaid] = useState(0);

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
        .from('payments')
        .select('*')
        .eq('tenant_id', tenant.id)
        .order('created_at', { ascending: false });

      setPayments(data ?? []);
      const total = (data ?? [])
        .filter(p => p.status === 'completed')
        .reduce((s, p) => s + (p.amount ?? 0), 0);
      setTotalPaid(total);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div style={{ padding: '24px 22px 100px', maxWidth: 480, margin: '0 auto' }}>
      <p className="display" style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
        Statements
      </p>
      <p style={{ fontSize: 13, color: 'var(--text-mid)', marginBottom: 24 }}>
        Your full payment history.
      </p>

      {/* Summary card */}
      <div style={{
        background: 'var(--sky-light)', borderRadius: 'var(--radius-md)',
        padding: '18px 20px', marginBottom: 24,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div>
          <p style={{ fontSize: 12, color: 'var(--sky-deep)', fontWeight: 600 }}>
            Total paid
          </p>
          <p className="mono" style={{ fontSize: 24, fontWeight: 700, color: 'var(--ink)' }}>
            KES {totalPaid.toLocaleString()}
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: 12, color: 'var(--sky-deep)', fontWeight: 600 }}>
            Payments
          </p>
          <p className="mono" style={{ fontSize: 24, fontWeight: 700, color: 'var(--ink)' }}>
            {payments.filter(p => p.status === 'completed').length}
          </p>
        </div>
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', color: 'var(--text-light)', padding: 40 }}>
          Loading…
        </p>
      ) : payments.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🧾</div>
          <p style={{ fontWeight: 600, marginBottom: 4 }}>No payments yet</p>
          <p style={{ fontSize: 13, color: 'var(--text-mid)' }}>
            Your payment history will appear here.
          </p>
        </div>
      ) : (
        <div>
          {payments.map((p, i) => (
            <div
              key={p.id}
              style={{
                padding: '16px 0',
                borderTop: i === 0 ? 'none' : '1.5px solid var(--rust-line)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <div>
                  <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>
                    {new Date(p.month_for).toLocaleString('en-KE', {
                      month: 'long', year: 'numeric',
                    })} rent
                  </p>
                  <p className="mono" style={{ fontSize: 11, color: 'var(--text-light)' }}>
                    {p.method.toUpperCase()}
                    {p.mpesa_receipt ? ` · ${p.mpesa_receipt}` : ''}
                    {p.bank_reference ? ` · ${p.bank_reference}` : ''}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p className="mono" style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>
                    KES {p.amount?.toLocaleString()}
                  </p>
                  <span style={{
                    fontSize: 11, fontWeight: 600, padding: '2px 8px',
                    borderRadius: 20,
                    color: statusColor[p.status] ?? 'var(--text-mid)',
                    background: statusBg[p.status] ?? 'var(--surface)',
                  }}>
                    {statusLabel[p.status] ?? p.status}
                  </span>
                </div>
              </div>
              <p style={{ fontSize: 11, color: 'var(--text-light)' }}>
                {new Date(p.created_at).toLocaleDateString('en-KE', {
                  day: '2-digit', month: 'short', year: 'numeric',
                })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}