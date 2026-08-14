'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Alert from '@mui/material/Alert';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import InputAdornment from '@mui/material/InputAdornment';
import EditOutlined from '@mui/icons-material/EditOutlined';
import { customerSchema, type CustomerInput, COUNTRY_CODES } from '@/lib/validations/customer';
import {
  useGetCustomerQuery,
  useUpdateCustomerMutation,
  type CustomerResponse,
} from '@/store/api/customersApi';

// Parse stored phone like "+919835473322" into { code: "+91", number: "9835473322" }
function parsePhone(fullPhone: string): { code: string; number: string } {
  for (const c of COUNTRY_CODES.sort((a, b) => b.code.length - a.code.length)) {
    if (fullPhone.startsWith(c.code)) {
      return { code: c.code, number: fullPhone.slice(c.code.length) };
    }
  }
  if (fullPhone.startsWith('+')) {
    return { code: '+91', number: fullPhone.replace(/\D/g, '').slice(2) };
  }
  return { code: '+91', number: fullPhone.replace(/\D/g, '') };
}

export default function CustomerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const isEdit = searchParams.get('edit') === 'true';
  const customerId = params.id as string;

  const [editing, setEditing] = useState(isEdit);
  const [error, setError] = useState('');

  // ─── JAVA BACKEND CALLS ─────────────────────────────
  const { data: customer, isLoading } = useGetCustomerQuery({ id: customerId });
  const [updateCustomer, { isLoading: saving }] = useUpdateCustomerMutation();
  // ────────────────────────────────────────────────────

  const { register, handleSubmit, control, watch, formState: { errors }, reset } = useForm<CustomerInput>({
    resolver: zodResolver(customerSchema) as any,
    defaultValues: { country_code: '+91', phone: '', credit_limit: 0 as any },
  });

  const selectedCode = watch('country_code');
  const selectedCountry = COUNTRY_CODES.find(c => c.code === selectedCode);
  const maxDigits = selectedCountry?.maxDigits ?? 10;

  // Populate form when customer data loads
  useEffect(() => {
    if (customer) {
      const parsed = parsePhone(customer.phone);
      reset({
        name: customer.name,
        country_code: parsed.code,
        phone: parsed.number,
        email: customer.email || '',
        address: customer.address || '',
        credit_limit: customer.creditLimit,
      });
    }
  }, [customer, reset]);

  const onSubmit = async (data: CustomerInput) => {
    setError('');
    const fullPhone = `${data.country_code}${data.phone}`;

    try {
      await updateCustomer({
        id: customerId,
        data: {
          name: data.name,
          phone: fullPhone,
          email: data.email || undefined,
          address: data.address || undefined,
          creditLimit: data.credit_limit,
        },
      }).unwrap();
      setEditing(false);
    } catch (err: any) {
      setError(err?.data?.error || err?.message || 'Failed to update customer');
    }
  };

  const formatCurrency = (n: number) => `₹${Number(n).toLocaleString('en-IN')}`;

  if (isLoading || !customer) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">{customer.name}</Typography>
        {!editing && (
          <Button startIcon={<EditOutlined />} variant="outlined" onClick={() => setEditing(true)}>
            Edit
          </Button>
        )}
      </Box>

      {!editing ? (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Balance Summary</Typography>
                <Box sx={{ py: 1 }}>
                  <Typography variant="body2" color="text.secondary">Outstanding Balance</Typography>
                  <Typography variant="h4" color="error.main" sx={{ fontWeight: 700 }}>
                    {formatCurrency(customer.currentBalance)}
                  </Typography>
                </Box>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                  <Typography variant="body2" color="text.secondary">Credit Limit</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>{formatCurrency(customer.creditLimit)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                  <Typography variant="body2" color="text.secondary">Status</Typography>
                  <Chip label={customer.isActive ? 'Active' : 'Inactive'} size="small" color={customer.isActive ? 'success' : 'default'} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 8 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Details</Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="body2" color="text.secondary">Phone</Typography>
                    <Typography>{customer.phone}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="body2" color="text.secondary">Email</Typography>
                    <Typography>{customer.email || '—'}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="body2" color="text.secondary">Address</Typography>
                    <Typography>{customer.address || '—'}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="body2" color="text.secondary">Member Since</Typography>
                    <Typography>{new Date(customer.createdAt).toLocaleDateString('en-IN')}</Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      ) : (
        <Card sx={{ maxWidth: 600 }}>
          <CardContent sx={{ p: 3 }}>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12 }}>
                  <TextField fullWidth label="Customer Name" {...register('name')} error={!!errors.name} helperText={errors.name?.message} />
                </Grid>

                <Grid size={{ xs: 4 }}>
                  <Controller
                    name="country_code"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth>
                        <InputLabel>Code</InputLabel>
                        <Select {...field} label="Code">
                          {COUNTRY_CODES.map((c) => (
                            <MenuItem key={c.code} value={c.code}>
                              {c.code} {c.country}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}
                  />
                </Grid>

                <Grid size={{ xs: 8 }}>
                  <Controller
                    name="phone"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        fullWidth
                        label="Phone Number"
                        value={field.value}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, maxDigits);
                          field.onChange(val);
                        }}
                        error={!!errors.phone}
                        helperText={errors.phone?.message || `Max ${maxDigits} digits`}
                        slotProps={{
                          input: {
                            startAdornment: <InputAdornment position="start">{selectedCode}</InputAdornment>,
                          },
                        }}
                      />
                    )}
                  />
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <TextField fullWidth label="Email" {...register('email')} error={!!errors.email} helperText={errors.email?.message} />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField fullWidth label="Address" multiline rows={2} {...register('address')} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Controller
                    name="credit_limit"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        fullWidth
                        label="Credit Limit"
                        type="number"
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value === '' ? '' : Number(e.target.value))}
                        error={!!errors.credit_limit}
                        helperText={errors.credit_limit?.message}
                        slotProps={{
                          input: {
                            startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                          },
                        }}
                      />
                    )}
                  />
                </Grid>
              </Grid>
              <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
                <Button type="submit" variant="contained" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button variant="outlined" onClick={() => setEditing(false)}>Cancel</Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
