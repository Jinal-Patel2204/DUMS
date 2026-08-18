'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import InputAdornment from '@mui/material/InputAdornment';
import Divider from '@mui/material/Divider';
import PaymentsOutlined from '@mui/icons-material/PaymentsOutlined';
import ReceiptOutlined from '@mui/icons-material/ReceiptOutlined';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import { recordPaymentSchema, type RecordPaymentInput } from '@/lib/validations/payment';
import { useAppSelector } from '@/store/hooks';
import { useCreatePaymentMutation } from '@/store/api/paymentsApi';
import { useGetCustomersQuery } from '@/store/api/customersApi';
import { useGetBillsQuery } from '@/store/api/billsApi';
import { FormShell } from '@/components/layout/FormShell';

const fmt = (n: number) => `₹ ${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

function SummaryRow({ label, value, bold, color }: { label: string; value: string; bold?: boolean; color?: string }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary' }}>{label}</Typography>
      <Typography sx={{ fontSize: '0.8125rem', fontWeight: bold ? 700 : 500, color: color || 'text.primary', textAlign: 'right' }}>{value}</Typography>
    </Box>
  );
}

export default function RecordPaymentPage() {
  const router = useRouter();
  const currentStore = useAppSelector((s) => s.auth.currentStore);
  const [error, setError] = useState('');

  const { data: customersData, isLoading: customersLoading } = useGetCustomersQuery(
    { storeId: currentStore?.id ?? '' },
    { skip: !currentStore?.id }
  );
  const { data: bills = [], isLoading: billsLoading } = useGetBillsQuery(
    { storeId: currentStore?.id ?? '' },
    { skip: !currentStore?.id }
  );
  const [createPayment, { isLoading: submitting }] = useCreatePaymentMutation();

  const customers = customersData?.data ?? [];

  const { register, handleSubmit, control, watch, formState: { errors } } = useForm<RecordPaymentInput>({
    resolver: zodResolver(recordPaymentSchema) as any,
    defaultValues: { method: 'cash', amount: 0 as any },
  });

  const selectedCustomerId = watch('customer_id');
  const selectedBillId = watch('bill_id');
  const amount = Number(watch('amount')) || 0;
  const method = watch('method') || 'cash';

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);
  const customerBills = bills.filter(
    (b) => b.customerId === selectedCustomerId && b.status !== 'paid' && b.status !== 'cancelled'
  );
  const selectedBill = bills.find((b) => b.id === selectedBillId);

  const outstandingBefore = selectedCustomer ? Number(selectedCustomer.currentBalance) : 0;
  const remainingAfter = outstandingBefore - amount;

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

  return (
    <FormShell
      title="Record Payment"
      subtitle="Record a new payment received from your customer."
      error={error}
      isLoading={customersLoading || billsLoading}
      onSubmit={handleSubmit(onSubmit)}
      onCancel={() => router.back()}
      submitLabel="Record Payment"
      isSubmitting={submitting}
      sections={[
        {
          title: 'Payment Details',
          icon: <PaymentsOutlined />,
          content: (
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller name="customer_id" control={control} render={({ field }) => (
                  <FormControl fullWidth error={!!errors.customer_id}>
                    <InputLabel>Customer *</InputLabel>
                    <Select {...field} label="Customer *" value={field.value || ''}>
                      {customers.map((c) => (
                        <MenuItem key={c.id} value={c.id}>{c.name} ({c.phone})</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )} />
                {errors.customer_id && <Typography variant="caption" color="error">{errors.customer_id.message}</Typography>}
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller name="bill_id" control={control} render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Bill / Invoice</InputLabel>
                    <Select {...field} label="Bill / Invoice" value={field.value || ''} disabled={!selectedCustomerId}>
                      <MenuItem value="">No bill linked</MenuItem>
                      {customerBills.map((b) => (
                        <MenuItem key={b.id} value={b.id}>{b.billNumber} — {fmt(b.totalAmount)}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )} />
                {!selectedCustomerId && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                    Select a customer first to see their bills.
                  </Typography>
                )}
                {selectedCustomerId && customerBills.length === 0 && (
                  <Typography variant="caption" color="warning.main" sx={{ mt: 0.5, display: 'block' }}>
                    No pending bills found for this customer. You can still record payment without linking a bill.
                  </Typography>
                )}
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller name="amount" control={control} render={({ field }) => (
                  <TextField fullWidth label="Amount Received *" type="number"
                    value={field.value || ''}
                    onChange={(e) => field.onChange(e.target.value === '' ? '' : Number(e.target.value))}
                    error={!!errors.amount} helperText={errors.amount?.message}
                    slotProps={{ input: { startAdornment: <InputAdornment position="start">₹</InputAdornment> } }}
                  />
                )} />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller name="method" control={control} render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Payment Method *</InputLabel>
                    <Select {...field} label="Payment Method *">
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
                <TextField fullWidth label="Reference ID (UPI Ref / Cheque No. / Transaction ID)" placeholder="Enter reference id (optional)" {...register('reference_id')} />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth label="Payment Date *" type="date" defaultValue={new Date().toISOString().split('T')[0]}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <TextField fullWidth label="Notes (optional)" placeholder="Add any notes..." multiline rows={3} {...register('notes')}
                  slotProps={{ htmlInput: { maxLength: 300 } }}
                  helperText={`${(watch('notes') || '').length}/300`}
                />
              </Grid>
            </Grid>
          ),
        },
      ]}
      preview={
        <>
          {/* Preview Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Box sx={{ width: 28, height: 28, borderRadius: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'secondary.main', color: 'white' }}>
              <ReceiptOutlined sx={{ fontSize: 16 }} />
            </Box>
            <Typography sx={{ fontWeight: 700, fontSize: '1rem' }}>Payment Summary</Typography>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
            <SummaryRow label="Customer" value={selectedCustomer?.name || '—'} />
            <SummaryRow label="Bill / Invoice" value={selectedBill?.billNumber || '—'} />
            {selectedBill && (
              <>
                <SummaryRow label="Bill Date" value={selectedBill.createdAt ? new Date(selectedBill.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'} />
                <SummaryRow label="Bill Total" value={fmt(selectedBill.totalAmount)} />
              </>
            )}
          </Box>

          <Divider sx={{ my: 2, borderStyle: 'dashed' }} />

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
            <SummaryRow label="Outstanding Amount (Before)" value={fmt(outstandingBefore)} color="error.main" />
            <SummaryRow label="Payment Amount" value={fmt(amount)} bold color="success.main" />
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Remaining */}
          <Box sx={{
            p: 1.5,
            bgcolor: remainingAfter > 0 ? '#FEF2F2' : '#ECFDF5',
            borderRadius: 2,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600, color: remainingAfter > 0 ? 'error.main' : 'success.main' }}>
              Remaining Outstanding
            </Typography>
            <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: remainingAfter > 0 ? 'error.main' : 'success.main' }}>
              {fmt(Math.max(remainingAfter, 0))}
            </Typography>
          </Box>

          {/* Info note */}
          {selectedBill && (
            <Box sx={{ mt: 2, display: 'flex', gap: 1, alignItems: 'flex-start' }}>
              <InfoOutlined sx={{ fontSize: 16, color: 'info.main', mt: 0.25 }} />
              <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.4 }}>
                This payment will be adjusted to the outstanding amount of the selected bill.
              </Typography>
            </Box>
          )}
        </>
      }
    />
  );
}
