// src/components/BottomNav.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const items = [
  { href: '/dashboard',            label: 'Home',      icon: '⌂' },
  { href: '/dashboard/pay',        label: 'Pay',       icon: '💳' },
  { href: '/dashboard/rewards',    label: 'Rewards',   icon: '★' },
  { href: '/dashboard/messages',   label: 'Messages',  icon: '✉' },
  { href: '/dashboard/settings',   label: 'More',      icon: '☰' },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'var(--paper-raised)',
        borderTop: '1.5px solid var(--rust-line)',
        display: 'flex',
        justifyContent: 'space-around',
        padding: '10px 0 max(10px, env(safe-area-inset-bottom))',
        zIndex: 50,
      }}
    >
      {items.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              fontSize: 11,
              fontWeight: active ? 600 : 400,
              color: active ? 'var(--sky-deep)' : 'var(--text-light)',
              padding: '4px 14px',
            }}
          >
            <span style={{ fontSize: 18 }}>{item.icon}</span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}