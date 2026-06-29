'use client';

import { useState, useEffect } from 'react';
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
import Chip from '@mui/material/Chip';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import AddOutlined from '@mui/icons-material/AddOutlined';
import DeleteOutlined from '@mui/icons-material/DeleteOutlined';
import { reminderRuleSchema, type ReminderRuleInput } from '@/lib/validations/settings';
import { createClient } from '@/lib/supabase/client';
import { useAppSelector } from '@/store/hooks';
import { debugLog } from '@/lib/debug-logger';

interface ReminderRule { id: string; name: string; trigger_type: string; days_offset: number; repeat_frequency: string | null; repeat_max_count: number | null; channels: string[]; message_template: string; is_active: boolean; }

export default function ReminderRulesPage() {
  const currentStore = useAppSelector((s) => s.auth.currentStore);
  const [rules, setRules] = useState<ReminderRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<ReminderRuleInput>({
    resolver: zodResolver(reminderRuleSchema) as any,
    defaultValues: { trigger_type: 'before_due', days_offset: 3 as any, channels: ['in_app'], is_active: true },
  });

  const fetchRules = async () => {
    if (!currentStore?.id) return;
    const supabase = createClient();
    const { data } = await supabase.from('due_reminder_rules').select('*').eq('store_id', currentStore.id).eq('is_deleted', false).order('priority');
    setRules((data as ReminderRule[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchRules(); }, [currentStore?.id]);

  const onSubmit = async (data: ReminderRuleInput) => {
    if (!currentStore) return;
    setSaving(true); setError('');
    const supabase = createClient();
    const { error: dbErr } = await supabase.from('due_reminder_rules').insert({
      store_id: currentStore.id, name: data.name, trigger_type: data.trigger_type,
      days_offset: data.days_offset, repeat_frequency: data.repeat_frequency || null,
      repeat_max_count: data.repeat_max_count || null, channels: JSON.stringify(data.channels),
      message_template: data.message_template, is_active: data.is_active,
    });
    if (dbErr) { setError(dbErr.message); } else { setDialogOpen(false); reset(); fetchRules(); debugLog('settings', 'reminder_rule_created', `Rule "${data.name}" created`, 'success'); }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this rule?')) return;
    const supabase = createClient();
    await supabase.from('due_reminder_rules').update({ is_deleted: true }).eq('id', id);
    setRules((prev) => prev.filter((r) => r.id !== id));
  };

  if (loading) return <Typography>Loading...</Typography>;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Reminder Rules</Typography>
        <Button variant="contained" startIcon={<AddOutlined />} onClick={() => setDialogOpen(true)}>Add Rule</Button>
      </Box>

      <Card>
        {rules.length === 0 ? (
          <CardContent><Typography color="text.secondary">No reminder rules configured. Add one to auto-remind customers.</Typography></CardContent>
        ) : (
          <TableContainer><Table size="small"><TableHead><TableRow>
            <TableCell>Name</TableCell><TableCell>Trigger</TableCell><TableCell>Days</TableCell><TableCell>Repeat</TableCell><TableCell>Active</TableCell><TableCell>Actions</TableCell>
          </TableRow></TableHead><TableBody>
            {rules.map((r) => (
              <TableRow key={r.id}>
                <TableCell>{r.name}</TableCell>
                <TableCell><Chip label={r.trigger_type.replace('_', ' ')} size="small" /></TableCell>
                <TableCell>{r.days_offset}</TableCell>
                <TableCell>{r.repeat_frequency || '—'}</TableCell>
                <TableCell><Chip label={r.is_active ? 'Yes' : 'No'} size="small" color={r.is_active ? 'success' : 'default'} /></TableCell>
                <TableCell><IconButton size="small" color="error" onClick={() => handleDelete(r.id)}><DeleteOutlined fontSize="small" /></IconButton></TableCell>
              </TableRow>
            ))}
          </TableBody></Table></TableContainer>
        )}
      </Card>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>New Reminder Rule</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12 }}><TextField fullWidth label="Rule Name *" {...register('name')} error={!!errors.name} helperText={errors.name?.message} /></Grid>
            <Grid size={{ xs: 6 }}>
              <Controller name="trigger_type" control={control} render={({ field }) => (
                <FormControl fullWidth><InputLabel>Trigger</InputLabel><Select {...field} label="Trigger">
                  <MenuItem value="before_due">Before Due</MenuItem><MenuItem value="on_due_date">On Due Date</MenuItem><MenuItem value="after_overdue">After Overdue</MenuItem>
                </Select></FormControl>
              )} />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <Controller name="days_offset" control={control} render={({ field }) => (
                <TextField fullWidth label="Days Offset" type="number" value={field.value} onChange={(e) => field.onChange(Number(e.target.value))} />
              )} />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <Controller name="repeat_frequency" control={control} render={({ field }) => (
                <FormControl fullWidth><InputLabel>Repeat</InputLabel><Select {...field} label="Repeat" value={field.value || ''}>
                  <MenuItem value="">None</MenuItem><MenuItem value="daily">Daily</MenuItem><MenuItem value="every_3_days">Every 3 Days</MenuItem><MenuItem value="weekly">Weekly</MenuItem><MenuItem value="biweekly">Biweekly</MenuItem>
                </Select></FormControl>
              )} />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <Controller name="repeat_max_count" control={control} render={({ field }) => (
                <TextField fullWidth label="Max Repeats" type="number" value={field.value || ''} onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))} />
              )} />
            </Grid>
            <Grid size={{ xs: 12 }}><TextField fullWidth label="Message Template *" multiline rows={2} {...register('message_template')} error={!!errors.message_template} helperText={errors.message_template?.message} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit(onSubmit)} disabled={saving}>{saving ? 'Saving...' : 'Create Rule'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
