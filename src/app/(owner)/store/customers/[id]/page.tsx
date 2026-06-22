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
import ArrowBackOutlined from '@mui/icons-material/ArrowBackOutlined';
import EditOutlined from '@mui/icons-material/EditOutlined';
import { customerSchema, type CustomerInput, COUNTRY_CODES } from '@/lib/validations/customer';
import { createClient } from '@/lib/supabase/client';
import type { Customer } from '@/types/database';

// Parse stored phone like "+919835473322" into { code: "+91", number: "9835473322" }
function parsePhone(fullPhone: string): { code: string; number: string } {
  for (const c of COUNTRY_CODES.sort((a, b) => b.code.length - a.code.length)) {
    if (fullPhone.startsWith(c.code)) {
      return { code: c.code, number: fullPhone.slice(c.code.length) };
    }
  }
  // Fallback: if starts with + but no match, treat entire thing as number
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

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [editing, setEditing] = useState(isEdit);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, control, watch, formState: { errors }, reset } = useForm<CustomerInput>({
    resolver: zodResolver(customerSchema) as any,
    defaultValues: { country_code: '+91', phone: '', credit_limit: 0 as any },
  });

  const selectedCode = watch('country_code');
  const selectedCountry = COUNTRY_CODES.find(c => c.code === selectedCode);
  const maxDigits = selectedCountry?.maxDigits ?? 10;

  useEffect(() => {
    const fetchCustomer = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('customers')
        .select('*')
        .eq('id', params.id)
        .single();
      if (data) {
        setCustomer(data as Customer);
        const parsed = parsePhone(data.phone);
        reset({
          name: data.name,
          country_code: parsed.code,
          phone: parsed.number,
          email: data.email || '',
          address: data.address || '',
          credit_limit: Number(data.credit_limit),
        });
      }
    };
    fetchCustomer();
  }, [params.id, reset]);

  const onSubmit = async (data: CustomerInput) => {
    setLoading(true);
    setError('');
    const supabase = createClient();
    const fullPhone = `${data.country_code}${data.phone}`;

    const { error: dbError } = await supabase
      .from('customers')
      .update({
        name: data.name,
        phone: fullPhone,
        email: data.email || null,
        address: data.address || null,
        credit_limit: data.credit_limit,
      })
      .eq('id', params.id);

    if (dbError) {
      setError(dbError.message);
      setLoading(false);
      return;
    }
    // Refresh customer data
    const { data: updated } = await supabase
      .from('customers')
      .select('*')
      .eq('id', params.id)
      .single();
    if (updated) setCustomer(updated as Customer);
    setEditing(false);
    setLoading(false);
  };

  const formatCurrency = (n: number) => `₹${Number(n).toLocaleString('en-IN')}`;

  if (!customer) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <Button startIcon={<ArrowBackOutlined />} onClick={() => router.push('/store/customers')}>Back</Button>
        <Typography variant="h5" sx={{ flex: 1 }}>{customer.name}</Typography>
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
                    {formatCurrency(customer.current_balance)}
                  </Typography>
                </Box>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                  <Typography variant="body2" color="text.secondary">Credit Limit</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>{formatCurrency(customer.credit_limit)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                  <Typography variant="body2" color="text.secondary">Trust Score</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>{customer.trust_score}/100</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                  <Typography variant="body2" color="text.secondary">Status</Typography>
                  <Chip label={customer.is_active ? 'Active' : 'Inactive'} size="small" color={customer.is_active ? 'success' : 'default'} />
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
                    <Typography>{new Date(customer.created_at).toLocaleDateString('en-IN')}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="body2" color="text.secondary">Invitation</Typography>
                    <Typography>{customer.invitation_status || 'Not invited'}</Typography>
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
                <Button type="submit" variant="contained" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Changes'}
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
