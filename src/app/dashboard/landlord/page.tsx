// src/app/dashboard/landlord/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface LandlordInfo {
  name: string;
  email: string;
  short_code: string | null;
}

interface BuildingInfo {
  name: string;
  property_type: string;
  address: string | null;
}

export default function LandlordPage() {
  const [landlord, setLandlord] = useState<LandlordInfo | null>(null);
  const [building, setBuildingInfo] = useState<BuildingInfo | null>(null);
  const [unit, setUnit] = useState<{ name: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: tenant } = await supabase
        .from('tenants')
        .select('building_id, unit_id')
        .eq('auth_id', user.id)
        .maybeSingle();
      if (!tenant) return;

      const [buildingRes, unitRes] = await Promise.all([
        supabase.from('buildings').select('name, property_type, address, landlord_id').eq('id', tenant.building_id).maybeSingle(),
        supabase.from('units').select('name').eq('id', tenant.unit_id).maybeSingle(),
      ]);

      setBuildingInfo(buildingRes.data);
      setUnit(unitRes.data);

      if (buildingRes.data?.landlord_id) {
        const { data: landlordData } = await supabase
          .from('landlords')
          .select('name, email, short_code')
          .eq('id', buildingRes.data.landlord_id)
          .maybeSingle();
        setLandlord(landlordData);
      }

      setLoading(false);
    }
    load();
  }, []);

  if (loading) return (
    <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-light)' }}>
      Loading…
    </div>
  );

  return (
    <div style={{ padding: '24px 22px 100px', maxWidth: 480, margin: '0 auto' }}>
      <p className="display" style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
        Landlord &amp; Property
      </p>
      <p style={{ fontSize: 13, color: 'var(--text-mid)', marginBottom: 24 }}>
        Your landlord and property details.
      </p>

      {/* Landlord card */}
      <div style={{
        background: 'var(--ink)', borderRadius: 18,
        padding: '24px 22px', marginBottom: 20, color: '#fff',
      }}>
        <div style={{
          width: 52, height: 52, borderRadius: '50%',
          background: 'var(--sky-deep)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, marginBottom: 14,
        }}>
          👤
        </div>
        <p className="display" style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
          {landlord?.name ?? '—'}
        </p>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
          Your landlord
        </p>
      </div>

      {/* Contact details */}
      <div className="card" style={{ marginBottom: 16 }}>
        <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 14 }}>Contact</p>
        <InfoRow icon="✉" label="Email" value={landlord?.email ?? '—'} />
      </div>

      {/* Property details */}
      <div className="card">
        <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 14 }}>Property</p>
        <InfoRow icon="🏢" label="Building" value={building?.name ?? '—'} />
        <InfoRow icon="🚪" label="Your unit" value={unit?.name ?? '—'} />
        <InfoRow
          icon="🏠"
          label="Type"
          value={building?.property_type
            ? building.property_type.charAt(0).toUpperCase() + building.property_type.slice(1)
            : '—'}
        />
        {building?.address && (
          <InfoRow icon="📍" label="Address" value={building.address} />
        )}
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '10px 0', borderBottom: '1px solid var(--rust-line)',
    }}>
      <span style={{ fontSize: 18, width: 28, textAlign: 'center' }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 11, color: 'var(--text-light)', marginBottom: 1 }}>{label}</p>
        <p style={{ fontSize: 14, fontWeight: 500 }}>{value}</p>
      </div>
    </div>
  );
}