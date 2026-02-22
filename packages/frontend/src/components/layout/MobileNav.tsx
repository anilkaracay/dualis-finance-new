'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import { LayoutDashboard, TrendingUp, Wallet, Handshake, MoreHorizontal } from 'lucide-react';

interface MobileNavProps {
  className?: string;
}

const tabs = [
  { href: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/markets', icon: TrendingUp, label: 'Markets' },
  { href: '/borrow', icon: Wallet, label: 'Borrow' },
  { href: '/sec-lending', icon: Handshake, label: 'Lending' },
  { href: '/more', icon: MoreHorizontal, label: 'More' },
] as const;

function MobileNav({ className }: MobileNavProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around h-16 bg-bg-secondary border-t border-border-default md:hidden',
        'pb-[env(safe-area-inset-bottom)]',
        className
      )}
    >
      {tabs.map((tab) => {
        const active = isActive(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              'flex flex-col items-center gap-0.5 px-3 py-1.5 text-[10px] font-medium transition-colors',
              active ? 'text-accent-teal' : 'text-text-tertiary'
            )}
          >
            <tab.icon className={cn('h-5 w-5', active && 'text-accent-teal')} />
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export { MobileNav, type MobileNavProps };
