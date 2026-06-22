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
import { resetPasswordSchema, type ResetPasswordInput } from '@/lib/validations/auth';
import { createClient } from '@/lib/supabase/client';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema) as any,
  });

  const onSubmit = async (data: ResetPasswordInput) => {
    setLoading(true);
    setError('');
    const supabase = createClient();
    const { error: authError } = await supabase.auth.updateUser({ password: data.password });

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
          <Typography variant="h5" gutterBottom sx={{ textAlign: 'center' }}>Set New Password</Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <TextField fullWidth label="New Password" type="password" margin="normal" {...register('password')} error={!!errors.password} helperText={errors.password?.message} />
            <TextField fullWidth label="Confirm Password" type="password" margin="normal" {...register('confirm_password')} error={!!errors.confirm_password} helperText={errors.confirm_password?.message} />
            <Button type="submit" fullWidth variant="contained" size="large" disabled={loading} sx={{ mt: 2, mb: 2 }}>
              {loading ? 'Updating...' : 'Update Password'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
