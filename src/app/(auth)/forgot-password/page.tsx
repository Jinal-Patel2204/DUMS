'use client';

import { useState } from 'react';
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
import { forgotPasswordSchema, type ForgotPasswordInput } from '@/lib/validations/auth';
import { createClient } from '@/lib/supabase/client';

export default function ForgotPasswordPage() {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema) as any,
  });

  const onSubmit = async (data: ForgotPasswordInput) => {
    setLoading(true);
    setError('');
    const supabase = createClient();
    const { error: authError } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (authError) {
      setError(authError.message);
    } else {
      setSuccess(true);
    }
    setLoading(false);
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default', p: 2 }}>
      <Card sx={{ maxWidth: 420, width: '100%' }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" gutterBottom sx={{ textAlign: 'center' }}>Reset Password</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mb: 3 }}>
            Enter your email to receive a reset link
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>Check your email for reset link</Alert>}

          <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <TextField fullWidth label="Email" type="email" margin="normal" {...register('email')} error={!!errors.email} helperText={errors.email?.message} />
            <Button type="submit" fullWidth variant="contained" size="large" disabled={loading || success} sx={{ mt: 2, mb: 2 }}>
              {loading ? 'Sending...' : 'Send Reset Link'}
            </Button>
          </Box>

          <Box sx={{ textAlign: 'center' }}>
            <Link component={NextLink} href="/login" variant="body2">Back to login</Link>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
