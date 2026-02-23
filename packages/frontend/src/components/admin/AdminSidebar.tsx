'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import { useAdminRole } from '@/hooks/useAdminRole';
import { useAuthStore } from '@/stores/useAuthStore';
import {
  LayoutDashboard,
  Database,
  Users,
  Activity,
  ShieldCheck,
  BarChart3,
  FileText,
  Settings,
  LogOut,
  ChevronLeft,
} from 'lucide-react';
import * as Tooltip from '@radix-ui/react-tooltip';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

interface NavItem {
  href: string;
  icon: React.ElementType;
  label: string;
  requiredRole?: 'admin' | 'compliance';
  badge?: number;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/pools', icon: Database, label: 'Pools' },
  { href: '/admin/users', icon: Users, label: 'Users' },
  { href: '/admin/oracle', icon: Activity, label: 'Oracle' },
  { href: '/admin/compliance', icon: ShieldCheck, label: 'Compliance', requiredRole: 'compliance' },
  { href: '/admin/reports', icon: BarChart3, label: 'Reports' },
  { href: '/admin/audit', icon: FileText, label: 'Audit Log', requiredRole: 'admin' },
  { href: '/admin/settings', icon: Settings, label: 'Settings', requiredRole: 'admin' },
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
          ? 'bg-accent-teal/10 text-accent-teal'
          : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
      )}
    >
      <item.icon className="h-4 w-4 shrink-0" />
      {!collapsed && (
        <span className="truncate flex-1">{item.label}</span>
      )}
      {!collapsed && item.badge != null && item.badge > 0 && (
        <span className="ml-auto bg-negative/20 text-negative text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
          {item.badge}
        </span>
      )}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip.Root delayDuration={0}>
        <Tooltip.Trigger asChild>{content}</Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            side="right"
            sideOffset={8}
            className="rounded-md bg-bg-elevated px-3 py-1.5 text-xs font-medium text-text-primary shadow-elevated border border-border-default z-50"
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

export function AdminSidebar({ collapsed, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname();
  const { role, isAdmin, canManageCompliance } = useAdminRole();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const filteredItems = NAV_ITEMS.filter((item) => {
    if (!item.requiredRole) return true;
    if (item.requiredRole === 'admin') return isAdmin;
    if (item.requiredRole === 'compliance') return canManageCompliance;
    return false;
  });

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  };

  const roleBadge = role === 'admin' ? 'Admin' : role === 'compliance_officer' ? 'Compliance' : 'Viewer';
  const roleBadgeColor =
    role === 'admin'
      ? 'bg-negative/10 text-negative'
      : role === 'compliance_officer'
        ? 'bg-warning/10 text-warning'
        : 'bg-info/10 text-info';

  return (
    <Tooltip.Provider>
      <aside
        className={cn(
          'flex flex-col h-full border-r border-border-default bg-bg-tertiary transition-all duration-200',
          collapsed ? 'w-16' : 'w-60'
        )}
      >
        {/* Header */}
        <div className={cn('flex items-center h-16 border-b border-border-default shrink-0', collapsed ? 'justify-center px-2' : 'px-4 gap-3')}>
          {!collapsed && (
            <>
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-md bg-accent-teal/20 flex items-center justify-center">
                  <span className="text-accent-teal font-bold text-sm">D</span>
                </div>
                <div>
                  <span className="text-sm font-semibold text-text-primary">Dualis</span>
                  <span className="ml-1.5 text-[10px] font-medium text-text-tertiary uppercase tracking-wider">Admin</span>
                </div>
              </div>
            </>
          )}
          <button
            onClick={onToggleCollapse}
            className={cn(
              'h-7 w-7 rounded-sm flex items-center justify-center text-text-tertiary hover:text-text-primary hover:bg-bg-hover transition-colors',
              collapsed ? '' : 'ml-auto'
            )}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <ChevronLeft className={cn('h-4 w-4 transition-transform', collapsed && 'rotate-180')} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
          {filteredItems.map((item) => (
            <NavItemLink
              key={item.href}
              item={item}
              active={isActive(item.href)}
              collapsed={collapsed}
            />
          ))}
        </nav>

        {/* User section */}
        <div className={cn('border-t border-border-default p-3 shrink-0', collapsed && 'px-2')}>
          {!collapsed ? (
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-bg-hover flex items-center justify-center text-xs font-medium text-text-secondary shrink-0">
                {user?.displayName?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? 'A'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-text-primary truncate">
                  {user?.displayName ?? user?.email ?? 'Admin'}
                </p>
                <span className={cn('inline-block mt-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-sm', roleBadgeColor)}>
                  {roleBadge}
                </span>
              </div>
              <button
                onClick={() => logout()}
                className="h-7 w-7 rounded-sm flex items-center justify-center text-text-tertiary hover:text-negative hover:bg-negative/10 transition-colors"
                title="Logout"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <Tooltip.Root delayDuration={0}>
              <Tooltip.Trigger asChild>
                <button
                  onClick={() => logout()}
                  className="h-8 w-8 rounded-sm flex items-center justify-center text-text-tertiary hover:text-negative hover:bg-negative/10 transition-colors mx-auto"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content
                  side="right"
                  sideOffset={8}
                  className="rounded-md bg-bg-elevated px-3 py-1.5 text-xs font-medium text-text-primary shadow-elevated border border-border-default z-50"
                >
                  Logout
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>
          )}
        </div>
      </aside>
    </Tooltip.Provider>
  );
}
