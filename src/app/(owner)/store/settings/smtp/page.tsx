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
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Divider from '@mui/material/Divider';
import ArrowBackOutlined from '@mui/icons-material/ArrowBackOutlined';
import SendOutlined from '@mui/icons-material/SendOutlined';
import { smtpConfigSchema, type SmtpConfigInput } from '@/lib/validations/settings';
import { createClient } from '@/lib/supabase/client';
import { useAppSelector } from '@/store/hooks';
import { debugLog } from '@/lib/debug-logger';

export default function SmtpConfigPage() {
  const currentStore = useAppSelector((s) => s.auth.currentStore);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [configExists, setConfigExists] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [testEmail, setTestEmail] = useState('');

  const { register, handleSubmit, control, reset, watch, formState: { errors } } = useForm<SmtpConfigInput>({
    resolver: zodResolver(smtpConfigSchema) as any,
    defaultValues: { provider: 'resend', from_name: '', from_email: '' },
  });

  const fromName = watch('from_name');
  const fromEmail = watch('from_email');

  useEffect(() => {
    if (!currentStore?.id) return;
    const supabase = createClient();
    supabase.from('smtp_config').select('*').eq('store_id', currentStore.id).single().then(({ data }) => {
      if (data) {
        setConfigExists(true);
        reset({
          provider: data.provider || 'resend', host: data.host || '', port: data.port,
          username: data.username || '', password_encrypted: '', from_name: data.from_name || '',
          from_email: data.from_email || '', api_key_encrypted: '',
        });
      }
      setPageLoading(false);
    });
  }, [currentStore?.id, reset]);

  const onSubmit = async (data: SmtpConfigInput) => {
    if (!currentStore) return;
    setLoading(true); setError(''); setSuccess('');
    const supabase = createClient();

    const payload: any = {
      store_id: currentStore.id, provider: data.provider,
      host: data.host || null, port: data.port || null,
      username: data.username || null, from_name: data.from_name, from_email: data.from_email,
    };
    if (data.password_encrypted) payload.password_encrypted = data.password_encrypted;
    if (data.api_key_encrypted) payload.api_key_encrypted = data.api_key_encrypted;

    let dbErr;
    if (configExists) { const { error } = await supabase.from('smtp_config').update(payload).eq('store_id', currentStore.id); dbErr = error; }
    else { const { error } = await supabase.from('smtp_config').insert(payload); dbErr = error; }

    if (dbErr) { setError(dbErr.message); } else { setSuccess('SMTP config saved!'); setConfigExists(true); debugLog('settings', 'smtp_saved', 'SMTP config updated', 'success'); }
    setLoading(false);
  };

  const handleTestConnection = async () => {
    const recipient = testEmail || fromEmail;
    if (!recipient) { setTestResult({ success: false, message: 'Enter a test email address' }); return; }
    setTestLoading(true); setTestResult(null);

    try {
      const res = await fetch('/api/email/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to_email: recipient, from_name: fromName || 'DUMS', from_email: fromEmail || undefined }),
      });
      const data = await res.json();
      setTestResult({ success: data.success, message: data.success ? `✅ Test email sent to ${recipient}!` : `❌ ${data.error}` });
      debugLog('settings', 'smtp_test', data.success ? `Test email sent to ${recipient}` : `Test failed: ${data.error}`, data.success ? 'success' : 'error');
    } catch (err: any) {
      setTestResult({ success: false, message: `❌ ${err.message}` });
    }
    setTestLoading(false);
  };

  if (pageLoading) return <Typography>Loading...</Typography>;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <Button startIcon={<ArrowBackOutlined />} href="/store/settings">Back</Button>
        <Typography variant="h5">SMTP / Email Configuration</Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
              {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
              <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12 }}>
                    <Controller name="provider" control={control} render={({ field }) => (
                      <FormControl fullWidth><InputLabel>Provider</InputLabel>
                        <Select {...field} label="Provider"><MenuItem value="resend">Resend</MenuItem><MenuItem value="sendgrid">SendGrid</MenuItem><MenuItem value="custom">Custom SMTP</MenuItem></Select>
                      </FormControl>
                    )} />
                  </Grid>
                  <Grid size={{ xs: 8 }}><TextField fullWidth label="Host" {...register('host')} placeholder="smtp.example.com" /></Grid>
                  <Grid size={{ xs: 4 }}><TextField fullWidth label="Port" type="number" {...register('port')} placeholder="587" /></Grid>
                  <Grid size={{ xs: 6 }}><TextField fullWidth label="Username" {...register('username')} /></Grid>
                  <Grid size={{ xs: 6 }}><TextField fullWidth label="Password" type="password" {...register('password_encrypted')} placeholder="••••••" /></Grid>
                  <Grid size={{ xs: 12 }}><TextField fullWidth label="API Key (Resend/SendGrid)" type="password" {...register('api_key_encrypted')} placeholder="re_xxxxx or SG.xxxxx" /></Grid>
                  <Grid size={{ xs: 6 }}><TextField fullWidth label="From Name *" {...register('from_name')} error={!!errors.from_name} helperText={errors.from_name?.message} /></Grid>
                  <Grid size={{ xs: 6 }}><TextField fullWidth label="From Email *" {...register('from_email')} error={!!errors.from_email} helperText={errors.from_email?.message} /></Grid>
                </Grid>
                <Button type="submit" variant="contained" sx={{ mt: 3 }} disabled={loading}>{loading ? 'Saving...' : 'Save SMTP Config'}</Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 5 }}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Test Connection</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Send a real test email to verify your configuration works.
              </Typography>
              <TextField
                fullWidth size="small" label="Test Email Address"
                value={testEmail} onChange={(e) => setTestEmail(e.target.value)}
                placeholder="your@email.com" sx={{ mb: 2 }}
              />
              <Button
                variant="outlined" startIcon={<SendOutlined />}
                onClick={handleTestConnection} disabled={testLoading} fullWidth
              >
                {testLoading ? 'Sending...' : 'Send Test Email'}
              </Button>
              {testResult && (
                <Alert severity={testResult.success ? 'success' : 'error'} sx={{ mt: 2 }}>
                  {testResult.message}
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
