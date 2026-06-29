'use client';

import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';

interface PageLoadingProps {
  title?: string;
  rows?: number;
  variant?: 'table' | 'form' | 'cards' | 'detail';
}

export function PageLoading({ title, rows = 5, variant = 'table' }: PageLoadingProps) {
  if (variant === 'cards') {
    return (
      <Box>
        {title && <Typography variant="h5" sx={{ mb: 3 }}>{title}</Typography>}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }, gap: 2 }}>
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} variant="rounded" height={100} />
          ))}
        </Box>
        <Box sx={{ mt: 3 }}>
          <Skeleton variant="rounded" height={300} />
        </Box>
      </Box>
    );
  }

  if (variant === 'form') {
    return (
      <Box>
        {title && <Typography variant="h5" sx={{ mb: 3 }}>{title}</Typography>}
        <Skeleton variant="rounded" height={56} sx={{ mb: 2, maxWidth: 600 }} />
        <Skeleton variant="rounded" height={56} sx={{ mb: 2, maxWidth: 600 }} />
        <Skeleton variant="rounded" height={56} sx={{ mb: 2, maxWidth: 400 }} />
        <Skeleton variant="rounded" height={100} sx={{ mb: 2, maxWidth: 600 }} />
        <Skeleton variant="rounded" height={40} sx={{ maxWidth: 120 }} />
      </Box>
    );
  }

  if (variant === 'detail') {
    return (
      <Box>
        <Skeleton variant="rounded" height={40} sx={{ mb: 2, width: 200 }} />
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
          <Skeleton variant="rounded" height={200} />
          <Skeleton variant="rounded" height={200} />
        </Box>
        <Skeleton variant="rounded" height={300} sx={{ mt: 3 }} />
      </Box>
    );
  }

  return (
    <Box>
      {title && <Typography variant="h5" sx={{ mb: 3 }}>{title}</Typography>}
      <Skeleton variant="rounded" height={48} sx={{ mb: 2 }} />
      {[...Array(rows)].map((_, i) => (
        <Skeleton key={i} variant="rounded" height={50} sx={{ mb: 1 }} />
      ))}
    </Box>
  );
}
