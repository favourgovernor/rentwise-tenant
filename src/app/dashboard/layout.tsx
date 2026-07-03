// src/app/dashboard/layout.tsx
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { BottomNav } from '@/components/BottomNav';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Every dashboard page requires a logged-in tenant.
  // No exceptions — redirect to login otherwise.
  if (!user) {
    redirect('/login');
  }

  return (
    <div style={{ minHeight: '100vh', paddingBottom: 90 }}>
      {children}
      <BottomNav />
    </div>
  );
}
