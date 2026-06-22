'use client';

import { usePathname } from 'next/navigation';
import NextLink from 'next/link';
import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import DashboardOutlined from '@mui/icons-material/DashboardOutlined';
import ReceiptOutlined from '@mui/icons-material/ReceiptOutlined';
import PaymentsOutlined from '@mui/icons-material/PaymentsOutlined';
import AccountBalanceOutlined from '@mui/icons-material/AccountBalanceOutlined';
import CalendarMonthOutlined from '@mui/icons-material/CalendarMonthOutlined';
import NotificationsOutlined from '@mui/icons-material/NotificationsOutlined';
import PersonOutlined from '@mui/icons-material/PersonOutlined';

const DRAWER_WIDTH = 260;

const navItems = [
  { label: 'Dashboard', icon: <DashboardOutlined />, path: '/customer/dashboard' },
  { label: 'Bills', icon: <ReceiptOutlined />, path: '/customer/bills' },
  { label: 'Payments', icon: <PaymentsOutlined />, path: '/customer/payments' },
  { label: 'Ledger', icon: <AccountBalanceOutlined />, path: '/customer/ledger' },
  { label: 'Installments', icon: <CalendarMonthOutlined />, path: '/customer/installments' },
  { divider: true, label: '', icon: null, path: '' },
  { label: 'Notifications', icon: <NotificationsOutlined />, path: '/customer/notifications' },
  { label: 'Profile', icon: <PersonOutlined />, path: '/customer/profile' },
];

interface CustomerSidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function CustomerSidebar({ mobileOpen, onMobileClose }: CustomerSidebarProps) {
  const pathname = usePathname();

  const content = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }} color="primary">DUMS</Typography>
        <Typography variant="caption" color="text.secondary">Customer Portal</Typography>
      </Box>
      <List sx={{ flex: 1, px: 1, py: 1 }}>
        {navItems.map((item, idx) =>
          'divider' in item && item.divider ? (
            <Divider key={idx} sx={{ my: 1 }} />
          ) : (
            <ListItem key={item.path} disablePadding>
              <ListItemButton
                component={NextLink}
                href={item.path}
                selected={pathname === item.path || pathname.startsWith(item.path + '/')}
                sx={{ borderRadius: 1, mb: 0.5 }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} slotProps={{ primary: { sx: { fontSize: 14 } } }} />
              </ListItemButton>
            </ListItem>
          )
        )}
      </List>
    </Box>
  );

  return (
    <>
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileClose}
        ModalProps={{ keepMounted: true }}
        sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { width: DRAWER_WIDTH } }}
      >
        {content}
      </Drawer>
      <Drawer
        variant="permanent"
        sx={{ display: { xs: 'none', md: 'block' }, '& .MuiDrawer-paper': { width: DRAWER_WIDTH, position: 'relative', height: '100vh' } }}
        open
      >
        {content}
      </Drawer>
    </>
  );
}
