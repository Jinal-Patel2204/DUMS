'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import Divider from '@mui/material/Divider';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import DoneAllOutlined from '@mui/icons-material/DoneAllOutlined';
import NotificationsOutlined from '@mui/icons-material/NotificationsOutlined';
import { useState } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { format } from 'date-fns';

const typeIcons: Record<string, string> = {
  payment_received: '💰',
  payment_reminder: '⏰',
  credit_issued: '📄',
  overdue_alert: '🚨',
  bill_generated: '🧾',
  installment_due: '📅',
  low_stock: '📦',
  report_ready: '📊',
  invitation_sent: '✉️',
};

const typeColors: Record<string, string> = {
  payment_received: '#10B981',
  payment_reminder: '#F59E0B',
  credit_issued: '#3B82F6',
  overdue_alert: '#EF4444',
  bill_generated: '#6366F1',
  installment_due: '#8B5CF6',
  low_stock: '#F59E0B',
  report_ready: '#14B8A6',
  invitation_sent: '#6366F1',
};

export default function OwnerNotificationsPage() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [tab, setTab] = useState(0);

  const filtered = tab === 0 ? notifications : tab === 1 ? notifications.filter(n => !n.is_read) : notifications.filter(n => n.is_read);

  if (!notifications) {
    return (
      <Box>
        <Box sx={{ mb: 3 }}>
          <Skeleton variant="text" width={180} height={32} />
          <Skeleton variant="text" width={140} height={20} />
        </Box>
        {[1, 2, 3].map(i => <Skeleton key={i} variant="rounded" height={72} sx={{ mb: 1 }} />)}
      </Box>
    );
  }

  return (
    <Box>
      {/* Page Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>Notifications</Typography>
            {unreadCount > 0 && (
              <Chip label={unreadCount} size="small" color="error" sx={{ height: 20, '& .MuiChip-label': { px: 1, fontSize: '0.6875rem' } }} />
            )}
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
            Stay updated on payments, reminders, and alerts
          </Typography>
        </Box>
        {unreadCount > 0 && (
          <Button size="small" startIcon={<DoneAllOutlined />} onClick={markAllAsRead} sx={{ color: 'text.secondary' }}>
            Mark all read
          </Button>
        )}
      </Box>

      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 1 }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)}>
            <Tab label={`All (${notifications.length})`} />
            <Tab label={`Unread (${unreadCount})`} />
            <Tab label="Read" />
          </Tabs>
        </Box>

        {filtered.length === 0 ? (
          <Box sx={{ py: 8, textAlign: 'center' }}>
            <NotificationsOutlined sx={{ fontSize: 48, color: 'text.disabled', mb: 1.5 }} />
            <Typography variant="subtitle1" color="text.secondary" sx={{ fontWeight: 500 }}>
              No notifications
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {tab === 1 ? "You're all caught up." : 'Notifications will appear here.'}
            </Typography>
          </Box>
        ) : (
          <List disablePadding>
            {filtered.map((n, idx) => (
              <Box key={n.id}>
                <ListItem
                  sx={{ 
                    bgcolor: n.is_read ? 'transparent' : 'rgba(99,102,241,0.04)', 
                    cursor: n.is_read ? 'default' : 'pointer', 
                    py: 2, px: 2.5,
                    transition: 'background 0.15s ease',
                    '&:hover': { bgcolor: n.is_read ? 'action.hover' : 'rgba(99,102,241,0.06)' },
                    ...(!n.is_read && {
                      borderLeft: '3px solid',
                      borderColor: 'secondary.main',
                    }),
                  }}
                  onClick={() => !n.is_read && markAsRead(n.id)}
                >
                  <Box sx={{ 
                    mr: 2, fontSize: 20, 
                    width: 36, height: 36, borderRadius: '8px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    bgcolor: `${typeColors[n.type] || '#6366F1'}10`,
                    flexShrink: 0,
                  }}>
                    {typeIcons[n.type] || '🔔'}
                  </Box>
                  <ListItemText
                    primary={
                      <Typography variant="body2" sx={{ fontWeight: n.is_read ? 400 : 600, mb: 0.25 }}>
                        {n.title}
                      </Typography>
                    }
                    secondary={
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.4 }}>
                          {n.body}
                        </Typography>
                        <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, display: 'block' }}>
                          {format(new Date(n.sent_at), 'dd MMM yyyy, hh:mm a')}
                        </Typography>
                      </Box>
                    }
                  />
                  <Chip 
                    label={n.type.replace(/_/g, ' ')} 
                    size="small" 
                    sx={{ 
                      ml: 1, textTransform: 'capitalize',
                      bgcolor: `${typeColors[n.type] || '#6366F1'}10`,
                      color: typeColors[n.type] || '#6366F1',
                      border: 'none',
                      fontWeight: 500,
                    }} 
                  />
                </ListItem>
                {idx < filtered.length - 1 && <Divider />}
              </Box>
            ))}
          </List>
        )}
      </Card>
    </Box>
  );
}
