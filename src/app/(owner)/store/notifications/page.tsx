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

export default function OwnerNotificationsPage() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [tab, setTab] = useState(0);

  const filtered = tab === 0 ? notifications : tab === 1 ? notifications.filter(n => !n.is_read) : notifications.filter(n => n.is_read);

  if (!notifications) {
    return <Box><Typography variant="h5" sx={{ mb: 3 }}>Notifications</Typography>{[1,2,3].map(i => <Skeleton key={i} variant="rounded" height={60} sx={{ mb: 1 }} />)}</Box>;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">
          Notifications {unreadCount > 0 && <Chip label={unreadCount} size="small" color="error" sx={{ ml: 1 }} />}
        </Typography>
        {unreadCount > 0 && (
          <Button startIcon={<DoneAllOutlined />} onClick={markAllAsRead}>Mark All Read</Button>
        )}
      </Box>

      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)}>
            <Tab label={`All (${notifications.length})`} />
            <Tab label={`Unread (${unreadCount})`} />
            <Tab label="Read" />
          </Tabs>
        </Box>

        {filtered.length === 0 ? (
          <CardContent><Typography color="text.secondary" textAlign="center">No notifications.</Typography></CardContent>
        ) : (
          <List disablePadding>
            {filtered.map((n, idx) => (
              <Box key={n.id}>
                <ListItem
                  sx={{ bgcolor: n.is_read ? 'transparent' : 'action.hover', cursor: n.is_read ? 'default' : 'pointer', py: 1.5 }}
                  onClick={() => !n.is_read && markAsRead(n.id)}
                >
                  <Typography sx={{ mr: 2, fontSize: 20 }}>{typeIcons[n.type] || '🔔'}</Typography>
                  <ListItemText
                    primary={<Typography variant="body2" sx={{ fontWeight: n.is_read ? 400 : 600 }}>{n.title}</Typography>}
                    secondary={
                      <Box>
                        <Typography variant="caption" color="text.secondary">{n.body}</Typography>
                        <br />
                        <Typography variant="caption" color="text.disabled">{format(new Date(n.sent_at), 'dd MMM yyyy, hh:mm a')}</Typography>
                      </Box>
                    }
                  />
                  <Chip label={n.type.replace(/_/g, ' ')} size="small" variant="outlined" sx={{ ml: 1 }} />
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
