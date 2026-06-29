'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import InboxOutlined from '@mui/icons-material/InboxOutlined';

interface EmptyStateProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export function EmptyState({ title, description, actionLabel, onAction, icon }: EmptyStateProps) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 6, px: 3 }}>
      <Box sx={{ color: 'text.disabled', mb: 2 }}>
        {icon || <InboxOutlined sx={{ fontSize: 64 }} />}
      </Box>
      <Typography variant="h6" color="text.secondary" gutterBottom>
        {title}
      </Typography>
      {description && (
        <Typography variant="body2" color="text.disabled" sx={{ mb: 2, textAlign: 'center', maxWidth: 400 }}>
          {description}
        </Typography>
      )}
      {actionLabel && onAction && (
        <Button variant="contained" onClick={onAction} sx={{ mt: 1 }}>
          {actionLabel}
        </Button>
      )}
    </Box>
  );
}
