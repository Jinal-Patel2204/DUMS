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
import { paymentConfigSchema, type PaymentConfigInput } from '@/lib/validations/settings';
import { createClient } from '@/lib/supabase/client';
import { useAppSelector } from '@/store/hooks';
import { debugLog } from '@/lib/debug-logger';

export default function PaymentConfigPage() {
  const currentStore = useAppSelector((s) => s.auth.currentStore);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [configExists, setConfigExists] = useState(false);
  const [qrFile, setQrFile] = useState<File | null>(null);
  const [qrUrl, setQrUrl] = useState('');

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<PaymentConfigInput>({
    resolver: zodResolver(paymentConfigSchema) as any,
    defaultValues: { is_cash_enabled: true, is_upi_enabled: false, is_bank_transfer_enabled: false },
  });

  useEffect(() => {
    if (!currentStore?.id) return;
    const supabase = createClient();
    supabase.from('payment_config').select('*').eq('store_id', currentStore.id).single().then(({ data }) => {
      if (data) {
        setConfigExists(true);
        setQrUrl(data.qr_code_url || '');
        reset({
          upi_id: data.upi_id || '', upi_display_name: data.upi_display_name || '',
          bank_name: data.bank_name || '', bank_account_number: data.bank_account_number || '',
          bank_ifsc_code: data.bank_ifsc_code || '', bank_account_holder: data.bank_account_holder || '',
          is_cash_enabled: data.is_cash_enabled, is_upi_enabled: data.is_upi_enabled,
          is_bank_transfer_enabled: data.is_bank_transfer_enabled,
        });
      }
      setPageLoading(false);
    });
  }, [currentStore?.id, reset]);

  const onSubmit = async (data: PaymentConfigInput) => {
    if (!currentStore) return;
    setLoading(true); setError(''); setSuccess('');
    const supabase = createClient();

    // Upload QR if new file
    let finalQrUrl = qrUrl;
    if (qrFile) {
      const fileName = `qr_${currentStore.id}_${Date.now()}`;
      const { data: upload } = await supabase.storage.from('payment-proofs').upload(fileName, qrFile);
      if (upload) {
        const { data: urlData } = supabase.storage.from('payment-proofs').getPublicUrl(fileName);
        finalQrUrl = urlData.publicUrl;
      }
    }

    const payload = { ...data, qr_code_url: finalQrUrl || null, store_id: currentStore.id };

    let dbErr;
    if (configExists) {
      const { error } = await supabase.from('payment_config').update(payload).eq('store_id', currentStore.id);
      dbErr = error;
    } else {
      const { error } = await supabase.from('payment_config').insert(payload);
      dbErr = error;
    }

    if (dbErr) { setError(dbErr.message); } else { setSuccess('Payment config saved!'); setConfigExists(true); debugLog('settings', 'payment_config_saved', 'Payment config updated', 'success'); }
    setLoading(false);
  };

  if (pageLoading) return <Typography>Loading...</Typography>;

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>Payment Configuration</Typography>
      <Card sx={{ maxWidth: 700 }}>
        <CardContent sx={{ p: 3 }}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
          <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <Typography variant="h6" gutterBottom>Accepted Methods</Typography>
            <Box sx={{ display: 'flex', gap: 3, mb: 2 }}>
              <Controller name="is_cash_enabled" control={control} render={({ field }) => <FormControlLabel control={<Switch checked={field.value} onChange={field.onChange} />} label="Cash" />} />
              <Controller name="is_upi_enabled" control={control} render={({ field }) => <FormControlLabel control={<Switch checked={field.value} onChange={field.onChange} />} label="UPI" />} />
              <Controller name="is_bank_transfer_enabled" control={control} render={({ field }) => <FormControlLabel control={<Switch checked={field.value} onChange={field.onChange} />} label="Bank Transfer" />} />
            </Box>

            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" gutterBottom>UPI Details</Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 6 }}><TextField fullWidth label="UPI ID" {...register('upi_id')} placeholder="yourname@upi" /></Grid>
              <Grid size={{ xs: 6 }}><TextField fullWidth label="Display Name" {...register('upi_display_name')} /></Grid>
              <Grid size={{ xs: 12 }}>
                <Button variant="outlined" component="label">{qrFile ? qrFile.name : qrUrl ? 'Replace QR Code' : 'Upload QR Code'}
                  <input type="file" hidden accept="image/*" onChange={(e) => setQrFile(e.target.files?.[0] || null)} />
                </Button>
                {qrUrl && !qrFile && <Box component="img" src={qrUrl} alt="QR" sx={{ width: 100, height: 100, ml: 2, borderRadius: 1, border: 1, borderColor: 'divider' }} />}
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" gutterBottom>Bank Details</Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 6 }}><TextField fullWidth label="Bank Name" {...register('bank_name')} /></Grid>
              <Grid size={{ xs: 6 }}><TextField fullWidth label="Account Holder" {...register('bank_account_holder')} /></Grid>
              <Grid size={{ xs: 6 }}><TextField fullWidth label="Account Number" {...register('bank_account_number')} /></Grid>
              <Grid size={{ xs: 6 }}><TextField fullWidth label="IFSC Code" {...register('bank_ifsc_code')} /></Grid>
            </Grid>

            <Button type="submit" variant="contained" sx={{ mt: 3 }} disabled={loading}>{loading ? 'Saving...' : 'Save Configuration'}</Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
