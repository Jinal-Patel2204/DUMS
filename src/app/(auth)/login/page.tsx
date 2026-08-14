'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlined from '@mui/icons-material/VisibilityOffOutlined';
import NextLink from 'next/link';
import { loginSchema, type LoginInput } from '@/lib/validations/auth';

// ─── JAVA BACKEND SE CONNECT ───────────────────────────────────
// Pehle Supabase use ho raha tha, ab Java backend use hoga
import { loginUser } from '@/lib/api/auth';
// ────────────────────────────────────────────────────────────────

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema) as any,
  });

  /**
   * LOGIN SUBMIT — Jab user "Sign in" button click kare
   *
   * Flow:
   * 1. Form data lo (email + password)
   * 2. Java backend ko bhejo (POST /api/auth/login)
   * 3. Token mile → save karo
   * 4. Dashboard pe redirect karo
   */
  const onSubmit = async (data: LoginInput) => {
    setLoading(true);
    setError('');

    try {
      // ─── JAVA BACKEND CALL ─────────────────────────
      const result = await loginUser({
        email: data.email,
        password: data.password,
      });
      // result = { token, email, name, role }
      // Token already localStorage mein save ho gaya (auth.ts mein)
      // ───────────────────────────────────────────────

      // Redirect based on role
      if (redirect) {
        router.push(redirect);
      } else if (result.role === 'ADMIN') {
        router.push('/store/dashboard');
      } else {
        router.push('/customer/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      bgcolor: '#0F172A',
      p: 2,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background gradient orbs */}
      <Box sx={{ 
        position: 'absolute', top: '-20%', right: '-10%', 
        width: '50%', height: '60%', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <Box sx={{ 
        position: 'absolute', bottom: '-20%', left: '-10%', 
        width: '50%', height: '60%', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <Card sx={{ maxWidth: 420, width: '100%', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          {/* Brand */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box sx={{
              width: 48, height: 48, borderRadius: '12px', mx: 'auto', mb: 2,
              background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '1.25rem' }}>D</Typography>
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: '-0.02em' }}>
              Welcome back
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Sign in to your DUMS account
            </Typography>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 2.5 }}>{error}</Alert>}
          {redirect && <Alert severity="info" sx={{ mb: 2.5 }}>Please sign in to continue.</Alert>}

          <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.75, color: 'text.primary' }}>Email</Typography>
              <TextField
                fullWidth
                placeholder="you@example.com"
                type="email"
                autoFocus
                autoComplete="email"
                {...register('email')}
                error={!!errors.email}
                helperText={errors.email?.message}
              />
            </Box>
            <Box sx={{ mb: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75 }}>
                <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary' }}>Password</Typography>
                <Link component={NextLink} href="/forgot-password" variant="body2" sx={{ fontSize: '0.75rem' }}>
                  Forgot password?
                </Link>
              </Box>
              <TextField
                fullWidth
                placeholder="Enter your password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                {...register('password')}
                error={!!errors.password}
                helperText={errors.password?.message}
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small" aria-label="toggle password visibility">
                          {showPassword ? <VisibilityOffOutlined sx={{ fontSize: 18 }} /> : <VisibilityOutlined sx={{ fontSize: 18 }} />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </Box>
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{ 
                py: 1.25, 
                fontSize: '0.875rem',
                fontWeight: 600,
              }}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 3 }}>
            Don&apos;t have an account?{' '}
            <Link component={NextLink} href="/signup" sx={{ fontWeight: 500 }}>
              Create one
            </Link>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
