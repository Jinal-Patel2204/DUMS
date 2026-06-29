'use client';

import { useState, useEffect } from 'react';
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
import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';
import DoneAllOutlined from '@mui/icons-material/DoneAllOutlined';
import { createClient } from '@/lib/supabase/client';
import { format } from 'date-fns';

export default function CustomerNotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      setUserId(user.id);

      const { data } = await supabase
        .from('notifications').select('*')
        .eq('user_id', user.id)
        .order('sent_at', { ascending: false });
      setNotifications(data || []);
      setLoading(false);
    };
    fetch();
  }, []);

  const markAllRead = async () => {
    if (!userId) return;
    const supabase = createClient();
    const unread = notifications.filter(n => !n.is_read).map(n => n.id);
    if (unread.length === 0) return;
    await supabase.from('notifications').update({ is_read: true, read_at: new Date().toISOString() }).in('id', unread);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const markRead = async (id: string) => {
    const supabase = createClient();
    await supabase.from('notifications').update({ is_read: true, read_at: new Date().toISOString() }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  if (loading) return <Box><Typography variant="h5" sx={{ mb: 3 }}>Notifications</Typography>{[1,2,3].map(i => <Skeleton key={i} variant="rounded" height={60} sx={{ mb: 1 }} />)}</Box>;

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Notifications {unreadCount > 0 && <Chip label={unreadCount} size="small" color="error" sx={{ ml: 1 }} />}</Typography>
        {unreadCount > 0 && (
          <Button startIcon={<DoneAllOutlined />} onClick={markAllRead}>Mark All Read</Button>
        )}
      </Box>

      <Card>
        {notifications.length === 0 ? (
          <CardContent><Typography color="text.secondary" sx={{ textAlign: 'center' }}>No notifications yet.</Typography></CardContent>
        ) : (
          <List disablePadding>
            {notifications.map((n, idx) => (
              <Box key={n.id}>
                <ListItem
                  sx={{ bgcolor: n.is_read ? 'transparent' : 'action.hover', cursor: n.is_read ? 'default' : 'pointer' }}
                  onClick={() => !n.is_read && markRead(n.id)}
                >
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
                  <Chip label={n.type.replace('_', ' ')} size="small" variant="outlined" sx={{ ml: 1 }} />
                </ListItem>
                {idx < notifications.length - 1 && <Divider />}
              </Box>
            ))}
          </List>
        )}
      </Card>
    </Box>
  );
}
