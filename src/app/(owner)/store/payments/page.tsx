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
import Skeleton from '@mui/material/Skeleton';
import Tooltip from '@mui/material/Tooltip';
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import AddOutlined from '@mui/icons-material/AddOutlined';
import PaymentsOutlined from '@mui/icons-material/PaymentsOutlined';
import FileDownloadOutlined from '@mui/icons-material/FileDownloadOutlined';
import { createClient } from '@/lib/supabase/client';
import { useAppSelector } from '@/store/hooks';
import { debugLog } from '@/lib/debug-logger';
import { format } from 'date-fns';
import { exportToCSV, formatCurrencyExport, formatDateExport } from '@/lib/export';

interface PaymentRow {
  id: string; customer_id: string; amount: number; method: string;
  status: string; reference_id: string | null; created_at: string;
  customer_name?: string;
}

const fmt = (n: number) => `₹${Number(n).toLocaleString('en-IN')}`;
const statusColor: Record<string, 'warning' | 'success' | 'error' | 'info' | 'default'> = { 
  pending: 'warning', verified: 'success', rejected: 'error', disputed: 'info' 
};
const statusLabel: Record<string, string> = {
  pending: 'Pending', verified: 'Verified', rejected: 'Rejected', disputed: 'Disputed',
};

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

  const pendingCount = useMemo(() => payments.filter(p => p.status === 'pending').length, [payments]);
  const verifiedCount = useMemo(() => payments.filter(p => p.status === 'verified').length, [payments]);
  const rejectedCount = useMemo(() => payments.filter(p => p.status === 'rejected').length, [payments]);

  if (loading) {
    return (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Skeleton variant="text" width={160} height={32} />
          <Skeleton variant="rounded" width={150} height={36} />
        </Box>
        <Card>
          <Box sx={{ p: 2 }}><Skeleton variant="rounded" width={300} height={36} /></Box>
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} variant="rounded" height={48} sx={{ mx: 2, mb: 1 }} />
          ))}
        </Card>
      </Box>
    );
  }

  return (
    <Box>
      {/* Page Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Payments</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
            Track and verify customer payments
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Export payments">
            <Button variant="outlined" size="small" startIcon={<FileDownloadOutlined />} sx={{ borderColor: 'divider', color: 'text.secondary' }} onClick={() => {
              exportToCSV(filtered, [
                { key: 'customer_name', label: 'Customer' },
                { key: 'amount', label: 'Amount', format: (v) => formatCurrencyExport(v) },
                { key: 'method', label: 'Method' },
                { key: 'reference_id', label: 'Reference' },
                { key: 'status', label: 'Status' },
                { key: 'created_at', label: 'Date', format: (v) => formatDateExport(v) },
              ], `payments-${new Date().toISOString().split('T')[0]}`);
            }}>
              Export
            </Button>
          </Tooltip>
          <Button variant="contained" size="small" startIcon={<AddOutlined />} onClick={() => router.push('/store/payments/new')}>
            Record Payment
          </Button>
        </Box>
      </Box>

      <Card>
        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 1 }}>
          <Tabs value={tab} onChange={(_, v) => { setTab(v); setPage(0); }}>
            <Tab label={`All (${payments.length})`} />
            <Tab label={`Pending (${pendingCount})`} />
            <Tab label={`Verified (${verifiedCount})`} />
            <Tab label={`Rejected (${rejectedCount})`} />
          </Tabs>
        </Box>

        {/* Filters */}
        <Box sx={{ p: 2, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            placeholder="Search customer or reference..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchOutlined sx={{ fontSize: 18, color: 'text.secondary' }} /></InputAdornment> } }}
            sx={{ width: 280 }}
          />
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Method</InputLabel>
            <Select value={methodFilter} onChange={(e) => { setMethodFilter(e.target.value); setPage(0); }} label="Method">
              <MenuItem value="">All Methods</MenuItem>
              <MenuItem value="cash">Cash</MenuItem>
              <MenuItem value="upi">UPI</MenuItem>
              <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
              <MenuItem value="cheque">Cheque</MenuItem>
            </Select>
          </FormControl>
          <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
            {filtered.length} result{filtered.length !== 1 ? 's' : ''}
          </Typography>
        </Box>

        {/* Table */}
        {filtered.length === 0 ? (
          <Box sx={{ py: 8, textAlign: 'center' }}>
            <PaymentsOutlined sx={{ fontSize: 48, color: 'text.disabled', mb: 1.5 }} />
            <Typography variant="subtitle1" color="text.secondary" sx={{ fontWeight: 500 }}>
              {payments.length === 0 ? 'No payments yet' : 'No payments match your filters'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
              {payments.length === 0 ? 'Record a payment to get started.' : 'Try adjusting your search or filter.'}
            </Typography>
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead><TableRow>
                  <TableCell>Customer</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell>Method</TableCell>
                  <TableCell>Reference</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell align="center" sx={{ width: 80 }}>Actions</TableCell>
                </TableRow></TableHead>
                <TableBody>
                  {filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((p) => (
                    <TableRow key={p.id} hover sx={{ cursor: 'pointer' }} onClick={() => router.push(`/store/payments/${p.id}`)}>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>{p.customer_name}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{fmt(p.amount)}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={p.method.replace('_', ' ')} size="small" variant="outlined" sx={{ textTransform: 'capitalize' }} />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'text.secondary' }}>
                          {p.reference_id || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={statusLabel[p.status] || p.status} size="small" color={statusColor[p.status] || 'default'} variant="filled" />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {format(new Date(p.created_at), 'dd MMM yyyy')}
                        </Typography>
                      </TableCell>
                      <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                        <Tooltip title="View details">
                          <IconButton size="small" onClick={() => router.push(`/store/payments/${p.id}`)}>
                            <VisibilityOutlined sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={filtered.length}
              page={page}
              onPageChange={(_, p) => setPage(p)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value)); setPage(0); }}
              rowsPerPageOptions={[15, 25, 50]}
            />
          </>
        )}
      </Card>
    </Box>
  );
}
