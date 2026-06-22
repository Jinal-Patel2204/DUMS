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
import ArrowBackOutlined from '@mui/icons-material/ArrowBackOutlined';
import { createClient } from '@/lib/supabase/client';
import { format } from 'date-fns';
import type { BillStatus } from '@/types/database';

const formatCurrency = (n: number) => `₹${n.toLocaleString('en-IN')}`;

const statusColors: Record<BillStatus, 'default' | 'info' | 'success' | 'warning' | 'error'> = {
  draft: 'default',
  finalized: 'info',
  partially_paid: 'warning',
  paid: 'success',
  overdue: 'error',
  cancelled: 'default',
};

export default function BillDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [bill, setBill] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    const fetchBill = async () => {
      const supabase = createClient();
      
      // Fetch bill with customer and items
      const { data, error: fetchError } = await supabase
        .from('bills')
        .select(`
          *,
          customers(id, name, phone, email, current_balance, credit_limit),
          bill_items(*, products(name, unit))
        `)
        .eq('id', id)
        .eq('is_deleted', false)
        .single();

      if (fetchError) {
        setError(fetchError.message);
        setLoading(false);
        return;
      }

      // Fetch ledger entries separately (reference_id is not a direct FK)
      const { data: ledgerData } = await supabase
        .from('ledger_entries')
        .select('id, entry_type, debit_amount, credit_amount, balance_after, created_at')
        .eq('reference_id', id)
        .eq('reference_type', 'bill');

      setBill({ ...data, ledger_entries: ledgerData || [] });
      setLoading(false);
    };
    fetchBill();
  }, [id]);

  if (loading) {
    return (
      <Box>
        <Skeleton variant="rounded" height={40} sx={{ mb: 2, width: 200 }} />
        <Skeleton variant="rounded" height={200} sx={{ mb: 2 }} />
        <Skeleton variant="rounded" height={300} />
      </Box>
    );
  }

  if (error || !bill) {
    return (
      <Box>
        <Button startIcon={<ArrowBackOutlined />} onClick={() => router.back()} sx={{ mb: 2 }}>Back</Button>
        <Alert severity="error">{error || 'Bill not found'}</Alert>
      </Box>
    );
  }

  const customer = bill.customers;
  const items = bill.bill_items || [];
  const ledger = bill.ledger_entries || [];

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <Button startIcon={<ArrowBackOutlined />} onClick={() => router.back()}>Back</Button>
        <Typography variant="h5">Bill {bill.bill_number}</Typography>
        <Chip
          label={bill.status.replace('_', ' ')}
          color={statusColors[bill.status as BillStatus]}
          variant="outlined"
          sx={{ ml: 1 }}
        />
      </Box>

      {/* Bill Info + Customer Info */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>Bill Information</Typography>
              <Typography variant="body2">Bill Number: <strong>{bill.bill_number}</strong></Typography>
              <Typography variant="body2">Created: <strong>{format(new Date(bill.created_at), 'dd MMM yyyy, hh:mm a')}</strong></Typography>
              {bill.finalized_at && <Typography variant="body2">Finalized: <strong>{format(new Date(bill.finalized_at), 'dd MMM yyyy, hh:mm a')}</strong></Typography>}
              {bill.due_date && <Typography variant="body2">Due Date: <strong>{format(new Date(bill.due_date), 'dd MMM yyyy')}</strong></Typography>}
              {bill.notes && <Typography variant="body2" sx={{ mt: 1 }}>Notes: {bill.notes}</Typography>}
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>Customer</Typography>
              {customer ? (
                <>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>{customer.name}</Typography>
                  <Typography variant="body2">{customer.phone}</Typography>
                  {customer.email && <Typography variant="body2">{customer.email}</Typography>}
                  <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                    <Chip label={`Balance: ${formatCurrency(Number(customer.current_balance))}`} size="small" color={Number(customer.current_balance) > 0 ? 'error' : 'success'} variant="outlined" />
                    <Chip label={`Limit: ${formatCurrency(Number(customer.credit_limit))}`} size="small" variant="outlined" />
                  </Box>
                </>
              ) : (
                <Typography color="text.secondary">Customer info unavailable</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Items */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ pb: 0 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>Items</Typography>
        </CardContent>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>Product</TableCell>
                <TableCell align="center">Qty</TableCell>
                <TableCell align="right">Price</TableCell>
                <TableCell align="center">Disc %</TableCell>
                <TableCell align="right">Total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item: any, idx: number) => (
                <TableRow key={item.id}>
                  <TableCell>{idx + 1}</TableCell>
                  <TableCell>
                    <Typography variant="body2">{item.description}</Typography>
                    {item.products && <Typography variant="caption" color="text.secondary">{item.products.unit}</Typography>}
                  </TableCell>
                  <TableCell align="center">{Number(item.quantity)}</TableCell>
                  <TableCell align="right">{formatCurrency(Number(item.unit_price))}</TableCell>
                  <TableCell align="center">{Number(item.discount_percent)}%</TableCell>
                  <TableCell align="right">{formatCurrency(Number(item.total_price))}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <Divider />
        <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
          <Typography variant="body2">Subtotal: {formatCurrency(Number(bill.subtotal))}</Typography>
          <Typography variant="body2" color="error.main">Discount: -{formatCurrency(Number(bill.discount_amount))}</Typography>
          {Number(bill.tax_amount) > 0 && <Typography variant="body2">Tax: {formatCurrency(Number(bill.tax_amount))}</Typography>}
          <Typography variant="h6">Total: {formatCurrency(Number(bill.total_amount))}</Typography>
        </Box>
      </Card>

      {/* Ledger Reference */}
      {ledger.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>Ledger Entries</Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Type</TableCell>
                    <TableCell align="right">Debit</TableCell>
                    <TableCell align="right">Credit</TableCell>
                    <TableCell align="right">Balance After</TableCell>
                    <TableCell>Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {ledger.map((entry: any) => (
                    <TableRow key={entry.id}>
                      <TableCell>
                        <Chip label={entry.entry_type} size="small" color={entry.entry_type === 'debit' ? 'success' : 'error'} variant="outlined" />
                      </TableCell>
                      <TableCell align="right">{formatCurrency(Number(entry.debit_amount))}</TableCell>
                      <TableCell align="right">{formatCurrency(Number(entry.credit_amount))}</TableCell>
                      <TableCell align="right">{formatCurrency(Number(entry.balance_after))}</TableCell>
                      <TableCell>{format(new Date(entry.created_at), 'dd MMM yyyy')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
