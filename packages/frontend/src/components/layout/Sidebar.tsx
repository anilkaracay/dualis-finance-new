'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import {
  LayoutDashboard,
  TrendingUp,
  Wallet,
  Handshake,
  Star,
  Landmark,
  Coins,
  PieChart,
  Settings,
  BookOpen,
  Bug,
} from 'lucide-react';

interface SidebarProps {
  collapsed?: boolean;
  className?: string;
}

const navItems = [
  { href: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/markets', icon: TrendingUp, label: 'Markets' },
  { href: '/borrow', icon: Wallet, label: 'Borrow' },
  { href: '/sec-lending', icon: Handshake, label: 'Sec Lending' },
  { href: '/credit', icon: Star, label: 'Credit Score' },
  { href: '/governance', icon: Landmark, label: 'Governance' },
  { href: '/staking', icon: Coins, label: 'Staking' },
  { href: '/portfolio', icon: PieChart, label: 'Portfolio' },
] as const;

const bottomItems = [
  { href: '/settings', icon: Settings, label: 'Settings' },
  { href: '/docs', icon: BookOpen, label: 'Docs' },
  { href: '/support', icon: Bug, label: 'Support' },
] as const;

function Sidebar({ collapsed = false, className }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/' || pathname === '';
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={cn(
        'flex flex-col h-full bg-bg-secondary border-r border-border-default transition-all duration-300',
        collapsed ? 'w-[72px]' : 'w-[260px]',
        className
      )}
    >
      {/* Logo */}
      <div className={cn('flex items-center h-16 px-4 border-b border-border-subtle', collapsed && 'justify-center')}>
        <Link href="/" className="flex items-center gap-2">
          <span className="text-accent-teal font-bold text-xl">D</span>
          {!collapsed && (
            <span className="text-text-primary font-semibold text-sm tracking-wide">
              DUALIS <span className="font-light text-text-secondary">FINANCE</span>
            </span>
          )}
        </Link>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 flex flex-col gap-0.5 p-2 overflow-y-auto">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 h-10 rounded-sm text-sm font-medium transition-colors',
                collapsed ? 'justify-center px-2' : 'px-4',
                active
                  ? 'bg-accent-teal-muted text-accent-teal border-l-[3px] border-accent-teal'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover border-l-[3px] border-transparent'
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Divider */}
      <div className="mx-4 border-t border-border-subtle" />

      {/* Bottom */}
      <div className="flex flex-col gap-0.5 p-2">
        {bottomItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 h-10 rounded-sm text-sm text-text-tertiary hover:text-text-secondary hover:bg-bg-hover transition-colors',
              collapsed ? 'justify-center px-2' : 'px-4'
            )}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </Link>
        ))}
      </div>

      {/* Footer */}
      {!collapsed && (
        <div className="px-4 py-3 border-t border-border-subtle">
          <div className="flex items-center gap-2 text-xs text-text-tertiary">
            <span className="h-1.5 w-1.5 rounded-full bg-positive" />
            <span>Canton MainNet</span>
          </div>
          <p className="text-xs text-text-disabled mt-1">v2.0.0</p>
        </div>
      )}
    </aside>
  );
}

export { Sidebar, type SidebarProps };
