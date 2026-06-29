'use client';

import { useState, useCallback, createContext, useContext, type ReactNode } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import WarningAmberOutlined from '@mui/icons-material/WarningAmberOutlined';
import Box from '@mui/material/Box';

interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  severity?: 'error' | 'warning' | 'info';
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | null>(null);

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) throw new Error('useConfirm must be used within ConfirmProvider');
  return context;
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [resolveRef, setResolveRef] = useState<((value: boolean) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    setOptions(opts);
    setOpen(true);
    return new Promise<boolean>((resolve) => {
      setResolveRef(() => resolve);
    });
  }, []);

  const handleConfirm = () => {
    setOpen(false);
    resolveRef?.(true);
  };

  const handleCancel = () => {
    setOpen(false);
    resolveRef?.(false);
  };

  const severityColor = options?.severity === 'error' ? 'error.main' : options?.severity === 'warning' ? 'warning.main' : 'info.main';

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <Dialog open={open} onClose={handleCancel} maxWidth="xs" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <WarningAmberOutlined sx={{ color: severityColor }} />
            {options?.title}
          </Box>
        </DialogTitle>
        <DialogContent>
          <DialogContentText>{options?.message}</DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCancel} variant="outlined">
            {options?.cancelLabel || 'Cancel'}
          </Button>
          <Button
            onClick={handleConfirm}
            variant="contained"
            color={options?.severity === 'error' ? 'error' : options?.severity === 'warning' ? 'warning' : 'primary'}
            autoFocus
          >
            {options?.confirmLabel || 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>
    </ConfirmContext.Provider>
  );
}
