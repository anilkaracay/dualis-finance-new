'use client';

import { useEffect } from 'react';
import { Command } from 'cmdk';
import {
  Search,
  Zap,
  TrendingUp,
  LayoutDashboard,
  Settings,
  Wallet,
  Handshake,
  Star,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigate?: (href: string) => void;
}

function CommandPalette({ open, onOpenChange, onNavigate }: CommandPaletteProps) {
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [open, onOpenChange]);

  const handleSelect = (href: string) => {
    onOpenChange(false);
    onNavigate?.(href);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 glass"
            onClick={() => onOpenChange(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="fixed left-1/2 top-[20%] z-50 w-full max-w-[640px] -translate-x-1/2"
          >
            <Command
              className="rounded-lg border border-border-default bg-bg-tertiary shadow-xl overflow-hidden"
            >
              <div className="flex items-center gap-3 border-b border-border-default px-4">
                <Search className="h-5 w-5 text-text-tertiary shrink-0" />
                <Command.Input
                  placeholder="Search actions, markets, pages..."
                  className="h-14 flex-1 bg-transparent text-lg text-text-primary placeholder:text-text-disabled outline-none"
                />
              </div>
              <Command.List className="max-h-[400px] overflow-y-auto p-2">
                <Command.Empty className="py-8 text-center text-sm text-text-tertiary">
                  No results found.
                </Command.Empty>

                <Command.Group heading="Quick Actions" className="px-2 py-1.5 text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                  <Command.Item
                    onSelect={() => handleSelect('/borrow')}
                    className="flex items-center gap-3 h-11 px-3 rounded-sm text-sm text-text-primary cursor-pointer data-[selected=true]:bg-bg-hover"
                  >
                    <Zap className="h-4 w-4 text-accent-teal" />
                    Deposit Assets
                  </Command.Item>
                  <Command.Item
                    onSelect={() => handleSelect('/borrow')}
                    className="flex items-center gap-3 h-11 px-3 rounded-sm text-sm text-text-primary cursor-pointer data-[selected=true]:bg-bg-hover"
                  >
                    <Wallet className="h-4 w-4 text-accent-indigo" />
                    Borrow
                  </Command.Item>
                  <Command.Item
                    onSelect={() => handleSelect('/borrow')}
                    className="flex items-center gap-3 h-11 px-3 rounded-sm text-sm text-text-primary cursor-pointer data-[selected=true]:bg-bg-hover"
                  >
                    <Handshake className="h-4 w-4 text-warning" />
                    Repay Loan
                  </Command.Item>
                </Command.Group>

                <Command.Separator className="my-1 h-px bg-border-subtle" />

                <Command.Group heading="Pages" className="px-2 py-1.5 text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                  <Command.Item onSelect={() => handleSelect('/overview')} className="flex items-center gap-3 h-11 px-3 rounded-sm text-sm text-text-primary cursor-pointer data-[selected=true]:bg-bg-hover">
                    <LayoutDashboard className="h-4 w-4 text-text-tertiary" />
                    Dashboard
                  </Command.Item>
                  <Command.Item onSelect={() => handleSelect('/markets')} className="flex items-center gap-3 h-11 px-3 rounded-sm text-sm text-text-primary cursor-pointer data-[selected=true]:bg-bg-hover">
                    <TrendingUp className="h-4 w-4 text-text-tertiary" />
                    Markets
                  </Command.Item>
                  <Command.Item onSelect={() => handleSelect('/credit')} className="flex items-center gap-3 h-11 px-3 rounded-sm text-sm text-text-primary cursor-pointer data-[selected=true]:bg-bg-hover">
                    <Star className="h-4 w-4 text-text-tertiary" />
                    Credit Score
                  </Command.Item>
                  <Command.Item onSelect={() => handleSelect('/settings')} className="flex items-center gap-3 h-11 px-3 rounded-sm text-sm text-text-primary cursor-pointer data-[selected=true]:bg-bg-hover">
                    <Settings className="h-4 w-4 text-text-tertiary" />
                    Settings
                  </Command.Item>
                </Command.Group>
              </Command.List>
            </Command>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export { CommandPalette, type CommandPaletteProps };
