'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import ArrowBackOutlined from '@mui/icons-material/ArrowBackOutlined';
import { shopInfoSchema, type ShopInfoInput } from '@/lib/validations/settings';
import { createClient } from '@/lib/supabase/client';
import { useAppSelector } from '@/store/hooks';
import { debugLog } from '@/lib/debug-logger';

export default function ShopInfoPage() {
  const currentStore = useAppSelector((s) => s.auth.currentStore);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ShopInfoInput>({
    resolver: zodResolver(shopInfoSchema) as any,
  });

  useEffect(() => {
    if (!currentStore) return;
    reset({
      name: currentStore.name || '', address: currentStore.address || '',
      city: (currentStore as any).city || '', state: (currentStore as any).state || '',
      pincode: (currentStore as any).pincode || '', phone: currentStore.phone || '',
      email: currentStore.email || '', gstin: currentStore.gstin || '',
      currency: currentStore.currency || 'INR', timezone: currentStore.timezone || 'Asia/Kolkata',
    });
  }, [currentStore, reset]);

  const onSubmit = async (data: ShopInfoInput) => {
    if (!currentStore) return;
    setLoading(true); setError(''); setSuccess('');
    const supabase = createClient();
    const { error: dbErr } = await supabase.from('stores').update({
      name: data.name, address: data.address || null, city: data.city || null,
      state: data.state || null, pincode: data.pincode || null, phone: data.phone,
      email: data.email || null, gstin: data.gstin || null,
      currency: data.currency, timezone: data.timezone,
    }).eq('id', currentStore.id);

    if (dbErr) { setError(dbErr.message); } else { setSuccess('Shop info saved!'); debugLog('settings', 'shop_info_updated', 'Shop info updated', 'success'); }
    setLoading(false);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <Button startIcon={<ArrowBackOutlined />} href="/store/settings">Back</Button>
        <Typography variant="h5">Shop Information</Typography>
      </Box>
      <Card sx={{ maxWidth: 700 }}>
        <CardContent sx={{ p: 3 }}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
          <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}><TextField fullWidth label="Shop Name *" {...register('name')} error={!!errors.name} helperText={errors.name?.message} /></Grid>
              <Grid size={{ xs: 12 }}><TextField fullWidth label="Address" {...register('address')} /></Grid>
              <Grid size={{ xs: 6 }}><TextField fullWidth label="City" {...register('city')} /></Grid>
              <Grid size={{ xs: 3 }}><TextField fullWidth label="State" {...register('state')} /></Grid>
              <Grid size={{ xs: 3 }}><TextField fullWidth label="Pincode" {...register('pincode')} /></Grid>
              <Grid size={{ xs: 6 }}><TextField fullWidth label="Phone *" {...register('phone')} error={!!errors.phone} helperText={errors.phone?.message} /></Grid>
              <Grid size={{ xs: 6 }}><TextField fullWidth label="Email" {...register('email')} /></Grid>
              <Grid size={{ xs: 6 }}><TextField fullWidth label="GST Number" {...register('gstin')} /></Grid>
              <Grid size={{ xs: 3 }}><TextField fullWidth label="Currency" {...register('currency')} /></Grid>
              <Grid size={{ xs: 3 }}><TextField fullWidth label="Timezone" {...register('timezone')} /></Grid>
            </Grid>
            <Button type="submit" variant="contained" sx={{ mt: 3 }} disabled={loading}>{loading ? 'Saving...' : 'Save'}</Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
