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
  Factory,
  Building2,
} from 'lucide-react';

interface SidebarProps {
  collapsed?: boolean | undefined;
  className?: string | undefined;
}

const navItems = [
  { href: '/overview', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/markets', icon: TrendingUp, label: 'Markets' },
  { href: '/borrow', icon: Wallet, label: 'Borrow' },
  { href: '/productive', icon: Factory, label: 'Productive' },
  { href: '/sec-lending', icon: Handshake, label: 'Sec Lending' },
  { href: '/credit', icon: Star, label: 'Credit Score' },
  { href: '/governance', icon: Landmark, label: 'Governance' },
  { href: '/staking', icon: Coins, label: 'Staking' },
  { href: '/portfolio', icon: PieChart, label: 'Portfolio' },
  { href: '/institutional', icon: Building2, label: 'Institutional' },
] as const;

const bottomLinks = [
  { href: '/settings', label: 'Settings' },
  { href: '/docs', label: 'Docs' },
  { href: '/support', label: 'Support' },
] as const;

function Sidebar({ collapsed = false, className }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/overview') return pathname === '/overview';
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={cn(
        'flex flex-col h-full bg-bg-primary border-r border-border-subtle transition-all duration-300',
        collapsed ? 'w-[56px]' : 'w-[240px]',
        className
      )}
    >
      {/* Logo */}
      <div className={cn('flex items-center h-14 px-3', collapsed && 'justify-center')}>
        <Link href="/" className="flex items-center gap-2">
          <span className="flex items-center justify-center h-6 w-6 rounded-full bg-accent-teal text-white text-xs font-bold shrink-0">
            D
          </span>
          {!collapsed && (
            <span className="text-text-primary font-semibold text-sm tracking-wide">
              DUALIS
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
                'flex items-center gap-3 h-9 rounded-sm text-sm font-medium transition-colors relative',
                collapsed ? 'justify-center px-2' : 'px-3',
                active
                  ? 'text-text-primary bg-accent-teal-muted/40 border-l-2 border-accent-teal'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover border-l-2 border-transparent'
              )}
            >
              <item.icon className={cn('h-[18px] w-[18px] shrink-0', active && 'text-accent-teal')} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Divider */}
      <div className="mx-3 border-t border-border-subtle" />

      {/* Bottom — text-xs links only, no icons */}
      {!collapsed && (
        <div className="flex flex-col gap-1 p-3">
          {bottomLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-xs text-text-tertiary hover:text-text-secondary transition-colors py-0.5"
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}

      {/* Footer — Network badge */}
      {!collapsed && (
        <div className="px-3 py-2 border-t border-border-subtle">
          <div className="flex items-center gap-1.5 text-xs text-text-tertiary">
            <span className="h-1.5 w-1.5 rounded-full bg-positive shrink-0" />
            <span>Canton MainNet</span>
          </div>
        </div>
      )}
    </aside>
  );
}

export { Sidebar, type SidebarProps };
