// src/app/dashboard/messages/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Message {
  id: string;
  sender_role: 'tenant' | 'landlord';
  content: string;
  created_at: string;
  read: boolean;
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [landlordId, setLandlordId] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { load(); }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function load() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: tenant } = await supabase
      .from('tenants').select('id')
      .eq('auth_id', user.id).maybeSingle();
    if (!tenant) return;

    setTenantId(tenant.id);

    const { data: lease } = await supabase
      .from('leases').select('landlord_id')
      .eq('tenant_id', tenant.id).eq('status', 'active').maybeSingle();

    setLandlordId(lease?.landlord_id ?? null);

    // Load messages — using a simple messages table structure
    // If this table doesn't exist yet, we show a placeholder
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${tenant.id},receiver_id.eq.${lease?.landlord_id}),and(sender_id.eq.${lease?.landlord_id},receiver_id.eq.${tenant.id})`)
      .order('created_at', { ascending: true });

    if (!error) setMessages(data ?? []);
    setLoading(false);
  }

  async function handleSend() {
    if (!content.trim() || !tenantId || !landlordId) return;
    setSending(true);

    const supabase = createClient();
    const { error } = await supabase.from('messages').insert({
      sender_id:    tenantId,
      receiver_id:  landlordId,
      sender_role:  'tenant',
      content:      content.trim(),
      read:         false,
    });

    if (!error) {
      setContent('');
      load();
    }
    setSending(false);
  }

  if (loading) return (
    <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-light)' }}>
      Loading messages…
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', maxWidth: 480, margin: '0 auto' }}>

      {/* Header */}
      <div style={{
        padding: '20px 22px 16px',
        borderBottom: '1.5px solid var(--rust-line)',
        background: 'var(--paper)',
      }}>
        <p className="display" style={{ fontSize: 20, fontWeight: 700, marginBottom: 2 }}>
          Messages
        </p>
        <p style={{ fontSize: 12, color: 'var(--text-mid)' }}>
          Chat with your landlord
        </p>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 22px' }}>
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>💬</div>
            <p style={{ fontWeight: 600, marginBottom: 4 }}>No messages yet</p>
            <p style={{ fontSize: 13, color: 'var(--text-mid)' }}>
              Send your landlord a message below.
            </p>
          </div>
        ) : (
          messages.map(m => {
            const isTenant = m.sender_role === 'tenant';
            return (
              <div key={m.id} style={{
                display: 'flex',
                justifyContent: isTenant ? 'flex-end' : 'flex-start',
                marginBottom: 12,
              }}>
                <div style={{
                  maxWidth: '75%',
                  background: isTenant ? 'var(--sky-deep)' : 'var(--surface)',
                  color: isTenant ? '#fff' : 'var(--ink)',
                  padding: '10px 14px',
                  borderRadius: isTenant
                    ? '18px 18px 4px 18px'
                    : '18px 18px 18px 4px',
                  fontSize: 14, lineHeight: 1.5,
                }}>
                  <p>{m.content}</p>
                  <p style={{
                    fontSize: 10, marginTop: 4,
                    opacity: 0.65, textAlign: 'right',
                  }}>
                    {new Date(m.created_at).toLocaleTimeString('en-KE', {
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: '12px 16px',
        borderTop: '1.5px solid var(--rust-line)',
        background: 'var(--paper)',
        display: 'flex', gap: 10, alignItems: 'flex-end',
        paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
      }}>
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Type a message…"
          rows={1}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          style={{
            flex: 1, border: '1.5px solid var(--rust-line)',
            borderRadius: 20, padding: '10px 14px',
            fontSize: 14, resize: 'none', outline: 'none',
            fontFamily: 'var(--font-body)',
            maxHeight: 100, overflowY: 'auto',
          }}
        />
        <button
          onClick={handleSend}
          disabled={sending || !content.trim()}
          style={{
            width: 40, height: 40, borderRadius: '50%',
            background: content.trim() ? 'var(--sky-deep)' : 'var(--rust-line)',
            border: 'none', color: '#fff', fontSize: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, cursor: content.trim() ? 'pointer' : 'not-allowed',
          }}
        >
          ➤
        </button>
      </div>
    </div>
  );
}