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
import { tokens } from '@/theme';

const DRAWER_WIDTH = 260;

interface NavSection {
  title?: string;
  items: { label: string; icon: React.ReactElement; path: string }[];
}

const navSections: NavSection[] = [
  {
    items: [
      { label: 'Dashboard', icon: <DashboardOutlined fontSize="small" />, path: '/store/dashboard' },
    ],
  },
  {
    title: 'Management',
    items: [
      { label: 'Customers', icon: <PeopleOutlined fontSize="small" />, path: '/store/customers' },
      { label: 'Bills', icon: <ReceiptOutlined fontSize="small" />, path: '/store/bills' },
      { label: 'Payments', icon: <PaymentsOutlined fontSize="small" />, path: '/store/payments' },
      { label: 'Products', icon: <InventoryOutlined fontSize="small" />, path: '/store/products' },
      { label: 'Inventory', icon: <WarehouseOutlined fontSize="small" />, path: '/store/inventory' },
      { label: 'Installments', icon: <CalendarMonthOutlined fontSize="small" />, path: '/store/installments' },
    ],
  },
  {
    title: 'Insights',
    items: [
      { label: 'Reports', icon: <BarChartOutlined fontSize="small" />, path: '/store/reports' },
      { label: 'Audit Logs', icon: <HistoryOutlined fontSize="small" />, path: '/store/audit-logs' },
      { label: 'Notifications', icon: <NotificationsOutlined fontSize="small" />, path: '/store/notifications' },
    ],
  },
  {
    title: 'System',
    items: [
      { label: 'Settings', icon: <SettingsOutlined fontSize="small" />, path: '/store/settings' },
    ],
  },
];

interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
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
              Store Management
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

      {/* Footer */}
      <Box sx={{ px: 2.5, py: 1.5, borderTop: `1px solid ${tokens.sidebar.border}`, flexShrink: 0 }}>
        <Typography sx={{ fontSize: '0.625rem', color: tokens.sidebar.text, opacity: 0.4 }}>
          v0.1.0 · Enterprise
        </Typography>
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
        sx={{ 
          display: { xs: 'block', md: 'none' }, 
          '& .MuiDrawer-paper': { width: DRAWER_WIDTH, border: 'none' } 
        }}
      >
        {content}
      </Drawer>
      <Drawer
        variant="permanent"
        sx={{ 
          display: { xs: 'none', md: 'block' }, 
          '& .MuiDrawer-paper': { 
            width: DRAWER_WIDTH, 
            position: 'relative', 
            height: '100%', 
            border: 'none',
            overflow: 'hidden',
          } 
        }}
        open
      >
        {content}
      </Drawer>
    </>
  );
}
