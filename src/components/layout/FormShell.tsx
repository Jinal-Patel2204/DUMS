'use client';

import { type ReactNode } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Skeleton from '@mui/material/Skeleton';
import SaveOutlined from '@mui/icons-material/SaveOutlined';
import CloseOutlined from '@mui/icons-material/CloseOutlined';

// ─── TYPES ─────────────────────────────────────────────

export interface FormSection {
  title: string;
  icon?: ReactNode;
  content: ReactNode;
}

export interface FormShellProps {
  // Header
  title: string;
  subtitle?: string;

  // Form sections (left side)
  sections: FormSection[];

  // Preview panel (right side, optional)
  preview?: ReactNode;

  // Actions
  onSubmit: () => void;
  onCancel: () => void;
  submitLabel?: string;
  cancelLabel?: string;
  isSubmitting?: boolean;

  // Error
  error?: string | null;

  // Loading
  isLoading?: boolean;
}

// ─── LOADING ───────────────────────────────────────────

function FormSkeleton() {
  return (
    <Box>
      <Skeleton variant="text" width={200} height={36} sx={{ mb: 0.5 }} />
      <Skeleton variant="text" width={300} height={18} sx={{ mb: 3 }} />
      <Box sx={{ display: 'flex', gap: 3 }}>
        <Box sx={{ flex: 1 }}>
          <Skeleton variant="rounded" height={200} sx={{ mb: 2 }} />
          <Skeleton variant="rounded" height={150} sx={{ mb: 2 }} />
          <Skeleton variant="rounded" height={100} />
        </Box>
        <Skeleton variant="rounded" width={300} height={400} sx={{ display: { xs: 'none', lg: 'block' } }} />
      </Box>
    </Box>
  );
}

// ─── MAIN COMPONENT ────────────────────────────────────

export function FormShell({
  title,
  subtitle,
  sections,
  preview,
  onSubmit,
  onCancel,
  submitLabel = 'Save',
  cancelLabel = 'Cancel',
  isSubmitting = false,
  error,
  isLoading,
}: FormShellProps) {
  if (isLoading) return <FormSkeleton />;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 2 }}>
        <Typography sx={{ fontWeight: 700, fontSize: '1.5rem', lineHeight: 1.3 }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {subtitle}
          </Typography>
        )}
      </Box>

      {/* Accent line */}
      <Box sx={{ height: 3, bgcolor: 'secondary.main', borderRadius: 1, mb: 3 }} />

      {/* Error */}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Content: Form + Preview */}
      <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start' }}>
        {/* Left: Form Sections */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {sections.map((section, idx) => (
            <Box
              key={idx}
              sx={{
                bgcolor: 'background.paper',
                borderRadius: 3,
                border: 1,
                borderColor: 'divider',
                p: 3,
                mb: 2,
              }}
            >
              {/* Section Header */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
                {section.icon && (
                  <Box sx={{
                    width: 32,
                    height: 32,
                    borderRadius: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'secondary.main',
                    color: 'white',
                    '& > *': { fontSize: 18 },
                  }}>
                    {section.icon}
                  </Box>
                )}
                <Typography sx={{ fontWeight: 600, fontSize: '1rem' }}>
                  {section.title}
                </Typography>
              </Box>

              {/* Section Content */}
              {section.content}
            </Box>
          ))}

          {/* Action Buttons (sticky bottom) */}
          <Box sx={{
            display: 'flex',
            gap: 1.5,
            pt: 2,
            pb: 1,
            position: 'sticky',
            bottom: 0,
            bgcolor: 'background.default',
            zIndex: 1,
          }}>
            <Button
              variant="contained"
              startIcon={<SaveOutlined sx={{ fontSize: 18 }} />}
              onClick={onSubmit}
              disabled={isSubmitting}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                borderRadius: 2,
                px: 3,
                boxShadow: 'none',
              }}
            >
              {isSubmitting ? 'Saving...' : submitLabel}
            </Button>
            <Button
              variant="text"
              startIcon={<CloseOutlined sx={{ fontSize: 16 }} />}
              onClick={onCancel}
              sx={{
                textTransform: 'none',
                fontWeight: 500,
                color: 'text.secondary',
              }}
            >
              {cancelLabel}
            </Button>
          </Box>
        </Box>

        {/* Right: Preview Panel */}
        {preview && (
          <Box sx={{
            width: 320,
            flexShrink: 0,
            position: 'sticky',
            top: 16,
            display: { xs: 'none', lg: 'block' },
          }}>
            <Box sx={{
              bgcolor: 'background.paper',
              borderRadius: 3,
              border: 1,
              borderColor: 'divider',
              p: 3,
            }}>
              {preview}
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
}
