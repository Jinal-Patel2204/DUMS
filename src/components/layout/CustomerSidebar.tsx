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
import Typography from '@mui/material/Typography';
import DashboardOutlined from '@mui/icons-material/DashboardOutlined';
import ReceiptOutlined from '@mui/icons-material/ReceiptOutlined';
import PaymentsOutlined from '@mui/icons-material/PaymentsOutlined';
import AccountBalanceOutlined from '@mui/icons-material/AccountBalanceOutlined';
import CalendarMonthOutlined from '@mui/icons-material/CalendarMonthOutlined';
import NotificationsOutlined from '@mui/icons-material/NotificationsOutlined';
import PersonOutlined from '@mui/icons-material/PersonOutlined';
import { tokens } from '@/theme';

const DRAWER_WIDTH = 260;

interface NavSection {
  title?: string;
  items: { label: string; icon: React.ReactElement; path: string }[];
}

const navSections: NavSection[] = [
  {
    items: [
      { label: 'Dashboard', icon: <DashboardOutlined fontSize="small" />, path: '/customer/dashboard' },
    ],
  },
  {
    title: 'Transactions',
    items: [
      { label: 'Bills', icon: <ReceiptOutlined fontSize="small" />, path: '/customer/bills' },
      { label: 'Payments', icon: <PaymentsOutlined fontSize="small" />, path: '/customer/payments' },
      { label: 'Ledger', icon: <AccountBalanceOutlined fontSize="small" />, path: '/customer/ledger' },
      { label: 'Installments', icon: <CalendarMonthOutlined fontSize="small" />, path: '/customer/installments' },
    ],
  },
  {
    title: 'Account',
    items: [
      { label: 'Notifications', icon: <NotificationsOutlined fontSize="small" />, path: '/customer/notifications' },
      { label: 'Profile', icon: <PersonOutlined fontSize="small" />, path: '/customer/profile' },
    ],
  },
];

interface CustomerSidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function CustomerSidebar({ mobileOpen, onMobileClose }: CustomerSidebarProps) {
  const pathname = usePathname();
  const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/');

  const content = (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%', 
      bgcolor: tokens.sidebar.bg,
      color: tokens.sidebar.text,
      overflow: 'hidden',
    }}>
      {/* Brand */}
      <Box sx={{ px: 2.5, py: 2, borderBottom: `1px solid ${tokens.sidebar.border}`, flexShrink: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{
            width: 32, height: 32, borderRadius: '8px',
            background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '0.875rem' }}>D</Typography>
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 700, fontSize: '0.9375rem', color: '#fff', letterSpacing: '-0.01em' }}>
              DUMS
            </Typography>
            <Typography sx={{ fontSize: '0.6875rem', color: tokens.sidebar.text, lineHeight: 1 }}>
              Customer Portal
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Navigation - scrollable */}
      <Box sx={{ 
        flex: 1, 
        overflowY: 'auto', 
        py: 1, 
        px: 1.5,
        '&::-webkit-scrollbar': { width: '4px' },
        '&::-webkit-scrollbar-thumb': { 
          borderRadius: '4px', 
          background: 'rgba(148,163,184,0.2)',
          '&:hover': { background: 'rgba(148,163,184,0.4)' },
        },
        '&::-webkit-scrollbar-track': { background: 'transparent' },
        scrollbarWidth: 'thin',
        scrollbarColor: 'rgba(148,163,184,0.2) transparent',
      }}>
        {navSections.map((section, idx) => (
          <Box key={idx} sx={{ mb: 1 }}>
            {section.title && (
              <Typography sx={{
                px: 1.5, py: 0.5,
                fontSize: '0.6875rem',
                fontWeight: 600,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: tokens.sidebar.text,
                opacity: 0.6,
              }}>
                {section.title}
              </Typography>
            )}
            <List disablePadding>
              {section.items.map((item) => {
                const active = isActive(item.path);
                return (
                  <ListItem key={item.path} disablePadding sx={{ mb: 0.25 }}>
                    <ListItemButton
                      component={NextLink}
                      href={item.path}
                      sx={{
                        borderRadius: '8px',
                        py: 0.75,
                        px: 1.5,
                        minHeight: 34,
                        bgcolor: active ? tokens.sidebar.bgActive : 'transparent',
                        '&:hover': { bgcolor: tokens.sidebar.bgHover },
                        ...(active && {
                          '&::before': {
                            content: '""',
                            position: 'absolute',
                            left: 0,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            width: 3,
                            height: 20,
                            borderRadius: '0 3px 3px 0',
                            bgcolor: tokens.sidebar.accent,
                          },
                        }),
                      }}
                    >
                      <ListItemIcon sx={{ 
                        minWidth: 32, 
                        color: active ? tokens.sidebar.textActive : tokens.sidebar.text,
                      }}>
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText 
                        primary={item.label} 
                        slotProps={{ 
                          primary: { 
                            sx: { 
                              fontSize: '0.8125rem', 
                              fontWeight: active ? 600 : 400,
                              color: active ? tokens.sidebar.textActive : tokens.sidebar.text,
                            } 
                          } 
                        }} 
                      />
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </List>
          </Box>
        ))}
      </Box>
    </Box>
  );

  return (
    <>
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileClose}
        ModalProps={{ keepMounted: true }}
        sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { width: DRAWER_WIDTH, border: 'none' } }}
      >
        {content}
      </Drawer>
      <Drawer
        variant="permanent"
        sx={{ display: { xs: 'none', md: 'block' }, '& .MuiDrawer-paper': { width: DRAWER_WIDTH, position: 'relative', height: '100%', border: 'none', overflow: 'hidden' } }}
        open
      >
        {content}
      </Drawer>
    </>
  );
}
