'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
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
import { useCustomerAuth } from '@/hooks/useCustomerAuth';
import { createClient } from '@/lib/supabase/client';

interface PaymentForm {
  amount: number;
  method: string;
  reference_id: string;
  notes: string;
}

export default function CustomerNewPaymentPage() {
  const router = useRouter();
  const { customer } = useCustomerAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, control, formState: { errors } } = useForm<PaymentForm>({
    defaultValues: { amount: 0, method: 'upi', reference_id: '', notes: '' },
  });

  const onSubmit = async (data: PaymentForm) => {
    if (!customer) return;
    setLoading(true); setError('');
    const supabase = createClient();

    const { error: dbError } = await supabase.from('payments').insert({
      store_id: customer.storeId,
      customer_id: customer.customerId,
      amount: data.amount,
      method: data.method,
      status: 'pending',
      reference_id: data.reference_id || null,
      notes: data.notes || null,
    });

    if (dbError) { setError(dbError.message); setLoading(false); return; }

    // Notify store owner
    const { data: store } = await supabase.from('stores').select('owner_id').eq('id', customer.storeId).single();
    if (store) {
      await supabase.from('notifications').insert({
        user_id: store.owner_id,
        type: 'payment_received',
        channel: 'in_app',
        title: 'Payment Submitted',
        body: `${customer.name} submitted ₹${data.amount.toLocaleString('en-IN')} via ${data.method}. Awaiting verification.`,
        data: { customerName: customer.name, amount: data.amount, method: data.method },
      });
    }

    router.push('/customer/payments');
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>Record Payment</Typography>

      <Card sx={{ maxWidth: 500 }}>
        <CardContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <Controller name="amount" control={control} rules={{ required: 'Amount required', min: { value: 1, message: 'Must be > 0' } }}
                  render={({ field }) => (
                    <TextField fullWidth label="Amount *" type="number" value={field.value} onChange={(e) => field.onChange(Number(e.target.value))}
                      error={!!errors.amount} helperText={errors.amount?.message}
                      slotProps={{ input: { startAdornment: <InputAdornment position="start">₹</InputAdornment> } }} />
                  )} />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Controller name="method" control={control} render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Payment Method</InputLabel>
                    <Select {...field} label="Payment Method">
                      <MenuItem value="cash">Cash</MenuItem>
                      <MenuItem value="upi">UPI</MenuItem>
                      <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
                      <MenuItem value="cheque">Cheque</MenuItem>
                    </Select>
                  </FormControl>
                )} />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField fullWidth label="Reference/Transaction ID" {...register('reference_id')} />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField fullWidth label="Notes (optional)" multiline rows={2} {...register('notes')} />
              </Grid>
            </Grid>
            <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
              <Button type="submit" variant="contained" disabled={loading}>{loading ? 'Submitting...' : 'Submit Payment'}</Button>
              <Button variant="outlined" onClick={() => router.back()}>Cancel</Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
