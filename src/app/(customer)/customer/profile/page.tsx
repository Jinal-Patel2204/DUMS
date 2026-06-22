'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';
import Skeleton from '@mui/material/Skeleton';
import { createClient } from '@/lib/supabase/client';

interface ProfileForm {
  full_name: string;
  phone: string;
  email: string;
}

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function CustomerProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwError, setPwError] = useState('');

  const { register, handleSubmit, reset } = useForm<ProfileForm>();
  const { register: regPw, handleSubmit: handlePw, reset: resetPw, watch } = useForm<PasswordForm>();

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
    setSaving(true); setError(''); setSuccess('');
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError('Not authenticated'); setSaving(false); return; }

    const { error: updateErr } = await supabase.from('user_profiles').update({
      full_name: data.full_name,
      phone: data.phone,
    }).eq('id', user.id);

    if (updateErr) { setError(updateErr.message); } else { setSuccess('Profile updated successfully'); }
    setSaving(false);
  };

  const onPasswordSubmit = async (data: PasswordForm) => {
    if (data.newPassword !== data.confirmPassword) { setPwError('Passwords do not match'); return; }
    if (data.newPassword.length < 6) { setPwError('Password must be at least 6 characters'); return; }
    setPwLoading(true); setPwError(''); setPwSuccess('');
    const supabase = createClient();

    const { error } = await supabase.auth.updateUser({ password: data.newPassword });
    if (error) { setPwError(error.message); } else { setPwSuccess('Password changed successfully'); resetPw(); }
    setPwLoading(false);
  };

  if (loading) return <Box><Typography variant="h5" sx={{ mb: 3 }}>Profile</Typography><Skeleton variant="rounded" height={300} /></Box>;

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>Profile</Typography>

      <Card sx={{ maxWidth: 600, mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Personal Information</Typography>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
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
            <Button type="submit" variant="contained" sx={{ mt: 2 }} disabled={saving}>
              {saving ? 'Saving...' : 'Update Profile'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Card sx={{ maxWidth: 600 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Change Password</Typography>
          {pwError && <Alert severity="error" sx={{ mb: 2 }}>{pwError}</Alert>}
          {pwSuccess && <Alert severity="success" sx={{ mb: 2 }}>{pwSuccess}</Alert>}
          <Box component="form" onSubmit={handlePw(onPasswordSubmit)} noValidate>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <TextField fullWidth label="New Password" type="password" {...regPw('newPassword')} />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField fullWidth label="Confirm Password" type="password" {...regPw('confirmPassword')} />
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
