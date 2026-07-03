// src/app/api/invite/complete/route.ts
import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  console.log('🔥 ROUTE HIT');
  const body = await request.json();
  console.log('🔥 TOKEN RECEIVED:', body.token);

  const {
    token, password, tenantName, tenantPhone, tenantEmail,
    dateOfJoining, houseNo, location, landlordName, leasePeriod,
    monthlyRent, deposit, placeOfWork, signatureType, signatureData,
  } = body;

  if (!token || !tenantName || !tenantPhone || !tenantEmail || !password) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  try {
    // Step 1: Validate invite
    const { data: invite, error: inviteErr } = await supabase
      .from('invite_tokens')
      .select('*')
      .eq('token', token)
      .in('status', ['pending', 'used'])
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    console.log('🔥 INVITE:', invite ? 'found' : 'not found', inviteErr?.message);

    if (inviteErr || !invite) {
      return NextResponse.json(
        { error: 'This invite link has expired. Ask your landlord for a new one.' },
        { status: 400 }
      );
    }

    // Step 2: Create auth account
    let authUserId: string;

    const { data: signUpData, error: signUpError } = await supabase.auth.admin.createUser({
      email: tenantEmail,
      password,
      email_confirm: true,
      user_metadata: { name: tenantName, role: 'tenant' },
    });

    console.log('🔥 SIGNUP:', signUpData?.user?.id ?? 'failed', signUpError?.message);

    if (signUpError) {
      if (
        signUpError.message?.toLowerCase().includes('already') ||
        signUpError.message?.toLowerCase().includes('registered') ||
        signUpError.message?.toLowerCase().includes('exists')
      ) {
        const { data: listData } = await supabase.auth.admin.listUsers({ perPage: 1000 });
        const existing = listData?.users?.find((u) => u.email === tenantEmail);
        if (!existing) {
          return NextResponse.json(
            { error: 'This email is already registered. Please use a different email.' },
            { status: 400 }
          );
        }
        authUserId = existing.id;

        const { data: existingTenant } = await supabase
          .from('tenants')
          .select('id, lease_id')
          .eq('auth_id', authUserId)
          .maybeSingle();

        if (existingTenant?.lease_id) {
          return NextResponse.json({ success: true, tenantId: existingTenant.id });
        }
      } else {
        throw signUpError;
      }
    } else {
      authUserId = signUpData.user!.id;
    }

    // Step 3: Create tenant record
    let tenantId: string | null = null;

    const tenantPayload: Record<string, unknown> = {
      building_id: invite.building_id,
      unit_id:     invite.unit_id,
      auth_id:     authUserId,
      name:        tenantName,
      phone:       tenantPhone,
      email:       tenantEmail,
      deposit,
      is_active:   true,
    };

    if (invite.bed_label) {
      tenantPayload.bed_label = invite.bed_label;
    }

    const { data: newTenant, error: insertErr } = await supabase
      .from('tenants')
      .insert(tenantPayload)
      .select('id')
      .maybeSingle();

    console.log('🔥 TENANT INSERT:', newTenant?.id ?? 'failed', insertErr?.message);

    if (newTenant?.id) {
      tenantId = newTenant.id;
    } else {
      const { data: found } = await supabase
        .from('tenants')
        .select('id')
        .eq('auth_id', authUserId)
        .maybeSingle();

      console.log('🔥 TENANT LOOKUP:', found?.id ?? 'not found');
      tenantId = found?.id ?? null;
    }

    if (!tenantId) {
      throw new Error(`Could not create tenant. Insert error: ${insertErr?.message}`);
    }

    // Step 4: Create lease
    const { data: lease, error: leaseErr } = await supabase
      .from('leases')
      .insert({
        invite_token:            token,
        landlord_id:             invite.landlord_id,
        building_id:             invite.building_id,
        unit_id:                 invite.unit_id,
        tenant_id:               tenantId,
        tenant_name:             tenantName,
        tenant_phone:            tenantPhone,
        date_of_joining:         dateOfJoining,
        house_no:                houseNo,
        location:                location ?? null,
        landlord_name:           landlordName ?? null,
        lease_period:            leasePeriod ?? null,
        monthly_rent:            monthlyRent,
        deposit,
        place_of_work:           placeOfWork ?? null,
        tenant_signature_type:   signatureType,
        tenant_signature_data:   signatureData,
        landlord_signature_text: landlordName ?? null,
        status:                  'active',
      })
      .select('id')
      .single();

    console.log('🔥 LEASE:', lease?.id ?? 'failed', leaseErr?.message);

    if (leaseErr || !lease) {
      throw new Error(leaseErr?.message ?? 'Could not create lease');
    }

    // Step 5: Link lease to tenant
    await supabase.from('tenants').update({ lease_id: lease.id }).eq('id', tenantId);

    // Step 6: Initialize Kodi Score + points
    await supabase.from('kodi_scores').upsert(
      { tenant_id: tenantId, score: 600, current_streak: 0 },
      { onConflict: 'tenant_id' }
    );
    await supabase.from('tenant_points').upsert(
      { tenant_id: tenantId, balance: 0, lifetime_earned: 0 },
      { onConflict: 'tenant_id' }
    );

    // Step 7: Mark invite used (LAST)
    await supabase
      .from('invite_tokens')
      .update({ status: 'used', used_at: new Date().toISOString() })
      .eq('token', token);

    console.log('🔥 SUCCESS — tenantId:', tenantId, 'leaseId:', lease.id);
    return NextResponse.json({ success: true, tenantId, leaseId: lease.id });

  } catch (e) {
    console.error('🔥 INVITE ERROR:', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Unknown error' },
      { status: 500 }
    );
  }
}