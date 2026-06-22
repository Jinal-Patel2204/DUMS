'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Link from '@mui/material/Link';
import NextLink from 'next/link';
import { signupSchema, type SignupInput } from '@/lib/validations/auth';
import { createClient } from '@/lib/supabase/client';

export default function SignupPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema) as any,
  });

  const onSubmit = async (data: SignupInput) => {
    setLoading(true);
    setError('');
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: { full_name: data.full_name, phone: data.phone, role: 'store_owner' },
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }
    router.push('/store/dashboard');
    router.refresh();
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default', p: 2 }}>
      <Card sx={{ maxWidth: 420, width: '100%' }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" gutterBottom sx={{ textAlign: 'center' }}>Create Account</Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <TextField fullWidth label="Full Name" margin="normal" {...register('full_name')} error={!!errors.full_name} helperText={errors.full_name?.message} />
            <TextField fullWidth label="Email" type="email" margin="normal" {...register('email')} error={!!errors.email} helperText={errors.email?.message} />
            <TextField fullWidth label="Phone" margin="normal" {...register('phone')} error={!!errors.phone} helperText={errors.phone?.message} />
            <TextField fullWidth label="Password" type="password" margin="normal" {...register('password')} error={!!errors.password} helperText={errors.password?.message} />
            <TextField fullWidth label="Confirm Password" type="password" margin="normal" {...register('confirm_password')} error={!!errors.confirm_password} helperText={errors.confirm_password?.message} />
            <Button type="submit" fullWidth variant="contained" size="large" disabled={loading} sx={{ mt: 2, mb: 2 }}>
              {loading ? 'Creating...' : 'Create Account'}
            </Button>
          </Box>

          <Box sx={{ textAlign: 'center' }}>
            <Link component={NextLink} href="/login" variant="body2">Already have an account? Sign in</Link>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
