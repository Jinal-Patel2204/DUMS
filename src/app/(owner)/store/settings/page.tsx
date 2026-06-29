'use client';

import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import StorefrontOutlined from '@mui/icons-material/StorefrontOutlined';
import PaymentsOutlined from '@mui/icons-material/PaymentsOutlined';
import EmailOutlined from '@mui/icons-material/EmailOutlined';
import NotificationsOutlined from '@mui/icons-material/NotificationsOutlined';
import AlarmOutlined from '@mui/icons-material/AlarmOutlined';
import AssessmentOutlined from '@mui/icons-material/AssessmentOutlined';
import ChevronRightOutlined from '@mui/icons-material/ChevronRightOutlined';

const items = [
  { label: 'Shop Information', desc: 'Business name, address, logo, and GST configuration', icon: <StorefrontOutlined />, path: '/store/settings/shop-info', color: '#3B82F6' },
  { label: 'Payment Config', desc: 'UPI ID, QR codes, and bank account details', icon: <PaymentsOutlined />, path: '/store/settings/payment', color: '#10B981' },
  { label: 'SMTP / Email', desc: 'Email provider credentials and sender settings', icon: <EmailOutlined />, path: '/store/settings/smtp', color: '#8B5CF6' },
  { label: 'Notifications', desc: 'Channels, templates, and quiet hours preferences', icon: <NotificationsOutlined />, path: '/store/settings/notifications', color: '#F59E0B' },
  { label: 'Reminder Rules', desc: 'Automated due reminders and overdue alerts', icon: <AlarmOutlined />, path: '/store/settings/reminders', color: '#EF4444' },
  { label: 'Scheduled Reports', desc: 'Configure weekly and monthly email reports', icon: <AssessmentOutlined />, path: '/store/settings/reports', color: '#6366F1' },
];

export default function SettingsPage() {
  const router = useRouter();
  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>Settings</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
          Configure your store preferences and integrations
        </Typography>
      </Box>
      <Grid container spacing={2}>
        {items.map((item) => (
          <Grid key={item.path} size={{ xs: 12, sm: 6, md: 4 }}>
            <Card sx={{ 
              height: '100%',
              '&:hover': { borderColor: `${item.color}40`, boxShadow: `0 4px 12px ${item.color}10` },
            }}>
              <CardActionArea 
                onClick={() => router.push(item.path)} 
                sx={{ p: 2.5, height: '100%', display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-start' }}
              >
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, width: '100%' }}>
                  <Box sx={{ 
                    p: 1, borderRadius: '10px', 
                    bgcolor: `${item.color}10`, color: item.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    {item.icon}
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.25 }}>{item.label}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.4 }}>{item.desc}</Typography>
                  </Box>
                  <ChevronRightOutlined sx={{ fontSize: 18, color: 'text.disabled', flexShrink: 0, mt: 0.5 }} />
                </Box>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
