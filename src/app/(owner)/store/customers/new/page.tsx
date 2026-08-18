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
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import PersonOutlined from '@mui/icons-material/PersonOutlined';
import AccountCircleOutlined from '@mui/icons-material/AccountCircleOutlined';
import { customerSchema, type CustomerInput, COUNTRY_CODES, PRICE_LEVELS } from '@/lib/validations/customer';
import { useCreateCustomerMutation } from '@/store/api/customersApi';
import { useAppSelector } from '@/store/hooks';
import { FormShell } from '@/components/layout/FormShell';

const fmt = (n: number) => `₹ ${n.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary' }}>{label}</Typography>
      <Typography sx={{ fontSize: '0.8125rem', fontWeight: 500, textAlign: 'right' }}>{value || '—'}</Typography>
    </Box>
  );
}

export default function NewCustomerPage() {
  const router = useRouter();
  const currentStore = useAppSelector((s) => s.auth.currentStore);
  const [error, setError] = useState('');
  const [createCustomer, { isLoading: loading }] = useCreateCustomerMutation();

  const { register, handleSubmit, control, watch, formState: { errors } } = useForm<CustomerInput>({
    resolver: zodResolver(customerSchema) as any,
    defaultValues: { credit_limit: 0 as any, country_code: '+91', phone: '', price_level: 'retail' },
  });

  const selectedCode = watch('country_code');
  const selectedCountry = COUNTRY_CODES.find(c => c.code === selectedCode);
  const maxDigits = selectedCountry?.maxDigits ?? 10;

  // Watch fields for preview
  const name = watch('name') || '';
  const phone = watch('phone') || '';
  const email = watch('email') || '';
  const creditLimit = Number(watch('credit_limit')) || 0;
  const priceLevel = watch('price_level') || 'retail';

  const onSubmit = async (data: CustomerInput) => {
    if (!currentStore) { setError('No store found.'); return; }
    setError('');
    const fullPhone = `${data.country_code}${data.phone}`;
    try {
      await createCustomer({
        storeId: currentStore.id,
        name: data.name,
        phone: fullPhone,
        email: data.email || undefined,
        address: data.address || undefined,
        creditLimit: data.credit_limit,
        priceLevel: data.price_level,
      }).unwrap();
      router.push('/store/customers');
    } catch (err: any) {
      const msg = err?.data?.error || err?.message || 'Failed to create customer';
      setError(msg.includes('phone already exists') ? 'A customer with this phone number already exists.' : msg);
    }
  };

  return (
    <FormShell
      title="Add Customer"
      subtitle="Enter customer details to add new customer."
      error={error}
      onSubmit={handleSubmit(onSubmit)}
      onCancel={() => router.back()}
      submitLabel="Add Customer"
      isSubmitting={loading}
      sections={[
        {
          title: 'Customer Information',
          icon: <PersonOutlined />,
          content: (
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <TextField fullWidth label="Customer Name *" placeholder="Enter customer name" {...register('name')} error={!!errors.name} helperText={errors.name?.message} />
              </Grid>
              <Grid size={{ xs: 4 }}>
                <Controller name="country_code" control={control} render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Code</InputLabel>
                    <Select {...field} label="Code">
                      {COUNTRY_CODES.map((c) => <MenuItem key={c.code} value={c.code}>{c.code} {c.country}</MenuItem>)}
                    </Select>
                  </FormControl>
                )} />
              </Grid>
              <Grid size={{ xs: 8 }}>
                <Controller name="phone" control={control} render={({ field }) => (
                  <TextField fullWidth label="Phone Number *" placeholder="Enter phone number" value={field.value}
                    onChange={(e) => field.onChange(e.target.value.replace(/\D/g, '').slice(0, maxDigits))}
                    error={!!errors.phone} helperText={errors.phone?.message || `Max ${maxDigits} digits`}
                    slotProps={{ input: { startAdornment: <InputAdornment position="start">{selectedCode}</InputAdornment> } }}
                  />
                )} />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField fullWidth label="Email (optional)" placeholder="Enter email address" {...register('email')} error={!!errors.email} helperText={errors.email?.message} />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField fullWidth label="Address (optional)" placeholder="Enter address" multiline rows={2} {...register('address')} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller name="credit_limit" control={control} render={({ field }) => (
                  <TextField fullWidth label="Credit Limit" type="number" value={field.value}
                    onChange={(e) => field.onChange(e.target.value === '' ? '' : Number(e.target.value))}
                    error={!!errors.credit_limit} helperText={errors.credit_limit?.message}
                    slotProps={{ input: { startAdornment: <InputAdornment position="start">₹</InputAdornment> } }}
                  />
                )} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller name="price_level" control={control} render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Price Level</InputLabel>
                    <Select {...field} label="Price Level">
                      {PRICE_LEVELS.map((level) => <MenuItem key={level.value} value={level.value}>{level.label}</MenuItem>)}
                    </Select>
                  </FormControl>
                )} />
              </Grid>
            </Grid>
          ),
        },
      ]}
      preview={
        <>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
            <AccountCircleOutlined sx={{ fontSize: 18, color: 'secondary.main' }} />
            <Typography sx={{ fontWeight: 700, fontSize: '1rem' }}>Customer Preview</Typography>
          </Box>

          {/* Avatar */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2.5 }}>
            <Avatar sx={{ width: 72, height: 72, bgcolor: 'secondary.light', color: 'secondary.dark', fontSize: '1.5rem', fontWeight: 700 }}>
              {name ? name.charAt(0).toUpperCase() : '?'}
            </Avatar>
          </Box>

          <Divider sx={{ mb: 2, borderStyle: 'dashed' }} />

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
            <PreviewRow label="Name" value={name} />
            <PreviewRow label="Phone" value={phone ? `${selectedCode}${phone}` : ''} />
            <PreviewRow label="Email" value={email} />
          </Box>

          <Divider sx={{ my: 2, borderStyle: 'dashed' }} />

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
            <PreviewRow label="Credit Limit" value={fmt(creditLimit)} />
            <PreviewRow label="Price Level" value={PRICE_LEVELS.find(l => l.value === priceLevel)?.label || 'Retail'} />
          </Box>
        </>
      }
    />
  );
}
