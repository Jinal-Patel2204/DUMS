'use client';

import { type ReactNode } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Divider from '@mui/material/Divider';
import Skeleton from '@mui/material/Skeleton';
import Alert from '@mui/material/Alert';

// ─── TYPES ─────────────────────────────────────────────

export interface DetailAction {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  variant?: 'contained' | 'outlined';
  color?: 'primary' | 'error' | 'success' | 'warning';
  disabled?: boolean;
}

export interface DetailField {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  mono?: boolean;
  large?: boolean;
}

export interface DetailSection {
  title?: string;
  fields: DetailField[];
}

export interface DetailShellProps {
  // Page title (above card)
  pageTitle: string;

  // Card header
  heading: string;
  status?: { label: string; color: 'warning' | 'success' | 'error' | 'info' | 'default' };
  actions?: DetailAction[];

  // Content: left + right columns
  leftFields?: DetailField[];
  rightFields?: DetailField[];

  // Extra sections below main grid
  extraSections?: DetailSection[];

  // Footer content (custom)
  footer?: ReactNode;

  // States
  isLoading?: boolean;
  error?: string | null;

  // Accent color for left border
  accentColor?: string;
}

// ─── FIELD RENDERER ────────────────────────────────────

function FieldItem({ field }: { field: DetailField }) {
  return (
    <Box sx={{ mb: 2.5 }}>
      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
        {field.label}
      </Typography>
      {field.large ? (
        <Typography sx={{ fontWeight: 700, fontSize: '1.75rem', lineHeight: 1.3 }}>
          {field.value}
        </Typography>
      ) : (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.25 }}>
          {field.icon}
          <Typography sx={{
            fontWeight: 600,
            fontSize: '0.9375rem',
            ...(field.mono && { fontFamily: 'monospace' }),
          }}>
            {field.value}
          </Typography>
        </Box>
      )}
    </Box>
  );
}

// ─── LOADING ───────────────────────────────────────────

function DetailSkeleton() {
  return (
    <Box>
      <Skeleton variant="text" width={200} height={32} sx={{ mb: 2 }} />
      <Box sx={{ bgcolor: 'background.paper', borderRadius: 3, border: 1, borderColor: 'divider', p: 3 }}>
        <Skeleton variant="text" width={300} height={28} sx={{ mb: 2 }} />
        <Box sx={{ display: 'flex', gap: 4 }}>
          <Box sx={{ flex: 1 }}>
            <Skeleton variant="text" width={80} height={16} />
            <Skeleton variant="text" width={120} height={40} sx={{ mb: 2 }} />
            <Skeleton variant="text" width={80} height={16} />
            <Skeleton variant="text" width={100} height={20} sx={{ mb: 2 }} />
            <Skeleton variant="text" width={80} height={16} />
            <Skeleton variant="text" width={140} height={20} />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Skeleton variant="text" width={80} height={16} />
            <Skeleton variant="text" width={180} height={20} sx={{ mb: 2 }} />
            <Skeleton variant="text" width={80} height={16} />
            <Skeleton variant="text" width={150} height={20} sx={{ mb: 2 }} />
            <Skeleton variant="text" width={80} height={16} />
            <Skeleton variant="text" width={120} height={20} />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

// ─── MAIN COMPONENT ────────────────────────────────────

export function DetailShell({
  pageTitle,
  heading,
  status,
  actions = [],
  leftFields = [],
  rightFields = [],
  extraSections = [],
  footer,
  isLoading,
  error,
  accentColor = 'secondary.main',
}: DetailShellProps) {
  if (isLoading) return <DetailSkeleton />;

  if (error) {
    return (
      <Box>
        <Typography sx={{ fontWeight: 700, fontSize: '1.25rem', mb: 2 }}>{pageTitle}</Typography>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* Page Title */}
      <Typography sx={{ fontWeight: 700, fontSize: '1.25rem', mb: 2 }}>
        {pageTitle}
      </Typography>

      {/* Main Card */}
      <Box sx={{
        bgcolor: 'background.paper',
        borderRadius: 3,
        border: 1,
        borderColor: 'divider',
        borderLeft: '4px solid',
        borderLeftColor: accentColor,
        overflow: 'hidden',
      }}>
        {/* Header: Heading + Status + Actions */}
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 1,
          px: 3,
          py: 2,
          borderBottom: 1,
          borderColor: 'divider',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
              {heading}
            </Typography>
            {status && (
              <Chip
                label={status.label}
                color={status.color}
                size="small"
                sx={{ fontWeight: 600, fontSize: '0.7rem' }}
              />
            )}
          </Box>

          {actions.length > 0 && (
            <Box sx={{ display: 'flex', gap: 1 }}>
              {actions.map((action, idx) => (
                <Button
                  key={idx}
                  variant={action.variant || 'contained'}
                  color={action.color || 'primary'}
                  size="small"
                  startIcon={action.icon}
                  disabled={action.disabled}
                  onClick={action.onClick}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '0.8125rem',
                    px: 2,
                    borderRadius: 2,
                    boxShadow: 'none',
                  }}
                >
                  {action.label}
                </Button>
              ))}
            </Box>
          )}
        </Box>

        {/* Details Grid */}
        <Box sx={{ px: 3, py: 2.5 }}>
          <Grid container spacing={4}>
            {leftFields.length > 0 && (
              <Grid size={{ xs: 12, md: 6 }}>
                {leftFields.map((field, idx) => (
                  <FieldItem key={idx} field={field} />
                ))}
              </Grid>
            )}
            {rightFields.length > 0 && (
              <Grid size={{ xs: 12, md: 6 }}>
                {rightFields.map((field, idx) => (
                  <FieldItem key={idx} field={field} />
                ))}
              </Grid>
            )}
          </Grid>
        </Box>

        {/* Extra Sections */}
        {extraSections.map((section, sIdx) => (
          <Box key={sIdx}>
            <Divider />
            <Box sx={{ px: 3, py: 2 }}>
              {section.title && (
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5, fontWeight: 600 }}>
                  {section.title}
                </Typography>
              )}
              {section.fields.map((field, fIdx) => (
                <FieldItem key={fIdx} field={field} />
              ))}
            </Box>
          </Box>
        ))}

        {/* Footer */}
        {footer && (
          <>
            <Divider />
            <Box sx={{ px: 3, py: 2 }}>
              {footer}
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
}
