'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TablePagination from '@mui/material/TablePagination';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import AddOutlined from '@mui/icons-material/AddOutlined';
import { createClient } from '@/lib/supabase/client';
import { useAppSelector } from '@/store/hooks';
import { debugLog } from '@/lib/debug-logger';

interface PaymentRow {
  id: string; customer_id: string; amount: number; method: string;
  status: string; reference_id: string | null; created_at: string;
  customer_name?: string;
}

const fmt = (n: number) => `₹${Number(n).toLocaleString('en-IN')}`;
const statusColor: Record<string, any> = { pending: 'warning', verified: 'success', rejected: 'error', disputed: 'info' };

export default function PaymentsPage() {
  const router = useRouter();
  const currentStore = useAppSelector((s) => s.auth.currentStore);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState(0);
  const [methodFilter, setMethodFilter] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(15);

  useEffect(() => {
    if (!currentStore?.id) return;
    const fetch = async () => {
      const supabase = createClient();
      debugLog('payments', 'page_load', 'Payments page loaded');

      const { data: payData, error } = await supabase
        .from('payments')
        .select('id, customer_id, amount, method, status, reference_id, created_at')
        .eq('store_id', currentStore.id)
        .order('created_at', { ascending: false });

      if (error) { debugLog('payments', 'fetch_error', error.message, 'error'); setLoading(false); return; }

      // Get customer names
      const customerIds = [...new Set((payData ?? []).map(p => p.customer_id))];
      let customerMap: Record<string, string> = {};
      if (customerIds.length > 0) {
        const { data: customers } = await supabase.from('customers').select('id, name').in('id', customerIds);
        (customers ?? []).forEach((c: any) => { customerMap[c.id] = c.name; });
      }

      const enriched = (payData ?? []).map(p => ({ ...p, customer_name: customerMap[p.customer_id] || 'Unknown' }));
      setPayments(enriched as PaymentRow[]);
      debugLog('payments', 'fetch_success', `${enriched.length} payments loaded`, 'success');
      setLoading(false);
    };
    fetch();
  }, [currentStore?.id]);

  const filtered = useMemo(() => {
    let result = payments;
    const statuses = ['', 'pending', 'verified', 'rejected', 'disputed'];
    if (tab > 0) result = result.filter(p => p.status === statuses[tab]);
    if (methodFilter) result = result.filter(p => p.method === methodFilter);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(p => (p.customer_name || '').toLowerCase().includes(q) || (p.reference_id || '').toLowerCase().includes(q));
    }
    return result;
  }, [payments, tab, methodFilter, search]);

  if (loading) return <Typography>Loading payments...</Typography>;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Payments ({payments.length})</Typography>
        <Button variant="contained" startIcon={<AddOutlined />} onClick={() => router.push('/store/payments/new')}>Record Payment</Button>
      </Box>

      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)}>
            <Tab label={`All (${payments.length})`} />
            <Tab label={`Pending (${payments.filter(p => p.status === 'pending').length})`} />
            <Tab label="Verified" />
            <Tab label="Rejected" />
          </Tabs>
        </Box>

        <Box sx={{ p: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField size="small" placeholder="Search customer or ref..." value={search} onChange={(e) => setSearch(e.target.value)}
            slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchOutlined fontSize="small" /></InputAdornment> } }}
            sx={{ width: 250 }} />
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Method</InputLabel>
            <Select value={methodFilter} onChange={(e) => setMethodFilter(e.target.value)} label="Method">
              <MenuItem value="">All</MenuItem>
              <MenuItem value="cash">Cash</MenuItem>
              <MenuItem value="upi">UPI</MenuItem>
              <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
              <MenuItem value="cheque">Cheque</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {filtered.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}><Typography color="text.secondary">{payments.length === 0 ? 'No payments yet.' : 'No payments match filters.'}</Typography></Box>
        ) : (
          <>
            <TableContainer>
              <Table size="small">
                <TableHead><TableRow>
                  <TableCell>Customer</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell>Method</TableCell>
                  <TableCell>Reference</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell align="center">Action</TableCell>
                </TableRow></TableHead>
                <TableBody>
                  {filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((p) => (
                    <TableRow key={p.id} hover>
                      <TableCell><Typography variant="body2" sx={{ fontWeight: 500 }}>{p.customer_name}</Typography></TableCell>
                      <TableCell align="right"><Typography variant="body2" sx={{ fontWeight: 600 }}>{fmt(p.amount)}</Typography></TableCell>
                      <TableCell><Chip label={p.method.replace('_', ' ')} size="small" variant="outlined" /></TableCell>
                      <TableCell>{p.reference_id || '—'}</TableCell>
                      <TableCell><Chip label={p.status} size="small" color={statusColor[p.status] || 'default'} /></TableCell>
                      <TableCell>{new Date(p.created_at).toLocaleDateString('en-IN')}</TableCell>
                      <TableCell align="center">
                        <IconButton size="small" onClick={() => router.push(`/store/payments/${p.id}`)}><VisibilityOutlined fontSize="small" /></IconButton>
                      </TableCell>
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
