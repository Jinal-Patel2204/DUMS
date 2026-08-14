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
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import LinearProgress from '@mui/material/LinearProgress';
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlined from '@mui/icons-material/VisibilityOffOutlined';
import NextLink from 'next/link';
import { signupSchema, type SignupInput } from '@/lib/validations/auth';

// ─── JAVA BACKEND SE CONNECT ───────────────────────────────────
import { registerUser } from '@/lib/api/auth';
// ────────────────────────────────────────────────────────────────

function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) return { score: 25, label: 'Weak', color: '#EF4444' };
  if (score <= 3) return { score: 50, label: 'Fair', color: '#F59E0B' };
  if (score <= 4) return { score: 75, label: 'Good', color: '#3B82F6' };
  return { score: 100, label: 'Strong', color: '#10B981' };
}

export default function SignupPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema) as any,
    defaultValues: { accept_terms: false as any },
  });

  const password = watch('password') || '';
  const strength = getPasswordStrength(password);

  const onSubmit = async (data: SignupInput) => {
    setLoading(true);
    setError('');

    try {
      // ─── JAVA BACKEND CALL ─────────────────────────
      await registerUser({
        name: data.full_name,
        email: data.email,
        password: data.password,
        phone: data.phone,
      });
      // Token automatically localStorage mein save ho jaata hai
      // ───────────────────────────────────────────────

      router.push('/store/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
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

      <Card sx={{ maxWidth: 460, width: '100%', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          {/* Brand */}
          <Box sx={{ textAlign: 'center', mb: 3.5 }}>
            <Box sx={{
              width: 48, height: 48, borderRadius: '12px', mx: 'auto', mb: 2,
              background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '1.25rem' }}>D</Typography>
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: '-0.02em' }}>
              Create your account
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Start managing your store credit system
            </Typography>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 2.5 }}>{error}</Alert>}

          <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 2 }}>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.75 }}>Full Name</Typography>
                <TextField
                  fullWidth
                  placeholder="John Doe"
                  autoFocus
                  {...register('full_name')}
                  error={!!errors.full_name}
                  helperText={errors.full_name?.message}
                />
              </Box>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.75 }}>Phone</Typography>
                <TextField
                  fullWidth
                  placeholder="10+ digits"
                  {...register('phone')}
                  error={!!errors.phone}
                  helperText={errors.phone?.message}
                />
              </Box>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.75 }}>Email</Typography>
              <TextField
                fullWidth
                placeholder="you@example.com"
                type="email"
                {...register('email')}
                error={!!errors.email}
                helperText={errors.email?.message}
              />
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.75 }}>Password</Typography>
              <TextField
                fullWidth
                placeholder="Min 8 characters"
                type={showPassword ? 'text' : 'password'}
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
              {password && (
                <Box sx={{ mt: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="caption" color="text.secondary">Password strength</Typography>
                    <Typography variant="caption" sx={{ color: strength.color, fontWeight: 600 }}>{strength.label}</Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={strength.score} 
                    sx={{ height: 3, borderRadius: 2, bgcolor: 'action.hover', '& .MuiLinearProgress-bar': { bgcolor: strength.color, borderRadius: 2 } }} 
                  />
                </Box>
              )}
            </Box>

            <Box sx={{ mb: 2.5 }}>
              <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.75 }}>Confirm Password</Typography>
              <TextField
                fullWidth
                placeholder="Re-enter password"
                type="password"
                {...register('confirm_password')}
                error={!!errors.confirm_password}
                helperText={errors.confirm_password?.message}
              />
            </Box>

            <FormControlLabel
              control={<Checkbox {...register('accept_terms')} size="small" />}
              label={
                <Typography variant="body2" color="text.secondary">
                  I agree to the Terms of Service and Privacy Policy
                </Typography>
              }
              sx={{ mb: 0.5 }}
            />
            {errors.accept_terms && (
              <FormHelperText error>{errors.accept_terms.message}</FormHelperText>
            )}

            <Button 
              type="submit" 
              fullWidth 
              variant="contained" 
              disabled={loading} 
              sx={{ mt: 2, py: 1.25, fontSize: '0.875rem', fontWeight: 600 }}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 3 }}>
            Already have an account?{' '}
            <Link component={NextLink} href="/login" sx={{ fontWeight: 500 }}>
              Sign in
            </Link>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
