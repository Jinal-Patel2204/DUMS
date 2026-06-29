'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
import InputAdornment from '@mui/material/InputAdornment';
import { recordPaymentSchema, type RecordPaymentInput } from '@/lib/validations/payment';
import { createClient } from '@/lib/supabase/client';
import { useAppSelector } from '@/store/hooks';
import { debugLog } from '@/lib/debug-logger';

interface CustomerOption { id: string; name: string; phone: string; current_balance: number; }

const fmt = (n: number) => `₹${Number(n).toLocaleString('en-IN')}`;

export default function RecordPaymentPage() {
  const router = useRouter();
  const currentStore = useAppSelector((s) => s.auth.currentStore);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, control, watch, formState: { errors } } = useForm<RecordPaymentInput>({
    resolver: zodResolver(recordPaymentSchema) as any,
    defaultValues: { method: 'cash', amount: 0 as any },
  });

  const selectedCustomerId = watch('customer_id');
  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

  useEffect(() => {
    if (!currentStore?.id) return;
    const supabase = createClient();
    supabase.from('customers').select('id, name, phone, current_balance')
      .eq('store_id', currentStore.id).eq('is_deleted', false).eq('is_active', true)
      .order('name').then(({ data }) => {
        setCustomers((data as CustomerOption[]) ?? []);
      });
  }, [currentStore?.id]);

  const onSubmit = async (data: RecordPaymentInput) => {
    if (!currentStore) return;
    setLoading(true); setError('');
    const supabase = createClient();

    const { error: dbError } = await supabase.from('payments').insert({
      store_id: currentStore.id,
      customer_id: data.customer_id,
      bill_id: data.bill_id || null,
      amount: data.amount,
      method: data.method,
      status: 'pending',
      reference_id: data.reference_id || null,
      notes: data.notes || null,
    });

    if (dbError) { setError(dbError.message); setLoading(false); return; }

    debugLog('payments', 'record_payment', `Payment ${fmt(Number(data.amount))} recorded for customer`, 'success');
    router.push('/store/payments');
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>Record Payment</Typography>

      <Card sx={{ maxWidth: 600 }}>
        <CardContent sx={{ p: 3 }}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <Controller name="customer_id" control={control} render={({ field }) => (
                  <FormControl fullWidth error={!!errors.customer_id}>
                    <InputLabel>Customer *</InputLabel>
                    <Select {...field} label="Customer *" value={field.value || ''}>
                      {customers.map((c) => (
                        <MenuItem key={c.id} value={c.id}>
                          {c.name} ({c.phone}) — Balance: {fmt(Number(c.current_balance))}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )} />
                {errors.customer_id && <Typography variant="caption" color="error">{errors.customer_id.message}</Typography>}
              </Grid>

              {selectedCustomer && (
                <Grid size={{ xs: 12 }}>
                  <Box sx={{ bgcolor: 'grey.50', p: 1.5, borderRadius: 1 }}>
                    <Typography variant="body2">Outstanding: <strong style={{ color: '#d32f2f' }}>{fmt(Number(selectedCustomer.current_balance))}</strong></Typography>
                  </Box>
                </Grid>
              )}

              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller name="amount" control={control} render={({ field }) => (
                  <TextField fullWidth label="Amount *" type="number" value={field.value || ''} onChange={(e) => field.onChange(e.target.value === '' ? '' : Number(e.target.value))} error={!!errors.amount} helperText={errors.amount?.message}
                    slotProps={{ input: { startAdornment: <InputAdornment position="start">₹</InputAdornment> } }} />
                )} />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller name="method" control={control} render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Method</InputLabel>
                    <Select {...field} label="Method">
                      <MenuItem value="cash">Cash</MenuItem>
                      <MenuItem value="upi">UPI</MenuItem>
                      <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
                      <MenuItem value="cheque">Cheque</MenuItem>
                      <MenuItem value="other">Other</MenuItem>
                    </Select>
                  </FormControl>
                )} />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <TextField fullWidth label="Reference ID (UPI Ref / Cheque #)" {...register('reference_id')} />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <TextField fullWidth label="Notes" multiline rows={2} {...register('notes')} />
              </Grid>
            </Grid>

            <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
              <Button type="submit" variant="contained" disabled={loading}>{loading ? 'Recording...' : 'Record Payment'}</Button>
              <Button variant="outlined" onClick={() => router.back()}>Cancel</Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
