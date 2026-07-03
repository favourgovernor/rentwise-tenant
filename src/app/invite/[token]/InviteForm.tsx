// src/app/invite/[token]/InviteForm.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { SignaturePad } from '@/components/SignaturePad';

interface InviteData {
  token: string;
  landlord_name: string | null;
  building_name: string | null;
  house_no: string | null;
  monthly_rent: number;
  deposit: number;
  bed_label: string | null;
  tenant_phone: string | null;
  tenant_email: string | null;
}

type Step = 'details' | 'agreement' | 'sign' | 'account' | 'success';

function numberToWords(n: number): string {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven',
    'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen',
    'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty',
    'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  if (n === 0) return 'Zero';
  if (n < 20) return ones[n];
  if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
  if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + numberToWords(n % 100) : '');
  if (n < 1000000) return numberToWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + numberToWords(n % 1000) : '');
  return n.toString();
}

export function InviteForm({ invite }: { invite: InviteData }) {
  const router = useRouter();

  const [step, setStep] = useState<Step>('details');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [tenantName, setTenantName] = useState('');
  const [tenantPhone, setTenantPhone] = useState(invite.tenant_phone ?? '');
  const [dateOfJoining, setDateOfJoining] = useState('');
  const [leasePeriod] = useState('One Year');
  const [modeOfPayment] = useState('Monthly in Advance (Accommodation)');
  const [agreementFee, setAgreementFee] = useState('3000');

  const [tenantSignature, setTenantSignature] = useState<{
    type: 'drawn' | 'typed'; value: string;
  } | null>(null);
  const [signDate, setSignDate] = useState(new Date().toISOString().split('T')[0]);

  const [email, setEmail] = useState(invite.tenant_email ?? '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const today = new Date().toLocaleDateString('en-KE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
  const rentInWords = numberToWords(invite.monthly_rent) + ' Kenya Shillings Only';

  function validateDetails(): string | null {
    if (!tenantName.trim()) return 'Please enter your full name';
    if (!tenantPhone.trim() || tenantPhone.trim().length < 9) return 'Please enter a valid phone number';
    if (!dateOfJoining) return 'Please enter lease start date';
    return null;
  }

  function validateAccount(): string | null {
    if (!email.trim() || !email.includes('@')) return 'Please enter a valid email';
    if (password.length < 6) return 'Password must be at least 6 characters';
    if (password !== confirmPassword) return 'Passwords do not match';
    return null;
  }

  async function handleSubmit() {
    const err = validateAccount();
    if (err) { setError(err); return; }
    if (!tenantSignature) { setError('Please add your signature'); return; }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/invite/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token:         invite.token,
          password,
          tenantName,
          tenantPhone,
          tenantEmail:   email,
          dateOfJoining,
          houseNo:       invite.house_no,
          location:      null,
          landlordName:  invite.landlord_name,
          leasePeriod,
          monthlyRent:   invite.monthly_rent,
          deposit:       invite.deposit,
          placeOfWork:   null,
          signatureType: tenantSignature.type,
          signatureData: tenantSignature.value,
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error ?? 'Could not complete signup');

      const supabase = createClient();
      await supabase.auth.signInWithPassword({ email, password });

      setStep('success');
      setTimeout(() => router.push('/dashboard'), 2500);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  const steps: Step[] = ['details', 'agreement', 'sign', 'account'];
  const stepIdx = steps.indexOf(step);

  if (step === 'success') {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', textAlign: 'center', padding: 24,
      }}>
        <div>
          <div style={{ fontSize: 60, marginBottom: 16 }}>🎉</div>
          <p className="display" style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
            Welcome to RentWise
          </p>
          <p style={{ color: 'var(--text-mid)' }}>Taking you to your dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-pad" style={{ maxWidth: 700, margin: '0 auto' }}>

      {/* Progress bar */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 28 }}>
        {steps.map((s, i) => (
          <div key={s} style={{
            flex: 1, height: 4, borderRadius: 2,
            background: i <= stepIdx ? 'var(--sky-deep)' : 'var(--rust-line)',
          }} />
        ))}
      </div>

      {/* ── STEP 1: Details ──────────────────────────────── */}
      {step === 'details' && (
        <div>
          <p className="display" style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>
            Verify your details
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-mid)', marginBottom: 28 }}>
            Fill in the fields below. Greyed fields are set by your landlord.
          </p>

          <div style={{
            border: '2px solid var(--ink)', borderRadius: 8,
            padding: 20, marginBottom: 28, background: '#fafafa',
          }}>
            <p style={{
              textAlign: 'center', fontWeight: 800, fontSize: 18,
              letterSpacing: 1, marginBottom: 2,
            }}>
              TENANCY AGREEMENT
            </p>
            <p style={{
              textAlign: 'center', fontSize: 12,
              color: 'var(--text-mid)', marginBottom: 20,
            }}>
              Property Managers &amp; Letting Agents — RentWise
            </p>

            <div className="form-grid">
              <Field label="DATE" value={today} locked />
              <Field label="HOUSE NO." value={invite.house_no ?? ''} locked />
              <Field
                label="TENANT"
                value={tenantName}
                onChange={setTenantName}
                placeholder="Full name"
              />
              <Field
                label="TEL."
                value={tenantPhone}
                onChange={setTenantPhone}
                placeholder="07XX XXX XXX"
              />
              <Field label="LANDLORD" value={invite.landlord_name ?? ''} locked />
              <Field label="L.R. NO." value={invite.building_name ?? ''} locked />
              <div className="form-grid-full">
                <Field
                  label="LEASE PERIOD (ONE YEAR WITH EFFECT FROM)"
                  value={dateOfJoining}
                  onChange={setDateOfJoining}
                  type="date"
                />
              </div>
              <Field
                label="MONTHLY RENT (EXCLUSIVE) KShs."
                value={invite.monthly_rent.toLocaleString()}
                locked
              />
              <Field label="READ" value={rentInWords} locked />
              <div className="form-grid-full">
                <Field label="MODE OF PAYMENT" value={modeOfPayment} locked />
              </div>
              <Field
                label="DEPOSIT (KShs)"
                value={invite.deposit.toLocaleString()}
                locked
              />
            </div>
          </div>

          {error && <ErrorBanner message={error} />}
          <button
            className="btn-primary"
            onClick={() => {
              const err = validateDetails();
              if (err) { setError(err); return; }
              setError(null);
              setStep('agreement');
            }}
          >
            Continue to Agreement →
          </button>
        </div>
      )}

      {/* ── STEP 2: Agreement ──────────────────────────────── */}
      {step === 'agreement' && (
        <div>
          <p className="display" style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>
            Read the tenancy agreement
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-mid)', marginBottom: 20 }}>
            Please read all terms carefully before signing.
          </p>

          <div style={{
            border: '2px solid var(--ink)', borderRadius: 8,
            padding: '20px 24px', background: '#fafafa', marginBottom: 24,
          }}>
            <div style={{ borderBottom: '1.5px solid #ccc', paddingBottom: 16, marginBottom: 16 }}>
              <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>
                AGREEMENT SUMMARY
              </p>
              <Row label="Tenant"       value={tenantName} />
              <Row label="Landlord"     value={invite.landlord_name ?? ''} />
              <Row label="Property"     value={`${invite.house_no} — ${invite.building_name}`} />
              <Row label="Monthly Rent" value={`KES ${invite.monthly_rent.toLocaleString()}`} />
              <Row label="Deposit"      value={`KES ${invite.deposit.toLocaleString()}`} />
              <Row label="Lease Start"  value={dateOfJoining} />
              <Row label="Lease Period" value={leasePeriod} />
            </div>

            <p style={{
              fontWeight: 700, fontSize: 13, marginBottom: 10,
              textDecoration: 'underline',
            }}>
              AGREED TERMS AND CONDITIONS OF THE TENANCY ARE AS HERE UNDER:
            </p>

            {[
              'No subletting, internal swapping with possession without a written consent of the landlord or the authorized agents.',
              "If the tenant is allowed to terminate this tenancy earlier than the fixed period stated above, then re-letting fees shall be payable to the landlord or the authorized agents at the rate of 60% of one month's rent.",
              'The tenant shall replace or repair any items broken or missing to the same status as it was at occupation of the premises, upon expiry or sooner on termination of this tenancy.',
              'The premises shall be used solely as a residential dwelling house only and not for any commercial activities.',
              'All rents are due and payable on the 1st day of the month whether formally demanded or not by depositing cash only to the bank account provided. Cheques should not be deposited but submitted by the 1st day of the month.',
              'Original cash deposit slips must be submitted to the RentWise office on or before 5th of the month and an official receipt obtained. Any rent collection done by the managing agents shall attract KShs 300/- collection fee.',
              'Bank slips or cheques presented after 5th shall attract 10% penalty per month with a minimum of KShs 300/- for the rents below KShs 5,000/- which shall be construed as additional rent owing.',
              `The tenant shall pay a deposit of premises of KShs ${invite.deposit.toLocaleString()}/- — Refundable after due performance of all tenancy obligations at the expiry or on termination of the tenancy. The deposit shall always be equivalent to the current month rent.`,
              'The rent will be reviewed upwards according to the market rate after expiry of the lease period.',
              'Unless otherwise stated, the notice period to terminate this tenancy shall be one calendar month in writing from either party or rent in lieu of notice.',
              "The tenancy shall be deemed to have become a continuous monthly tenancy on the expiry of the fixed period stated above and can be terminated by giving one calendar month's notice in writing by either party or rent in lieu of notice.",
              'If electricity, water and other charges (where applicable) are not paid as they fall due, the same shall be construed as rent owing and distrainable with rent. Deposit will not be refunded unless final accounts of water and electricity bills are provided and confirmed correct on expiry or termination of the tenancy.',
              'Bounced cheques shall be sub-charged not less than KShs 3,000/- and construed as rent owing.',
              'As and while the landlord or his managing agents shall construe common security and cleanliness as necessary, the same shall be apportioned to the tenants according, and construed as rent owing.',
              'Rent and other payments construed as rent owing if not paid on or before the due dates shall be recoverable as rent under Cap. 293 of the laws of Kenya and not withstanding any other legal actions open to the landlord/agents thereof.',
              `To pay a consideration fee of KShs ${agreementFee}/- for this agreement.`,
            ].map((clause, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                <span style={{
                  fontSize: 12, fontWeight: 700, minWidth: 20,
                  color: 'var(--sky-deep)', flexShrink: 0,
                }}>
                  {i + 1}.
                </span>
                <p style={{ fontSize: 12, lineHeight: 1.65, color: '#333' }}>{clause}</p>
              </div>
            ))}

            <div style={{ marginTop: 16, borderTop: '1px solid #ccc', paddingTop: 12 }}>
              <Field
                label="CONSIDERATION FEE (KShs)"
                value={agreementFee}
                onChange={setAgreementFee}
                placeholder="3000"
              />
            </div>

            <p style={{ fontSize: 12, marginTop: 12, fontStyle: 'italic', color: '#555' }}>
              Signed in full acceptance after reading, having been explained and
              fully understood all clauses.
            </p>
          </div>

          <button className="btn-primary" onClick={() => setStep('sign')}>
            I have read and agree — Sign →
          </button>
        </div>
      )}

      {/* ── STEP 3: Sign ──────────────────────────────────── */}
      {step === 'sign' && (
        <div>
          <p className="display" style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>
            Sign the agreement
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-mid)', marginBottom: 24 }}>
            Draw or type your signature. By signing you agree to all terms.
          </p>

          <div style={{
            border: '2px solid var(--ink)', borderRadius: 8,
            padding: 20, background: '#fafafa', marginBottom: 24,
          }}>
            <div className="sign-grid">

              {/* Tenant */}
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>
                  TENANT&apos;S SIGNATURE
                </p>
                <p style={{ fontSize: 12, marginBottom: 4 }}>
                  Name: <strong>{tenantName}</strong>
                </p>
                <div style={{
                  border: '1.5px dashed #ccc', borderRadius: 6,
                  overflow: 'hidden', marginBottom: 8,
                }}>
                  <SignaturePad onChange={setTenantSignature} />
                </div>
                <p style={{ fontSize: 11, color: 'var(--text-mid)' }}>Date</p>
                <input
                  type="date"
                  className="input-field"
                  value={signDate}
                  onChange={e => setSignDate(e.target.value)}
                  style={{ marginTop: 4, fontSize: 13 }}
                />
              </div>

              {/* Landlord */}
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>
                  LANDLORD&apos;S SIGNATURE
                </p>
                <p style={{ fontSize: 12, marginBottom: 4 }}>
                  Name: <strong>{invite.landlord_name}</strong>
                </p>
                <div style={{
                  height: 110, border: '1.5px dashed #ccc',
                  borderRadius: 6, display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  background: '#fff', marginBottom: 8,
                }}>
                  <p style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 26, fontStyle: 'italic', color: 'var(--ink)',
                  }}>
                    {invite.landlord_name}
                  </p>
                </div>
                <p style={{ fontSize: 11, color: 'var(--text-mid)' }}>Date</p>
                <p style={{
                  fontSize: 13, marginTop: 4,
                  color: 'var(--text-mid)', fontFamily: 'var(--font-mono)',
                }}>
                  {today}
                </p>
              </div>
            </div>

            <p style={{
              fontSize: 11, color: 'var(--text-mid)', textAlign: 'center',
              borderTop: '1px solid #ccc', paddingTop: 12,
            }}>
              For &amp; on behalf of the tenant &nbsp;|&nbsp; For &amp; on behalf of the landlord
            </p>
          </div>

          {error && <ErrorBanner message={error} />}
          <button
            className="btn-primary"
            disabled={!tenantSignature}
            onClick={() => {
              if (!tenantSignature) { setError('Please add your signature'); return; }
              setError(null);
              setStep('account');
            }}
          >
            Continue →
          </button>
        </div>
      )}

      {/* ── STEP 4: Account ───────────────────────────────── */}
      {step === 'account' && (
        <div>
          <p className="display" style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>
            Create your account
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-mid)', marginBottom: 24 }}>
            You&apos;ll use this to log in and access your dashboard anytime.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label className="label">Email address</label>
              <input
                className="input-field" type="email" value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                className="input-field" type="password" value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="At least 6 characters"
              />
            </div>
            <div>
              <label className="label">Confirm password</label>
              <input
                className="input-field" type="password" value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          {error && <ErrorBanner message={error} />}
          <button
            className="btn-primary"
            style={{ marginTop: 20 }}
            disabled={loading}
            onClick={handleSubmit}
          >
            {loading ? 'Setting up your account…' : 'Sign lease & create account'}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────

function Field({
  label, value, onChange, placeholder, type = 'text', locked = false,
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  type?: string;
  locked?: boolean;
}) {
  return (
    <div style={{ marginBottom: 4 }}>
      <p style={{
        fontSize: 10, fontWeight: 700, letterSpacing: 0.5,
        color: 'var(--text-mid)', marginBottom: 3,
      }}>
        {label}
      </p>
      {locked ? (
        <div style={{
          borderBottom: '1.5px solid #ccc', padding: '5px 0',
          fontSize: 13, fontWeight: 600, color: 'var(--ink)', minHeight: 28,
        }}>
          {value || '—'}
        </div>
      ) : (
        <input
          type={type}
          value={value}
          onChange={e => onChange?.(e.target.value)}
          placeholder={placeholder}
          style={{
            width: '100%', border: 'none',
            borderBottom: '1.5px solid var(--sky-deep)',
            borderRadius: 0, padding: '5px 0',
            fontSize: 13, background: 'transparent',
            outline: 'none', color: 'var(--ink)',
          }}
        />
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 4, fontSize: 12 }}>
      <span style={{ color: 'var(--text-mid)', minWidth: 100 }}>{label}:</span>
      <span style={{ fontWeight: 600 }}>{value}</span>
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