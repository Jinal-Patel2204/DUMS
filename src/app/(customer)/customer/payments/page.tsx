'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TablePagination from '@mui/material/TablePagination';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import Alert from '@mui/material/Alert';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import AddOutlined from '@mui/icons-material/AddOutlined';
import { useCustomerAuth } from '@/hooks/useCustomerAuth';
import { createClient } from '@/lib/supabase/client';
import { format } from 'date-fns';

const formatCurrency = (n: number) => `₹${n.toLocaleString('en-IN')}`;
const statusColor: Record<string, 'warning' | 'success' | 'error' | 'info'> = { pending: 'warning', verified: 'success', rejected: 'error', disputed: 'info' };

export default function CustomerPaymentsPage() {
  const router = useRouter();
  const { customer, loading: authLoading } = useCustomerAuth();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(15);

  useEffect(() => {
    if (authLoading || !customer) return;
    const fetch = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('payments').select('*')
        .eq('customer_id', customer.customerId)
        .order('created_at', { ascending: false });
      setPayments(data || []);
      setLoading(false);
    };
    fetch();
  }, [authLoading, customer]);

  const statuses = ['', 'pending', 'verified', 'rejected'];
  const filtered = tab === 0 ? payments : payments.filter(p => p.status === statuses[tab]);

  if (authLoading || loading) return <Box><Typography variant="h5" sx={{ mb: 3 }}>My Payments</Typography>{[1,2,3].map(i => <Skeleton key={i} variant="rounded" height={50} sx={{ mb: 1 }} />)}</Box>;
  if (!customer) return <Alert severity="warning">No customer account linked.</Alert>;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">My Payments ({payments.length})</Typography>
        <Button variant="contained" startIcon={<AddOutlined />} onClick={() => router.push('/customer/payments/new')}>New Payment</Button>
      </Box>

      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)}>
            <Tab label={`All (${payments.length})`} />
            <Tab label="Pending" />
            <Tab label="Verified" />
            <Tab label="Rejected" />
          </Tabs>
        </Box>

        {filtered.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}><Typography color="text.secondary">No payments found.</Typography></Box>
        ) : (
          <>
            <TableContainer>
              <Table size="small">
                <TableHead><TableRow><TableCell>Date</TableCell><TableCell align="right">Amount</TableCell><TableCell>Method</TableCell><TableCell>Reference</TableCell><TableCell>Status</TableCell></TableRow></TableHead>
                <TableBody>
                  {filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((p) => (
                    <TableRow key={p.id} hover>
                      <TableCell>{format(new Date(p.created_at), 'dd MMM yyyy')}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>{formatCurrency(Number(p.amount))}</TableCell>
                      <TableCell><Chip label={p.method.replace('_', ' ')} size="small" variant="outlined" /></TableCell>
                      <TableCell>{p.reference_id || '—'}</TableCell>
                      <TableCell><Chip label={p.status} size="small" color={statusColor[p.status] || 'default'} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination component="div" count={filtered.length} page={page} onPageChange={(_, p) => setPage(p)} rowsPerPage={rowsPerPage} onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value)); setPage(0); }} />
          </>
        )}
      </Card>
    </Box>
  );
}
