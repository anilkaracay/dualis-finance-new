'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils/cn';
import { X } from 'lucide-react';

interface RightPanelProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children?: React.ReactNode;
  className?: string;
}

function RightPanel({ open, onClose, title, children, className }: RightPanelProps) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className={cn(
            'fixed right-0 top-0 z-40 flex h-full w-[360px] flex-col bg-bg-secondary border-l border-border-default shadow-xl',
            className
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-border-subtle shrink-0">
            {title && <h2 className="text-lg font-semibold text-text-primary">{title}</h2>}
            <button onClick={onClose} className="text-text-tertiary hover:text-text-primary transition-colors ml-auto">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {children}
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

export { RightPanel, type RightPanelProps };
