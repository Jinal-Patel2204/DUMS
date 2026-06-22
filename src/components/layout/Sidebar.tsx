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
import PeopleOutlined from '@mui/icons-material/PeopleOutlined';
import ReceiptOutlined from '@mui/icons-material/ReceiptOutlined';
import PaymentsOutlined from '@mui/icons-material/PaymentsOutlined';
import InventoryOutlined from '@mui/icons-material/InventoryOutlined';
import WarehouseOutlined from '@mui/icons-material/WarehouseOutlined';
import CalendarMonthOutlined from '@mui/icons-material/CalendarMonthOutlined';
import BarChartOutlined from '@mui/icons-material/BarChartOutlined';
import HistoryOutlined from '@mui/icons-material/HistoryOutlined';
import NotificationsOutlined from '@mui/icons-material/NotificationsOutlined';
import SettingsOutlined from '@mui/icons-material/SettingsOutlined';

const DRAWER_WIDTH = 260;

const navItems = [
  { label: 'Dashboard', icon: <DashboardOutlined />, path: '/store/dashboard' },
  { label: 'Customers', icon: <PeopleOutlined />, path: '/store/customers' },
  { label: 'Bills', icon: <ReceiptOutlined />, path: '/store/bills' },
  { label: 'Payments', icon: <PaymentsOutlined />, path: '/store/payments' },
  { label: 'Products', icon: <InventoryOutlined />, path: '/store/products' },
  { label: 'Inventory', icon: <WarehouseOutlined />, path: '/store/inventory' },
  { label: 'Installments', icon: <CalendarMonthOutlined />, path: '/store/installments' },
  { divider: true, label: '', icon: null, path: '' },
  { label: 'Reports', icon: <BarChartOutlined />, path: '/store/reports' },
  { label: 'Audit Logs', icon: <HistoryOutlined />, path: '/store/audit-logs' },
  { label: 'Notifications', icon: <NotificationsOutlined />, path: '/store/notifications' },
  { divider: true, label: '', icon: null, path: '' },
  { label: 'Settings', icon: <SettingsOutlined />, path: '/store/settings' },
];

interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();

  const content = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }} color="primary">DUMS</Typography>
        <Typography variant="caption" color="text.secondary">Store Management</Typography>
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
