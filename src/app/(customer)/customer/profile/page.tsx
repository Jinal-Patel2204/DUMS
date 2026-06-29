'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import Skeleton from '@mui/material/Skeleton';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlined from '@mui/icons-material/VisibilityOffOutlined';
import { changePasswordSchema, type ChangePasswordInput } from '@/lib/validations/auth';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/providers/ToastProvider';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';

interface ProfileForm {
  full_name: string;
  phone: string;
  email: string;
}

export default function CustomerProfilePage() {
  const { showSuccess, showError } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, reset, formState: { isDirty } } = useForm<ProfileForm>();
  const { register: regPw, handleSubmit: handlePw, reset: resetPw, formState: { errors: pwErrors } } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema) as any,
  });

  useUnsavedChanges(isDirty);

  useEffect(() => {
    const fetch = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data } = await supabase.from('user_profiles').select('*').eq('id', user.id).single();
      if (data) {
        setProfile(data);
        reset({ full_name: data.full_name, phone: data.phone, email: user.email || '' });
      }
      setLoading(false);
    };
    fetch();
  }, [reset]);

  const onProfileSubmit = async (data: ProfileForm) => {
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { showError('Not authenticated'); setSaving(false); return; }

    const { error: updateErr } = await supabase.from('user_profiles').update({
      full_name: data.full_name,
      phone: data.phone,
    }).eq('id', user.id);

    if (updateErr) {
      showError(updateErr.message);
    } else {
      showSuccess('Profile updated successfully');
      reset(data); // Reset dirty state
    }
    setSaving(false);
  };

  const onPasswordSubmit = async (data: ChangePasswordInput) => {
    setPwLoading(true);
    const supabase = createClient();

    // Verify current password by attempting sign-in
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) { showError('Cannot verify identity'); setPwLoading(false); return; }

    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: data.current_password,
    });

    if (signInErr) {
      showError('Current password is incorrect');
      setPwLoading(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: data.new_password });
    if (error) {
      showError(error.message);
    } else {
      showSuccess('Password changed successfully');
      resetPw();
    }
    setPwLoading(false);
  };

  if (loading) {
    return (
      <Box>
        <Typography variant="h5" sx={{ mb: 3 }}>Profile</Typography>
        <Skeleton variant="rounded" height={300} sx={{ maxWidth: 600 }} />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>Profile</Typography>

      <Card sx={{ maxWidth: 600, mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Personal Information</Typography>
          <Box component="form" onSubmit={handleSubmit(onProfileSubmit)} noValidate>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <TextField fullWidth label="Full Name" {...register('full_name')} />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField fullWidth label="Phone" {...register('phone')} />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField fullWidth label="Email" {...register('email')} disabled helperText="Email cannot be changed" />
              </Grid>
            </Grid>
            <Button type="submit" variant="contained" sx={{ mt: 2 }} disabled={saving || !isDirty}>
              {saving ? 'Saving...' : 'Update Profile'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Card sx={{ maxWidth: 600 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Change Password</Typography>
          <Box component="form" onSubmit={handlePw(onPasswordSubmit)} noValidate>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Current Password"
                  type={showPassword ? 'text' : 'password'}
                  {...regPw('current_password')}
                  error={!!pwErrors.current_password}
                  helperText={pwErrors.current_password?.message}
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">
                            {showPassword ? <VisibilityOffOutlined fontSize="small" /> : <VisibilityOutlined fontSize="small" />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="New Password"
                  type="password"
                  {...regPw('new_password')}
                  error={!!pwErrors.new_password}
                  helperText={pwErrors.new_password?.message || 'Min 8 chars, uppercase, lowercase, number, special char'}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Confirm New Password"
                  type="password"
                  {...regPw('confirm_password')}
                  error={!!pwErrors.confirm_password}
                  helperText={pwErrors.confirm_password?.message}
                />
              </Grid>
            </Grid>
            <Button type="submit" variant="contained" sx={{ mt: 2 }} disabled={pwLoading}>
              {pwLoading ? 'Changing...' : 'Change Password'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
