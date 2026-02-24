'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import { LayoutDashboard, BarChart3, ArrowDownToLine, PieChart, MoreHorizontal } from 'lucide-react';

interface MobileNavProps {
  className?: string | undefined;
}

const tabs = [
  { href: '/overview', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/markets', icon: BarChart3, label: 'Markets' },
  { href: '/borrow', icon: ArrowDownToLine, label: 'Borrow' },
  { href: '/portfolio', icon: PieChart, label: 'Portfolio' },
  { href: '/more', icon: MoreHorizontal, label: 'More' },
] as const;

function MobileNav({ className }: MobileNavProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/overview') return pathname === '/overview';
    return pathname.startsWith(href);
  };

  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around h-16 bg-bg-secondary/90 backdrop-blur-xl border-t border-border-subtle md:hidden',
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
              'relative flex flex-col items-center gap-0.5 px-3 py-2 text-[10px] font-medium transition-colors duration-150',
              active ? 'text-accent-teal' : 'text-text-tertiary'
            )}
          >
            <tab.icon className="h-[18px] w-[18px]" strokeWidth={1.5} />
            <span>{tab.label}</span>
            {active && <span className="absolute -bottom-0 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-accent-teal" />}
          </Link>
        );
      })}
    </nav>
  );
}

export { MobileNav, type MobileNavProps };
