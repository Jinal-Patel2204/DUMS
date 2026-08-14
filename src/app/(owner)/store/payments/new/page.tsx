'use client';

import { useState } from 'react';
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
import Skeleton from '@mui/material/Skeleton';
import { recordPaymentSchema, type RecordPaymentInput } from '@/lib/validations/payment';
import { useAppSelector } from '@/store/hooks';
import { useCreatePaymentMutation } from '@/store/api/paymentsApi';
import { useGetCustomersQuery } from '@/store/api/customersApi';
import { useGetBillsQuery } from '@/store/api/billsApi';

const fmt = (n: number) => `₹${Number(n).toLocaleString('en-IN')}`;

export default function RecordPaymentPage() {
  const router = useRouter();
  const currentStore = useAppSelector((s) => s.auth.currentStore);
  const [error, setError] = useState('');

  // ─── JAVA BACKEND CALLS via Redux Query ───────────────
  const { data: customersData, isLoading: customersLoading } = useGetCustomersQuery(
    { storeId: currentStore?.id ?? '' },
    { skip: !currentStore?.id }
  );

  const { data: bills = [], isLoading: billsLoading } = useGetBillsQuery(
    { storeId: currentStore?.id ?? '' },
    { skip: !currentStore?.id }
  );

  const [createPayment, { isLoading: submitting }] = useCreatePaymentMutation();
  // ─────────────────────────────────────────────────────

  const customers = customersData?.data ?? [];

  const { register, handleSubmit, control, watch, formState: { errors } } = useForm<RecordPaymentInput>({
    resolver: zodResolver(recordPaymentSchema) as any,
    defaultValues: { method: 'cash', amount: 0 as any },
  });

  const selectedCustomerId = watch('customer_id');
  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  // Filter bills for selected customer (only unpaid/pending bills)
  const customerBills = bills.filter(
    (b) => b.customerId === selectedCustomerId && (b.status === 'pending' || b.status === 'finalized')
  );

  const onSubmit = async (data: RecordPaymentInput) => {
    if (!currentStore) return;
    setError('');

    try {
      await createPayment({
        storeId: currentStore.id,
        customerId: data.customer_id,
        billId: data.bill_id || undefined,
        amount: data.amount,
        method: data.method,
        referenceId: data.reference_id || undefined,
        notes: data.notes || undefined,
      }).unwrap();

      router.push('/store/payments');
    } catch (err: any) {
      setError(err?.data?.message || err?.message || 'Failed to record payment');
    }
  };

  if (customersLoading || billsLoading) {
    return (
      <Box>
        <Skeleton variant="text" width={200} height={32} sx={{ mb: 3 }} />
        <Card sx={{ maxWidth: 600 }}>
          <CardContent sx={{ p: 3 }}>
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} variant="rounded" height={56} sx={{ mb: 2 }} />
            ))}
          </CardContent>
        </Card>
      </Box>
    );
  }

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
                          {c.name} ({c.phone}) — Balance: {fmt(Number(c.currentBalance))}
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
                    <Typography variant="body2">Outstanding: <strong style={{ color: '#d32f2f' }}>{fmt(Number(selectedCustomer.currentBalance))}</strong></Typography>
                  </Box>
                </Grid>
              )}

              {/* Bill dropdown (optional) */}
              {selectedCustomerId && customerBills.length > 0 && (
                <Grid size={{ xs: 12 }}>
                  <Controller name="bill_id" control={control} render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Link to Bill (optional)</InputLabel>
                      <Select {...field} label="Link to Bill (optional)" value={field.value || ''}>
                        <MenuItem value="">No bill linked</MenuItem>
                        {customerBills.map((b) => (
                          <MenuItem key={b.id} value={b.id}>
                            {b.billNumber} — {fmt(b.totalAmount)} ({b.status})
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )} />
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
              <Button type="submit" variant="contained" disabled={submitting}>{submitting ? 'Recording...' : 'Record Payment'}</Button>
              <Button variant="outlined" onClick={() => router.back()}>Cancel</Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
