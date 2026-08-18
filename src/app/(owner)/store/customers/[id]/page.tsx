'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import InputAdornment from '@mui/material/InputAdornment';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import EditOutlined from '@mui/icons-material/EditOutlined';
import PersonOutlined from '@mui/icons-material/PersonOutlined';
import AccountCircleOutlined from '@mui/icons-material/AccountCircleOutlined';
import { customerSchema, type CustomerInput, COUNTRY_CODES, PRICE_LEVELS } from '@/lib/validations/customer';
import { useGetCustomerQuery, useUpdateCustomerMutation } from '@/store/api/customersApi';
import { DetailShell } from '@/components/layout/DetailShell';
import { FormShell } from '@/components/layout/FormShell';

function parsePhone(fullPhone: string): { code: string; number: string } {
  for (const c of COUNTRY_CODES.sort((a, b) => b.code.length - a.code.length)) {
    if (fullPhone.startsWith(c.code)) return { code: c.code, number: fullPhone.slice(c.code.length) };
  }
  return { code: '+91', number: fullPhone.replace(/\D/g, '') };
}

const fmt = (n: number) => `₹ ${n.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary' }}>{label}</Typography>
      <Typography sx={{ fontSize: '0.8125rem', fontWeight: 500, textAlign: 'right' }}>{value || '—'}</Typography>
    </Box>
  );
}

export default function CustomerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const isEdit = searchParams.get('edit') === 'true';
  const customerId = params.id as string;

  const [editing, setEditing] = useState(isEdit);
  const [error, setError] = useState('');

  const { data: customer, isLoading } = useGetCustomerQuery({ id: customerId });
  const [updateCustomer, { isLoading: saving }] = useUpdateCustomerMutation();

  const { register, handleSubmit, control, watch, formState: { errors }, reset } = useForm<CustomerInput>({
    resolver: zodResolver(customerSchema) as any,
    defaultValues: { country_code: '+91', phone: '', credit_limit: 0 as any, price_level: 'retail' },
  });

  const selectedCode = watch('country_code');
  const selectedCountry = COUNTRY_CODES.find(c => c.code === selectedCode);
  const maxDigits = selectedCountry?.maxDigits ?? 10;

  const name = watch('name') || '';
  const phone = watch('phone') || '';
  const email = watch('email') || '';
  const creditLimit = Number(watch('credit_limit')) || 0;
  const priceLevel = watch('price_level') || 'retail';

  useEffect(() => {
    if (customer) {
      const parsed = parsePhone(customer.phone);
      reset({
        name: customer.name, country_code: parsed.code, phone: parsed.number,
        email: customer.email || '', address: customer.address || '',
        credit_limit: customer.creditLimit, price_level: (customer.priceLevel as any) || 'retail',
      });
    }
  }, [customer, reset]);

  const onSubmit = async (data: CustomerInput) => {
    setError('');
    const fullPhone = `${data.country_code}${data.phone}`;
    try {
      await updateCustomer({
        id: customerId,
        data: { name: data.name, phone: fullPhone, email: data.email || undefined, address: data.address || undefined, creditLimit: data.credit_limit, priceLevel: data.price_level },
      }).unwrap();
      setEditing(false);
      router.replace(`/store/customers/${customerId}`);
    } catch (err: any) {
      setError(err?.data?.error || err?.message || 'Failed to update customer');
    }
  };

  // ─── VIEW MODE ───────────────────────────────────────
  if (!editing) {
    return (
      <DetailShell
        pageTitle="Customer Details"
        heading={customer?.name || 'Customer'}
        isLoading={isLoading}
        error={!customer && !isLoading ? 'Customer not found' : null}
        status={customer ? { label: customer.isActive ? 'Active' : 'Inactive', color: customer.isActive ? 'success' : 'default' } : undefined}
        accentColor="secondary.main"
        actions={[{ label: 'Edit', icon: <EditOutlined sx={{ fontSize: 16 }} />, onClick: () => setEditing(true) }]}
        leftFields={customer ? [
          { label: 'Outstanding Balance', value: fmt(customer.currentBalance), large: true },
          { label: 'Credit Limit', value: fmt(customer.creditLimit) },
          { label: 'Price Level', value: <Chip label={PRICE_LEVELS.find(l => l.value === customer.priceLevel)?.label || 'Retail'} size="small" color={customer.priceLevel === 'vip' ? 'warning' : customer.priceLevel === 'wholesale' ? 'info' : 'default'} /> },
        ] : []}
        rightFields={customer ? [
          { label: 'Phone', value: customer.phone },
          { label: 'Email', value: customer.email || '—' },
          { label: 'Address', value: customer.address || '—' },
          { label: 'Member Since', value: new Date(customer.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) },
        ] : []}
      />
    );
  }

  // ─── EDIT MODE ───────────────────────────────────────
  if (isLoading || !customer) return <DetailShell pageTitle="Customer Details" heading="Loading..." isLoading={true} />;

  return (
    <FormShell
      title="Edit Customer"
      subtitle={`Update details for ${customer.name}`}
      error={error}
      onSubmit={handleSubmit(onSubmit)}
      onCancel={() => { setEditing(false); router.replace(`/store/customers/${customerId}`); }}
      submitLabel="Save Changes"
      isSubmitting={saving}
      sections={[
        {
          title: 'Customer Information',
          icon: <PersonOutlined />,
          content: (
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <TextField fullWidth label="Customer Name *" {...register('name')} error={!!errors.name} helperText={errors.name?.message} />
              </Grid>
              <Grid size={{ xs: 4 }}>
                <Controller name="country_code" control={control} render={({ field }) => (
                  <FormControl fullWidth><InputLabel>Code</InputLabel>
                    <Select {...field} label="Code">{COUNTRY_CODES.map((c) => <MenuItem key={c.code} value={c.code}>{c.code} {c.country}</MenuItem>)}</Select>
                  </FormControl>
                )} />
              </Grid>
              <Grid size={{ xs: 8 }}>
                <Controller name="phone" control={control} render={({ field }) => (
                  <TextField fullWidth label="Phone Number *" value={field.value}
                    onChange={(e) => field.onChange(e.target.value.replace(/\D/g, '').slice(0, maxDigits))}
                    error={!!errors.phone} helperText={errors.phone?.message || `Max ${maxDigits} digits`}
                    slotProps={{ input: { startAdornment: <InputAdornment position="start">{selectedCode}</InputAdornment> } }}
                  />
                )} />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField fullWidth label="Email" {...register('email')} error={!!errors.email} helperText={errors.email?.message} />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField fullWidth label="Address" multiline rows={2} {...register('address')} />
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
                  <FormControl fullWidth><InputLabel>Price Level</InputLabel>
                    <Select {...field} label="Price Level">{PRICE_LEVELS.map((l) => <MenuItem key={l.value} value={l.value}>{l.label}</MenuItem>)}</Select>
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
