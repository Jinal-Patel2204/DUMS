'use client';

import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActionArea from '@mui/material/CardActionArea';
import StorefrontOutlined from '@mui/icons-material/StorefrontOutlined';
import PaymentsOutlined from '@mui/icons-material/PaymentsOutlined';
import EmailOutlined from '@mui/icons-material/EmailOutlined';
import NotificationsOutlined from '@mui/icons-material/NotificationsOutlined';
import AlarmOutlined from '@mui/icons-material/AlarmOutlined';
import AssessmentOutlined from '@mui/icons-material/AssessmentOutlined';

const items = [
  { label: 'Shop Information', desc: 'Name, address, logo, GST', icon: <StorefrontOutlined />, path: '/store/settings/shop-info' },
  { label: 'Payment Config', desc: 'UPI, QR, bank details', icon: <PaymentsOutlined />, path: '/store/settings/payment' },
  { label: 'SMTP / Email', desc: 'Email provider, credentials', icon: <EmailOutlined />, path: '/store/settings/smtp' },
  { label: 'Notifications', desc: 'Channels, quiet hours', icon: <NotificationsOutlined />, path: '/store/settings/notifications' },
  { label: 'Reminder Rules', desc: 'Due reminders, overdue alerts', icon: <AlarmOutlined />, path: '/store/settings/reminders' },
  { label: 'Scheduled Reports', desc: 'Weekly/monthly email reports', icon: <AssessmentOutlined />, path: '/store/settings/reports' },
];

export default function SettingsPage() {
  const router = useRouter();
  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>Settings</Typography>
      <Grid container spacing={2}>
        {items.map((item) => (
          <Grid key={item.path} size={{ xs: 12, sm: 6, md: 4 }}>
            <Card>
              <CardActionArea onClick={() => router.push(item.path)} sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ color: 'primary.main' }}>{item.icon}</Box>
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>{item.label}</Typography>
                    <Typography variant="caption" color="text.secondary">{item.desc}</Typography>
                  </Box>
                </Box>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
