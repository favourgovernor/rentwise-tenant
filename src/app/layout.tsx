import type { Metadata } from 'next';
// @ts-ignore
import './globals.css';

export const metadata: Metadata = {
  title: 'RentWise — Tenant Portal',
  description: 'Manage your rent, lease, and rewards in one place.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
