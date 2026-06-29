'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Divider from '@mui/material/Divider';
import { notificationConfigSchema, type NotificationConfigInput } from '@/lib/validations/settings';
import { createClient } from '@/lib/supabase/client';
import { useAppSelector } from '@/store/hooks';
import { debugLog } from '@/lib/debug-logger';

export default function NotificationConfigPage() {
  const currentStore = useAppSelector((s) => s.auth.currentStore);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [configExists, setConfigExists] = useState(false);

  const { register, handleSubmit, control, reset } = useForm<NotificationConfigInput>({
    resolver: zodResolver(notificationConfigSchema) as any,
    defaultValues: { email_enabled: false, push_enabled: false, whatsapp_enabled: false, sms_enabled: false, quiet_hours_start: '21:00', quiet_hours_end: '09:00' },
  });

  useEffect(() => {
    if (!currentStore?.id) return;
    const supabase = createClient();
    supabase.from('notification_config').select('*').eq('store_id', currentStore.id).single().then(({ data }) => {
      if (data) {
        setConfigExists(true);
        reset({
          email_enabled: data.email_enabled, push_enabled: data.push_enabled,
          whatsapp_enabled: data.whatsapp_enabled, sms_enabled: data.sms_enabled,
          quiet_hours_start: data.quiet_hours_start || '21:00', quiet_hours_end: data.quiet_hours_end || '09:00',
        });
      }
      setPageLoading(false);
    });
  }, [currentStore?.id, reset]);

  const onSubmit = async (data: NotificationConfigInput) => {
    if (!currentStore) return;
    setLoading(true); setError(''); setSuccess('');
    const supabase = createClient();
    const payload = { ...data, store_id: currentStore.id };

    let dbErr;
    if (configExists) { const { error } = await supabase.from('notification_config').update(payload).eq('store_id', currentStore.id); dbErr = error; }
    else { const { error } = await supabase.from('notification_config').insert(payload); dbErr = error; }

    if (dbErr) { setError(dbErr.message); } else { setSuccess('Saved!'); setConfigExists(true); debugLog('settings', 'notification_config_saved', 'Notification config updated', 'success'); }
    setLoading(false);
  };

  if (pageLoading) return <Typography>Loading...</Typography>;

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>Notification Settings</Typography>
      <Card sx={{ maxWidth: 500 }}>
        <CardContent sx={{ p: 3 }}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
          <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <Typography variant="h6" gutterBottom>Channels</Typography>
            <Controller name="email_enabled" control={control} render={({ field }) => <FormControlLabel control={<Switch checked={field.value} onChange={field.onChange} />} label="Email" />} />
            <Controller name="push_enabled" control={control} render={({ field }) => <FormControlLabel control={<Switch checked={field.value} onChange={field.onChange} />} label="Push Notifications" />} />
            <Controller name="sms_enabled" control={control} render={({ field }) => <FormControlLabel control={<Switch checked={field.value} onChange={field.onChange} />} label="SMS" />} />
            <Controller name="whatsapp_enabled" control={control} render={({ field }) => <FormControlLabel control={<Switch checked={field.value} onChange={field.onChange} />} label="WhatsApp (Future)" />} />

            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" gutterBottom>Quiet Hours</Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 6 }}><TextField fullWidth label="Start" type="time" {...register('quiet_hours_start')} slotProps={{ inputLabel: { shrink: true } }} /></Grid>
              <Grid size={{ xs: 6 }}><TextField fullWidth label="End" type="time" {...register('quiet_hours_end')} slotProps={{ inputLabel: { shrink: true } }} /></Grid>
            </Grid>

            <Button type="submit" variant="contained" sx={{ mt: 3 }} disabled={loading}>{loading ? 'Saving...' : 'Save'}</Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
