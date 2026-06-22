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
import ArrowBackOutlined from '@mui/icons-material/ArrowBackOutlined';
import { customerSchema, type CustomerInput, COUNTRY_CODES } from '@/lib/validations/customer';
import { createClient } from '@/lib/supabase/client';
import { useAppSelector } from '@/store/hooks';

export default function NewCustomerPage() {
  const router = useRouter();
  const currentStore = useAppSelector((s) => s.auth.currentStore);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, control, watch, formState: { errors } } = useForm<CustomerInput>({
    resolver: zodResolver(customerSchema) as any,
    defaultValues: { credit_limit: 0 as any, country_code: '+91', phone: '' },
  });

  const selectedCode = watch('country_code');
  const selectedCountry = COUNTRY_CODES.find(c => c.code === selectedCode);
  const maxDigits = selectedCountry?.maxDigits ?? 10;

  const onSubmit = async (data: CustomerInput) => {
    if (!currentStore) {
      setError('No store found. Please refresh and try again.');
      return;
    }
    setLoading(true);
    setError('');

    const supabase = createClient();
    const fullPhone = `${data.country_code}${data.phone}`;
    
    const { error: dbError } = await supabase.from('customers').insert({
      store_id: currentStore.id,
      name: data.name,
      phone: fullPhone,
      email: data.email || null,
      address: data.address || null,
      credit_limit: data.credit_limit,
    });

    if (dbError) {
      if (dbError.message.includes('idx_customers_phone_store')) {
        setError('A customer with this phone number already exists.');
      } else {
        setError(dbError.message);
      }
      setLoading(false);
      return;
    }
    router.push('/store/customers');
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <Button startIcon={<ArrowBackOutlined />} onClick={() => router.back()}>Back</Button>
        <Typography variant="h5">Add Customer</Typography>
      </Box>

      <Card sx={{ maxWidth: 600 }}>
        <CardContent sx={{ p: 3 }}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Customer Name"
                  {...register('name')}
                  error={!!errors.name}
                  helperText={errors.name?.message}
                />
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
                <TextField
                  fullWidth
                  label="Email (optional)"
                  {...register('email')}
                  error={!!errors.email}
                  helperText={errors.email?.message}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Address (optional)"
                  multiline
                  rows={2}
                  {...register('address')}
                />
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
              <Button type="submit" variant="contained" disabled={loading}>
                {loading ? 'Saving...' : 'Add Customer'}
              </Button>
              <Button variant="outlined" onClick={() => router.back()}>Cancel</Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
