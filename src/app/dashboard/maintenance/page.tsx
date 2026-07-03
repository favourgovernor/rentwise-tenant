// src/app/dashboard/maintenance/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Request {
  id: string;
  title: string;
  description: string | null;
  urgency: string;
  status: string;
  landlord_note: string | null;
  created_at: string;
  resolved_at: string | null;
}

const urgencyColor: Record<string, string> = {
  low:       'var(--text-mid)',
  normal:    'var(--sky-deep)',
  high:      'var(--warning)',
  emergency: 'var(--danger)',
};

const statusColor: Record<string, string> = {
  submitted:    'var(--sky-deep)',
  acknowledged: 'var(--warning)',
  in_progress:  'var(--warning)',
  resolved:     'var(--moss)',
};

const statusBg: Record<string, string> = {
  submitted:    'var(--sky-light)',
  acknowledged: 'var(--warning-light)',
  in_progress:  'var(--warning-light)',
  resolved:     'var(--moss-light)',
};

export default function MaintenancePage() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [buildingId, setBuildingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [urgency, setUrgency] = useState('normal');
  const [submitting, setSubmitting] = useState(false);
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
      .from('maintenance_requests')
      .select('*')
      .eq('tenant_id', tenant.id)
      .order('created_at', { ascending: false });

    setRequests(data ?? []);
    setLoading(false);
  }

  async function handleSubmit() {
    if (!title.trim()) { setError('Please enter a description'); return; }
    setSubmitting(true);
    setError(null);

    const supabase = createClient();
    const { error: err } = await supabase
      .from('maintenance_requests')
      .insert({
        tenant_id:   tenantId,
        building_id: buildingId,
        title:       title.trim(),
        description: description.trim() || null,
        urgency,
        status:      'submitted',
      });

    if (err) {
      setError('Could not submit request. Please try again.');
      setSubmitting(false);
      return;
    }

    setTitle('');
    setDescription('');
    setUrgency('normal');
    setShowForm(false);
    setSubmitting(false);
    load();
  }

  return (
    <div style={{ padding: '24px 22px 100px', maxWidth: 480, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <p className="display" style={{ fontSize: 22, fontWeight: 700, marginBottom: 2 }}>
            Maintenance
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-mid)' }}>
            Submit and track repair requests.
          </p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setError(null); }}
          style={{
            background: 'var(--sky-deep)', color: '#fff',
            border: 'none', padding: '10px 16px',
            borderRadius: 'var(--radius-pill)',
            fontSize: 13, fontWeight: 600,
          }}
        >
          + New
        </button>
      </div>

      {/* New request form */}
      {showForm && (
        <div style={{
          border: '1.5px solid var(--rust-line)', borderRadius: 'var(--radius-md)',
          padding: 20, marginBottom: 24, background: 'var(--surface)',
        }}>
          <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>
            New maintenance request
          </p>

          <div style={{ marginBottom: 14 }}>
            <label className="label">What needs fixing?</label>
            <input
              className="input-field"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Kitchen tap is leaking"
            />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label className="label">More details (optional)</label>
            <textarea
              className="input-field"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe the issue in more detail…"
              rows={3}
              style={{ resize: 'vertical' }}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label className="label">Urgency</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {['low', 'normal', 'high', 'emergency'].map(u => (
                <button
                  key={u}
                  onClick={() => setUrgency(u)}
                  style={{
                    padding: '8px 14px', borderRadius: 'var(--radius-pill)',
                    border: '1.5px solid',
                    borderColor: urgency === u ? urgencyColor[u] : 'var(--rust-line)',
                    background: urgency === u ? urgencyColor[u] : 'var(--paper)',
                    color: urgency === u ? '#fff' : 'var(--text-mid)',
                    fontSize: 12, fontWeight: 600,
                    textTransform: 'capitalize',
                  }}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div style={{
              background: 'var(--danger-light)', color: 'var(--danger)',
              padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 12,
            }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              className="btn-primary"
              disabled={submitting}
              onClick={handleSubmit}
              style={{ flex: 1 }}
            >
              {submitting ? 'Submitting…' : 'Submit request'}
            </button>
            <button
              onClick={() => setShowForm(false)}
              style={{
                padding: '12px 16px', border: '1.5px solid var(--rust-line)',
                borderRadius: 'var(--radius-pill)', background: 'var(--surface)',
                fontSize: 13, color: 'var(--text-mid)',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Requests list */}
      {loading ? (
        <p style={{ textAlign: 'center', color: 'var(--text-light)', padding: 40 }}>Loading…</p>
      ) : requests.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔧</div>
          <p style={{ fontWeight: 600, marginBottom: 4 }}>No requests yet</p>
          <p style={{ fontSize: 13, color: 'var(--text-mid)' }}>
            Tap &quot;+ New&quot; to submit a repair request.
          </p>
        </div>
      ) : (
        <div>
          {requests.map((r, i) => (
            <div key={r.id} style={{
              padding: '16px 0',
              borderTop: i === 0 ? 'none' : '1.5px solid var(--rust-line)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                <p style={{ fontWeight: 600, fontSize: 14, flex: 1, marginRight: 10 }}>{r.title}</p>
                <span style={{
                  fontSize: 11, fontWeight: 600, padding: '3px 10px',
                  borderRadius: 20, flexShrink: 0,
                  color: statusColor[r.status] ?? 'var(--text-mid)',
                  background: statusBg[r.status] ?? 'var(--surface)',
                }}>
                  {r.status.replace('_', ' ')}
                </span>
              </div>
              {r.description && (
                <p style={{ fontSize: 12, color: 'var(--text-mid)', marginBottom: 4 }}>
                  {r.description}
                </p>
              )}
              {r.landlord_note && (
                <div style={{
                  background: 'var(--sky-light)', borderRadius: 8,
                  padding: '8px 12px', marginTop: 8,
                }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--sky-deep)', marginBottom: 2 }}>
                    Landlord note
                  </p>
                  <p style={{ fontSize: 12, color: 'var(--ink)' }}>{r.landlord_note}</p>
                </div>
              )}
              <p style={{ fontSize: 11, color: 'var(--text-light)', marginTop: 6 }}>
                {new Date(r.created_at).toLocaleDateString('en-KE', {
                  day: '2-digit', month: 'short', year: 'numeric',
                })}
                {' · '}
                <span style={{ color: urgencyColor[r.urgency], textTransform: 'capitalize' }}>
                  {r.urgency}
                </span>
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}