'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Divider from '@mui/material/Divider';
import Skeleton from '@mui/material/Skeleton';
import Alert from '@mui/material/Alert';
import { createClient } from '@/lib/supabase/client';
import { format } from 'date-fns';
import type { BillStatus } from '@/types/database';

const formatCurrency = (n: number) => `₹${n.toLocaleString('en-IN')}`;
const statusColors: Record<BillStatus, 'default' | 'info' | 'success' | 'warning' | 'error'> = {
  draft: 'default', finalized: 'info', partially_paid: 'warning', paid: 'success', overdue: 'error', cancelled: 'default',
};

export default function CustomerBillDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [bill, setBill] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    const fetch = async () => {
      const supabase = createClient();
      const { data, error: e } = await supabase
        .from('bills').select('*, bill_items(*, products(name, unit))')
        .eq('id', id).eq('is_deleted', false).single();
      if (e) { setError(e.message); setLoading(false); return; }
      setBill(data);

      // Payment history for this bill
      const { data: payData } = await supabase
        .from('payments').select('id, amount, method, status, created_at')
        .eq('bill_id', id).order('created_at', { ascending: false });
      setPayments(payData || []);
      setLoading(false);
    };
    fetch();
  }, [id]);

  if (loading) return <Box><Skeleton variant="rounded" height={40} sx={{ mb: 2, width: 200 }} /><Skeleton variant="rounded" height={300} /></Box>;
  if (error || !bill) return <Box><Alert severity="error" sx={{ mt: 2 }}>{error || 'Bill not found'}</Alert></Box>;

  const items = bill.bill_items || [];

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <Typography variant="h5">Bill {bill.bill_number}</Typography>
        <Chip label={bill.status.replace('_', ' ')} color={statusColors[bill.status as BillStatus]} variant="outlined" sx={{ ml: 1 }} />
      </Box>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card><CardContent>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>Bill Information</Typography>
            <Typography variant="body2">Bill Number: <strong>{bill.bill_number}</strong></Typography>
            <Typography variant="body2">Date: <strong>{format(new Date(bill.created_at), 'dd MMM yyyy')}</strong></Typography>
            {bill.due_date && <Typography variant="body2">Due: <strong>{format(new Date(bill.due_date), 'dd MMM yyyy')}</strong></Typography>}
            {bill.notes && <Typography variant="body2" sx={{ mt: 1 }}>Notes: {bill.notes}</Typography>}
          </CardContent></Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card><CardContent>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>Amount Summary</Typography>
            <Typography variant="body2">Subtotal: {formatCurrency(Number(bill.subtotal))}</Typography>
            <Typography variant="body2" color="error.main">Discount: -{formatCurrency(Number(bill.discount_amount))}</Typography>
            <Typography variant="h5" sx={{ mt: 1, fontWeight: 700 }}>Total: {formatCurrency(Number(bill.total_amount))}</Typography>
          </CardContent></Card>
        </Grid>
      </Grid>

      {/* Items */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ pb: 0 }}><Typography variant="subtitle2" color="text.secondary">Items</Typography></CardContent>
        <TableContainer>
          <Table size="small">
            <TableHead><TableRow><TableCell>#</TableCell><TableCell>Product</TableCell><TableCell align="center">Qty</TableCell><TableCell align="right">Price</TableCell><TableCell align="center">Disc%</TableCell><TableCell align="right">Total</TableCell></TableRow></TableHead>
            <TableBody>
              {items.map((item: any, idx: number) => (
                <TableRow key={item.id}><TableCell>{idx + 1}</TableCell><TableCell>{item.description}</TableCell><TableCell align="center">{Number(item.quantity)}</TableCell><TableCell align="right">{formatCurrency(Number(item.unit_price))}</TableCell><TableCell align="center">{Number(item.discount_percent)}%</TableCell><TableCell align="right">{formatCurrency(Number(item.total_price))}</TableCell></TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Payment History */}
      {payments.length > 0 && (
        <Card>
          <CardContent sx={{ pb: 0 }}><Typography variant="subtitle2" color="text.secondary">Payment History</Typography></CardContent>
          <TableContainer>
            <Table size="small">
              <TableHead><TableRow><TableCell>Date</TableCell><TableCell align="right">Amount</TableCell><TableCell>Method</TableCell><TableCell>Status</TableCell></TableRow></TableHead>
              <TableBody>
                {payments.map((p: any) => (
                  <TableRow key={p.id}><TableCell>{format(new Date(p.created_at), 'dd MMM yyyy')}</TableCell><TableCell align="right">{formatCurrency(Number(p.amount))}</TableCell><TableCell>{p.method}</TableCell><TableCell><Chip label={p.status} size="small" color={p.status === 'verified' ? 'success' : p.status === 'pending' ? 'warning' : 'error'} variant="outlined" /></TableCell></TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}
    </Box>
  );
}
