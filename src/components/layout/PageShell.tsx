'use client';

import { type ReactNode } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import TablePagination from '@mui/material/TablePagination';
import Skeleton from '@mui/material/Skeleton';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import FileDownloadOutlined from '@mui/icons-material/FileDownloadOutlined';
import TuneOutlined from '@mui/icons-material/TuneOutlined';

// ─── TYPES ─────────────────────────────────────────────

export interface PageAction {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  variant?: 'contained' | 'outlined';
  color?: 'primary' | 'error' | 'success' | 'warning';
}

export interface PageTab {
  label: string;
  count?: number;
}

export interface PageStat {
  label: string;
  value: string | number;
  color?: string;
}

export interface PageShellProps {
  title: string;
  subtitle?: string;
  actions?: PageAction[];
  onExport?: () => void;
  tabs?: PageTab[];
  activeTab?: number;
  onTabChange?: (tab: number) => void;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  filters?: ReactNode;
  onAdvancedFilters?: () => void;
  resultCount?: number;
  stats?: PageStat[];
  isLoading?: boolean;
  error?: string | null;
  totalCount?: number;
  page?: number;
  rowsPerPage?: number;
  onPageChange?: (page: number) => void;
  onRowsPerPageChange?: (rows: number) => void;
  rowsPerPageOptions?: number[];
  emptyIcon?: ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: { label: string; onClick: () => void };
  children?: ReactNode;
  isEmpty?: boolean;
}

// ─── LOADING ───────────────────────────────────────────

function PageSkeleton() {
  return (
    <Box sx={{ bgcolor: 'background.paper', borderRadius: 3, border: 1, borderColor: 'divider', p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Skeleton variant="text" width={180} height={36} />
          <Skeleton variant="text" width={250} height={18} />
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Skeleton variant="rounded" width={90} height={36} />
          <Skeleton variant="rounded" width={150} height={36} />
        </Box>
      </Box>
      <Skeleton variant="rounded" width={350} height={36} sx={{ mb: 2 }} />
      <Skeleton variant="rounded" width="100%" height={36} sx={{ mb: 2 }} />
      {[1, 2, 3, 4, 5].map((i) => (
        <Skeleton key={i} variant="rounded" height={52} sx={{ mb: 1 }} />
      ))}
    </Box>
  );
}

// ─── MAIN COMPONENT ────────────────────────────────────

export function PageShell({
  title,
  subtitle,
  actions = [],
  onExport,
  tabs,
  activeTab = 0,
  onTabChange,
  searchPlaceholder = 'Search...',
  searchValue = '',
  onSearchChange,
  filters,
  onAdvancedFilters,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  resultCount: _rc,
  stats,
  isLoading,
  error,
  totalCount,
  page = 0,
  rowsPerPage = 15,
  onPageChange,
  onRowsPerPageChange,
  rowsPerPageOptions = [15, 25, 50],
  emptyIcon,
  emptyTitle,
  emptyDescription,
  emptyAction,
  children,
  isEmpty,
}: PageShellProps) {
  if (isLoading) return <PageSkeleton />;

  if (error) {
    return (
      <Box sx={{ bgcolor: 'background.paper', borderRadius: 3, border: 1, borderColor: 'divider', p: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>{title}</Typography>
        <Box sx={{ py: 6, textAlign: 'center' }}>
          <Typography color="error">{error}</Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{
      bgcolor: 'background.paper',
      borderRadius: 3,
      border: 1,
      borderColor: 'divider',
      overflow: 'hidden',
    }}>
      {/* ─── HEADER: Title + Actions ─────────────── */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', px: 3, pt: 3, pb: 2 }}>
        <Box>
          <Typography sx={{ fontWeight: 700, fontSize: '1.5rem', lineHeight: 1.3 }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
          {onExport && (
            <Button
              variant="outlined"
              startIcon={<FileDownloadOutlined sx={{ fontSize: '1.1rem' }} />}
              onClick={onExport}
              sx={{
                textTransform: 'none',
                fontWeight: 500,
                fontSize: '0.875rem',
                borderColor: 'divider',
                color: 'text.primary',
                px: 2,
                py: 0.75,
                borderRadius: 2,
                '&:hover': { borderColor: 'text.secondary', bgcolor: 'action.hover' },
              }}
            >
              Export
            </Button>
          )}
          {actions.map((action, idx) => (
            <Button
              key={idx}
              variant={action.variant || 'contained'}
              color={action.color || 'primary'}
              startIcon={action.icon}
              onClick={action.onClick}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.875rem',
                px: 2.5,
                py: 0.75,
                borderRadius: 2,
                boxShadow: 'none',
                '&:hover': { boxShadow: '0 2px 8px rgba(99,102,241,0.3)' },
              }}
            >
              {action.label}
            </Button>
          ))}
        </Box>
      </Box>

      {/* ─── TABS ───────────────────────────────────── */}
      {tabs && tabs.length > 0 && (
        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}>
          <Tabs
            value={activeTab}
            onChange={(_, v) => onTabChange?.(v)}
            sx={{ minHeight: 40 }}
          >
            {tabs.map((t, idx) => (
              <Tab
                key={idx}
                label={t.count != null ? `${t.label} (${t.count})` : t.label}
              />
            ))}
          </Tabs>
        </Box>
      )}

      {/* ─── FILTER ROW + STATS ─────────────────────── */}
      {(onSearchChange || filters || stats) && (
        <Box sx={{
          display: 'flex',
          gap: 1.5,
          flexWrap: 'wrap',
          alignItems: 'center',
          px: 3,
          py: 2,
        }}>
          {onSearchChange && (
            <TextField
              size="small"
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchOutlined sx={{ fontSize: 18, color: 'text.disabled' }} />
                    </InputAdornment>
                  ),
                },
              }}
              sx={{ width: 220 }}
            />
          )}

          {filters}

          {/* Stats — right aligned */}
          {stats && stats.length > 0 && (
            <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 3, ml: 'auto', alignItems: 'center' }}>
              {stats.map((stat, idx) => (
                <Box key={idx} sx={{ textAlign: 'right' }}>
                  <Typography sx={{ fontSize: '0.6875rem', color: 'text.secondary', lineHeight: 1.2 }}>
                    {stat.label}
                  </Typography>
                  <Typography sx={{ fontWeight: 700, fontSize: '0.9375rem', color: stat.color || 'text.primary', lineHeight: 1.4 }}>
                    {stat.value}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}

          {/* Advanced Filters */}
          {onAdvancedFilters && (
            <Button
              size="small"
              variant="outlined"
              startIcon={<TuneOutlined sx={{ fontSize: 16 }} />}
              onClick={onAdvancedFilters}
              sx={{
                textTransform: 'none',
                fontWeight: 500,
                fontSize: '0.8125rem',
                borderColor: 'divider',
                color: 'text.secondary',
                ml: stats ? 0 : 'auto',
              }}
            >
              Advanced Filters
            </Button>
          )}
        </Box>
      )}

      {/* ─── TABLE / CONTENT ────────────────────────── */}
      {isEmpty ? (
        <Box sx={{ py: 10, textAlign: 'center' }}>
          {emptyIcon && (
            <Box sx={{ mb: 1.5, color: 'text.disabled', '& > *': { fontSize: 48 } }}>
              {emptyIcon}
            </Box>
          )}
          <Typography variant="subtitle1" color="text.secondary" sx={{ fontWeight: 500 }}>
            {emptyTitle || 'No data found'}
          </Typography>
          {emptyDescription && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
              {emptyDescription}
            </Typography>
          )}
          {emptyAction && (
            <Button variant="contained" size="small" onClick={emptyAction.onClick} sx={{ textTransform: 'none' }}>
              {emptyAction.label}
            </Button>
          )}
        </Box>
      ) : (
        <>
          {children}

          {totalCount != null && onPageChange && onRowsPerPageChange && (
            <TablePagination
              component="div"
              count={totalCount}
              page={page}
              onPageChange={(_, p) => onPageChange(p)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => onRowsPerPageChange(parseInt(e.target.value))}
              rowsPerPageOptions={rowsPerPageOptions}
              sx={{ borderTop: 1, borderColor: 'divider', px: 1 }}
            />
          )}
        </>
      )}
    </Box>
  );
}
