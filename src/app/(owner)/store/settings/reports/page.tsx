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
import ArrowBackOutlined from '@mui/icons-material/ArrowBackOutlined';
import AddOutlined from '@mui/icons-material/AddOutlined';
import DeleteOutlined from '@mui/icons-material/DeleteOutlined';
import { scheduledReportSchema, type ScheduledReportInput } from '@/lib/validations/settings';
import { createClient } from '@/lib/supabase/client';
import { useAppSelector } from '@/store/hooks';
import { debugLog } from '@/lib/debug-logger';

interface ScheduledReport { id: string; report_type: string; frequency: string; format: string; recipient_emails: string[]; is_active: boolean; next_send_at: string; }

export default function ScheduledReportsPage() {
  const currentStore = useAppSelector((s) => s.auth.currentStore);
  const [reports, setReports] = useState<ScheduledReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<ScheduledReportInput>({
    resolver: zodResolver(scheduledReportSchema) as any,
    defaultValues: { frequency: 'weekly', format: 'pdf', time_of_day: '08:00', is_active: true },
  });

  const fetchReports = async () => {
    if (!currentStore?.id) return;
    const supabase = createClient();
    const { data } = await supabase.from('scheduled_reports').select('*').eq('store_id', currentStore.id).eq('is_deleted', false);
    setReports((data as ScheduledReport[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchReports(); }, [currentStore?.id]);

  const onSubmit = async (data: ScheduledReportInput) => {
    if (!currentStore) return;
    setSaving(true); setError('');
    const supabase = createClient();

    const nextSend = new Date();
    nextSend.setDate(nextSend.getDate() + (data.frequency === 'weekly' ? 7 : 30));

    const { error: dbErr } = await supabase.from('scheduled_reports').insert({
      store_id: currentStore.id, report_type: data.report_type, frequency: data.frequency,
      format: data.format, recipient_emails: JSON.stringify(data.recipient_emails.split(',')),
      day_of_week: data.day_of_week, day_of_month: data.day_of_month,
      time_of_day: data.time_of_day, is_active: data.is_active,
      next_send_at: nextSend.toISOString(),
    });
    if (dbErr) { setError(dbErr.message); } else { setDialogOpen(false); reset(); fetchReports(); debugLog('settings', 'report_schedule_created', `Scheduled ${data.report_type} report`, 'success'); }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this scheduled report?')) return;
    const supabase = createClient();
    await supabase.from('scheduled_reports').update({ is_deleted: true }).eq('id', id);
    setReports((prev) => prev.filter((r) => r.id !== id));
  };

  if (loading) return <Typography>Loading...</Typography>;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <Button startIcon={<ArrowBackOutlined />} href="/store/settings">Back</Button>
        <Typography variant="h5" sx={{ flex: 1 }}>Scheduled Reports</Typography>
        <Button variant="contained" startIcon={<AddOutlined />} onClick={() => setDialogOpen(true)}>Add Schedule</Button>
      </Box>

      <Card>
        {reports.length === 0 ? (
          <CardContent><Typography color="text.secondary">No scheduled reports. Configure automatic email reports.</Typography></CardContent>
        ) : (
          <TableContainer><Table size="small"><TableHead><TableRow>
            <TableCell>Report</TableCell><TableCell>Frequency</TableCell><TableCell>Format</TableCell><TableCell>Active</TableCell><TableCell>Next Send</TableCell><TableCell>Actions</TableCell>
          </TableRow></TableHead><TableBody>
            {reports.map((r) => (
              <TableRow key={r.id}>
                <TableCell><Chip label={r.report_type} size="small" /></TableCell>
                <TableCell>{r.frequency}</TableCell>
                <TableCell>{r.format.toUpperCase()}</TableCell>
                <TableCell><Chip label={r.is_active ? 'Yes' : 'No'} size="small" color={r.is_active ? 'success' : 'default'} /></TableCell>
                <TableCell>{new Date(r.next_send_at).toLocaleDateString('en-IN')}</TableCell>
                <TableCell><IconButton size="small" color="error" onClick={() => handleDelete(r.id)}><DeleteOutlined fontSize="small" /></IconButton></TableCell>
              </TableRow>
            ))}
          </TableBody></Table></TableContainer>
        )}
      </Card>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Schedule Report</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 6 }}>
              <Controller name="report_type" control={control} render={({ field }) => (
                <FormControl fullWidth><InputLabel>Report Type</InputLabel><Select {...field} label="Report Type">
                  <MenuItem value="credit">Credit</MenuItem><MenuItem value="payment">Payment</MenuItem><MenuItem value="customer">Customer</MenuItem><MenuItem value="product">Product</MenuItem><MenuItem value="overdue">Overdue</MenuItem><MenuItem value="profit_loss">Profit/Loss</MenuItem><MenuItem value="inventory">Inventory</MenuItem>
                </Select></FormControl>
              )} />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <Controller name="frequency" control={control} render={({ field }) => (
                <FormControl fullWidth><InputLabel>Frequency</InputLabel><Select {...field} label="Frequency"><MenuItem value="weekly">Weekly</MenuItem><MenuItem value="monthly">Monthly</MenuItem></Select></FormControl>
              )} />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <Controller name="format" control={control} render={({ field }) => (
                <FormControl fullWidth><InputLabel>Format</InputLabel><Select {...field} label="Format"><MenuItem value="pdf">PDF</MenuItem><MenuItem value="csv">CSV</MenuItem><MenuItem value="excel">Excel</MenuItem></Select></FormControl>
              )} />
            </Grid>
            <Grid size={{ xs: 6 }}><TextField fullWidth label="Send Time" type="time" {...register('time_of_day')} slotProps={{ inputLabel: { shrink: true } }} /></Grid>
            <Grid size={{ xs: 12 }}><TextField fullWidth label="Recipient Emails (comma separated) *" {...register('recipient_emails')} error={!!errors.recipient_emails} helperText={errors.recipient_emails?.message} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit(onSubmit)} disabled={saving}>{saving ? 'Saving...' : 'Create'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
