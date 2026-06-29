'use client';

import { usePathname } from 'next/navigation';
import NextLink from 'next/link';
import MuiBreadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import HomeOutlined from '@mui/icons-material/HomeOutlined';
import NavigateNextOutlined from '@mui/icons-material/NavigateNextOutlined';
import Box from '@mui/material/Box';

const routeLabels: Record<string, string> = {
  store: 'Store',
  customer: 'Portal',
  dashboard: 'Dashboard',
  customers: 'Customers',
  bills: 'Bills',
  payments: 'Payments',
  products: 'Products',
  inventory: 'Inventory',
  installments: 'Installments',
  reports: 'Reports',
  'audit-logs': 'Audit Logs',
  notifications: 'Notifications',
  settings: 'Settings',
  'shop-info': 'Shop Info',
  payment: 'Payment Config',
  smtp: 'SMTP',
  reminders: 'Reminders',
  new: 'New',
  profile: 'Profile',
  ledger: 'Ledger',
  movements: 'Movements',
  purchases: 'Purchases',
};

export function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  // Don't show breadcrumbs on dashboard
  if (segments.length <= 2) return null;

  // Skip route groups like (owner) and (customer)
  const cleanSegments = segments.filter((s) => !s.startsWith('('));

  const items = cleanSegments.map((segment, index) => {
    const href = '/' + cleanSegments.slice(0, index + 1).join('/');
    const isLast = index === cleanSegments.length - 1;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}/.test(segment);

    const label = isUuid ? 'Detail' : routeLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);

    if (isLast) {
      return (
        <Typography key={href} variant="body2" color="text.primary" sx={{ fontWeight: 500 }}>
          {label}
        </Typography>
      );
    }

    return (
      <Link
        key={href}
        component={NextLink}
        href={href}
        variant="body2"
        color="text.secondary"
        underline="hover"
      >
        {label}
      </Link>
    );
  });

  return (
    <Box sx={{ mb: 2 }}>
      <MuiBreadcrumbs separator={<NavigateNextOutlined sx={{ fontSize: 16 }} />} sx={{ fontSize: 13 }}>
        <Link component={NextLink} href={segments[0] === 'customer' ? '/customer/dashboard' : '/store/dashboard'} color="text.secondary" underline="hover">
          <HomeOutlined sx={{ fontSize: 16, verticalAlign: 'middle' }} />
        </Link>
        {items}
      </MuiBreadcrumbs>
    </Box>
  );
}
