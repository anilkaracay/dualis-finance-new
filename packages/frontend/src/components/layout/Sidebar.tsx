'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import {
  LayoutDashboard,
  BarChart3,
  ArrowDownToLine,
  Shield,
  CreditCard,
  Vote,
  Coins,
  PieChart,
  Settings,
  BookOpen,
  ChevronLeft,
} from 'lucide-react';
import * as Tooltip from '@radix-ui/react-tooltip';

interface SidebarProps {
  collapsed?: boolean | undefined;
  onToggleCollapse?: (() => void) | undefined;
  className?: string | undefined;
}

interface NavSection {
  label: string;
  items: readonly NavItem[];
}

interface NavItem {
  href: string;
  icon: React.ElementType;
  label: string;
}

const navSections: readonly NavSection[] = [
  {
    label: 'PROTOCOL',
    items: [
      { href: '/overview', icon: LayoutDashboard, label: 'Dashboard' },
      { href: '/markets', icon: BarChart3, label: 'Markets' },
      { href: '/borrow', icon: ArrowDownToLine, label: 'Borrow' },
      { href: '/sec-lending', icon: Shield, label: 'Securities Lending' },
      { href: '/credit', icon: CreditCard, label: 'Credit' },
    ],
  },
  {
    label: 'GOVERNANCE',
    items: [
      { href: '/governance', icon: Vote, label: 'Governance' },
      { href: '/staking', icon: Coins, label: 'Staking' },
    ],
  },
  {
    label: 'ACCOUNT',
    items: [
      { href: '/portfolio', icon: PieChart, label: 'Portfolio' },
      { href: '/settings', icon: Settings, label: 'Settings' },
    ],
  },
];

function NavItemLink({
  item,
  active,
  collapsed,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
}) {
  const content = (
    <Link
      href={item.href}
      className={cn(
        'flex items-center gap-2 h-9 rounded-sm text-[13px] font-medium transition-colors duration-150',
        collapsed ? 'justify-center w-10 mx-auto' : 'px-3',
        active
          ? 'bg-accent-teal-subtle text-accent-teal font-semibold'
          : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
      )}
    >
      <item.icon
        className={cn(
          'h-[18px] w-[18px] shrink-0',
          active ? 'text-accent-teal' : 'text-text-tertiary'
        )}
        strokeWidth={1.5}
      />
      {!collapsed && <span>{item.label}</span>}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip.Root delayDuration={200}>
        <Tooltip.Trigger asChild>{content}</Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            side="right"
            sideOffset={8}
            className="z-50 rounded-sm bg-bg-elevated border border-border-default px-3 py-1.5 text-xs text-text-secondary shadow-md"
          >
            {item.label}
            <Tooltip.Arrow className="fill-bg-elevated" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    );
  }

  return content;
}

function Sidebar({ collapsed = false, onToggleCollapse, className }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/overview') return pathname === '/overview';
    return pathname.startsWith(href);
  };

  return (
    <Tooltip.Provider>
      <aside
        className={cn(
          'flex flex-col h-full bg-bg-secondary border-r border-border-default transition-all duration-200',
          collapsed ? 'w-16' : 'w-60',
          className
        )}
      >
        {/* Logo area — aligned with topbar height (56px) */}
        <div
          className={cn(
            'flex items-center h-14 shrink-0',
            collapsed ? 'justify-center px-2' : 'justify-between px-3'
          )}
        >
          <Link href="/" className="flex items-center gap-2">
            {collapsed ? (
              <span className="flex items-center justify-center h-8 w-8 rounded-md bg-accent-teal text-white text-xs font-bold">
                D
              </span>
            ) : (
              <div className="flex flex-col">
                <span className="text-text-primary font-bold text-[16px] tracking-wide leading-none">
                  DUALIS
                </span>
                <span className="text-text-tertiary font-light text-[9px] tracking-[0.2em] leading-none mt-0.5">
                  FINANCE
                </span>
              </div>
            )}
          </Link>
          {!collapsed && onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="flex items-center justify-center h-7 w-7 rounded-sm text-text-tertiary hover:text-text-primary hover:bg-bg-hover transition-colors duration-150"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Navigation sections */}
        <nav className="flex-1 flex flex-col gap-0.5 overflow-y-auto px-2 pb-2">
          {navSections.map((section) => (
            <div key={section.label} className="mt-4 first:mt-2">
              {!collapsed && (
                <div className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-text-disabled select-none">
                  {section.label}
                </div>
              )}
              {collapsed && <div className="mx-3 border-t border-border-subtle my-2" />}

              <div className="flex flex-col gap-0.5">
                {section.items.map((item) => (
                  <NavItemLink
                    key={item.href}
                    item={item}
                    active={isActive(item.href)}
                    collapsed={collapsed}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom section */}
        <div className="border-t border-border-default">
          {!collapsed ? (
            <div className="flex flex-col gap-1 px-3 py-3">
              <Link
                href="/docs"
                className="flex items-center gap-2 text-xs text-text-tertiary hover:text-text-secondary transition-colors duration-150 py-0.5"
              >
                <BookOpen className="h-3.5 w-3.5" />
                <span>Help & Docs</span>
              </Link>
              <span className="font-mono text-[10px] text-text-disabled mt-1">
                v1.0.0
              </span>
            </div>
          ) : (
            <div className="flex justify-center py-3">
              <Tooltip.Root delayDuration={200}>
                <Tooltip.Trigger asChild>
                  <Link
                    href="/docs"
                    className="flex items-center justify-center h-8 w-8 text-text-tertiary hover:text-text-secondary transition-colors duration-150"
                  >
                    <BookOpen className="h-4 w-4" />
                  </Link>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Content
                    side="right"
                    sideOffset={8}
                    className="z-50 rounded-sm bg-bg-elevated border border-border-default px-3 py-1.5 text-xs text-text-secondary shadow-md"
                  >
                    Help & Docs
                    <Tooltip.Arrow className="fill-bg-elevated" />
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>
            </div>
          )}
        </div>
      </aside>
    </Tooltip.Provider>
  );
}

export { Sidebar, type SidebarProps };
