'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface AdminConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void | Promise<void>;
  destructive?: boolean;
  /** If set, user must type this exact string to confirm */
  typeToConfirm?: string;
  loading?: boolean;
}

export function AdminConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  destructive = false,
  typeToConfirm,
  loading = false,
}: AdminConfirmDialogProps) {
  const [confirmInput, setConfirmInput] = useState('');

  const canConfirm = typeToConfirm ? confirmInput === typeToConfirm : true;

  const handleConfirm = async () => {
    await onConfirm();
    setConfirmInput('');
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) setConfirmInput('');
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {typeToConfirm && (
          <div className="py-3">
            <p className="text-xs text-text-secondary mb-2">
              Type <span className="font-mono font-semibold text-text-primary">{typeToConfirm}</span> to confirm:
            </p>
            <Input
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              placeholder={typeToConfirm}
              className="font-mono text-sm"
            />
          </div>
        )}

        <DialogFooter>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleOpenChange(false)}
            disabled={loading}
          >
            {cancelText}
          </Button>
          <Button
            variant={destructive ? 'danger' : 'primary'}
            size="sm"
            onClick={handleConfirm}
            disabled={!canConfirm || loading}
            loading={loading}
          >
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
