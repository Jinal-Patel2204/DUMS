'use client';

import { useRouter, usePathname } from 'next/navigation';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import Badge from '@mui/material/Badge';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';
import ListItemIcon from '@mui/material/ListItemIcon';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsOutlined from '@mui/icons-material/NotificationsOutlined';
import LogoutOutlined from '@mui/icons-material/LogoutOutlined';
import PersonOutlined from '@mui/icons-material/PersonOutlined';
import SettingsOutlined from '@mui/icons-material/SettingsOutlined';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAppSelector } from '@/store/hooks';
import { useNotifications } from '@/hooks/useNotifications';

interface TopBarProps {
  onMenuClick: () => void;
}

const routeTitles: Record<string, string> = {
  '/store/dashboard': 'Dashboard',
  '/store/customers': 'Customers',
  '/store/bills': 'Bills',
  '/store/payments': 'Payments',
  '/store/products': 'Products',
  '/store/inventory': 'Inventory',
  '/store/installments': 'Installments',
  '/store/reports': 'Reports',
  '/store/audit-logs': 'Audit Logs',
  '/store/notifications': 'Notifications',
  '/store/settings': 'Settings',
  '/customer/dashboard': 'Dashboard',
  '/customer/bills': 'My Bills',
  '/customer/payments': 'Payments',
  '/customer/ledger': 'Ledger',
  '/customer/installments': 'Installments',
  '/customer/notifications': 'Notifications',
  '/customer/profile': 'Profile',
};

export function TopBar({ onMenuClick }: TopBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAppSelector((s) => s.auth.user);
  const currentStore = useAppSelector((s) => s.auth.currentStore);
  const { unreadCount } = useNotifications();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const isCustomerPortal = pathname.startsWith('/customer');
  const notificationsPath = isCustomerPortal ? '/customer/notifications' : '/store/notifications';

  // Get page title from route
  const pageTitle = routeTitles[pathname] || '';

  const handleLogout = async () => {
    setAnchorEl(null);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <AppBar position="sticky" color="inherit" elevation={0} sx={{ borderBottom: 1, borderColor: 'divider' }}>
      <Toolbar>
        <IconButton edge="start" onClick={onMenuClick} sx={{ mr: 2, display: { md: 'none' } }} aria-label="open navigation">
          <MenuIcon />
        </IconButton>
        <Box sx={{ flexGrow: 1 }}>
          {pageTitle && (
            <Typography variant="h6" sx={{ fontWeight: 500, fontSize: '1.1rem' }}>
              {pageTitle}
            </Typography>
          )}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {currentStore && (
            <Typography variant="caption" color="text.secondary" sx={{ mr: 1, display: { xs: 'none', sm: 'block' } }}>
              {currentStore.name}
            </Typography>
          )}
          <IconButton onClick={() => router.push(notificationsPath)} aria-label={`${unreadCount} unread notifications`}>
            <Badge badgeContent={unreadCount} color="error" max={99}>
              <NotificationsOutlined />
            </Badge>
          </IconButton>
          <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} aria-label="user menu">
            <Avatar sx={{ width: 32, height: 32, fontSize: 14, bgcolor: 'primary.main' }}>
              {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
            </Avatar>
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={!!anchorEl}
            onClose={() => setAnchorEl(null)}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <MenuItem disabled sx={{ opacity: '1 !important' }}>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>{user?.full_name || 'User'}</Typography>
                <Typography variant="caption" color="text.secondary">{user?.role === 'customer' ? 'Customer' : 'Store Owner'}</Typography>
              </Box>
            </MenuItem>
            <Divider />
            {isCustomerPortal ? (
              <MenuItem onClick={() => { setAnchorEl(null); router.push('/customer/profile'); }}>
                <ListItemIcon><PersonOutlined fontSize="small" /></ListItemIcon>
                Profile
              </MenuItem>
            ) : (
              <MenuItem onClick={() => { setAnchorEl(null); router.push('/store/settings'); }}>
                <ListItemIcon><SettingsOutlined fontSize="small" /></ListItemIcon>
                Settings
              </MenuItem>
            )}
            <MenuItem onClick={handleLogout}>
              <ListItemIcon><LogoutOutlined fontSize="small" /></ListItemIcon>
              Sign Out
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
