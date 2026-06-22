'use client';

import { useState, useEffect, useMemo } from 'react';
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
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Skeleton from '@mui/material/Skeleton';
import Alert from '@mui/material/Alert';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined';
import { useCustomerAuth } from '@/hooks/useCustomerAuth';
import { createClient } from '@/lib/supabase/client';
import { format } from 'date-fns';
import type { BillStatus } from '@/types/database';

const formatCurrency = (n: number) => `₹${n.toLocaleString('en-IN')}`;
const statusColors: Record<BillStatus, 'default' | 'info' | 'success' | 'warning' | 'error'> = {
  draft: 'default', finalized: 'info', partially_paid: 'warning', paid: 'success', overdue: 'error', cancelled: 'default',
};

export default function CustomerBillsPage() {
  const router = useRouter();
  const { customer, loading: authLoading } = useCustomerAuth();
  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    if (authLoading || !customer) return;
    const fetch = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('bills').select('*')
        .eq('customer_id', customer.customerId).eq('is_deleted', false)
        .order('created_at', { ascending: false });
      setBills(data || []);
      setLoading(false);
    };
    fetch();
  }, [authLoading, customer]);

  const filtered = useMemo(() => {
    let result = bills;
    if (statusFilter !== 'all') result = result.filter(b => b.status === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(b => b.bill_number.toLowerCase().includes(q));
    }
    return result;
  }, [bills, search, statusFilter]);

  if (authLoading || loading) return <Box><Typography variant="h5" sx={{ mb: 3 }}>My Bills</Typography>{[1,2,3].map(i => <Skeleton key={i} variant="rounded" height={50} sx={{ mb: 1 }} />)}</Box>;
  if (!customer) return <Alert severity="warning">No customer account linked.</Alert>;

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>My Bills ({bills.length})</Typography>
      <Card>
        <Box sx={{ p: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField size="small" placeholder="Search bill number..." value={search} onChange={(e) => setSearch(e.target.value)}
            slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchOutlined fontSize="small" /></InputAdornment> } }} sx={{ width: 250 }} />
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Status</InputLabel>
            <Select value={statusFilter} label="Status" onChange={(e) => setStatusFilter(e.target.value)}>
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="finalized">Finalized</MenuItem>
              <MenuItem value="partially_paid">Partially Paid</MenuItem>
              <MenuItem value="paid">Paid</MenuItem>
              <MenuItem value="overdue">Overdue</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {filtered.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}><Typography color="text.secondary">No bills found.</Typography></Box>
        ) : (
          <>
            <TableContainer>
              <Table size="small">
                <TableHead><TableRow>
                  <TableCell>Bill #</TableCell><TableCell>Date</TableCell><TableCell align="right">Amount</TableCell><TableCell>Status</TableCell><TableCell>Due Date</TableCell><TableCell align="center">Action</TableCell>
                </TableRow></TableHead>
                <TableBody>
                  {filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((bill) => (
                    <TableRow key={bill.id} hover>
                      <TableCell><Typography variant="body2" sx={{ fontWeight: 500 }}>{bill.bill_number}</Typography></TableCell>
                      <TableCell>{format(new Date(bill.created_at), 'dd MMM yyyy')}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 500 }}>{formatCurrency(Number(bill.total_amount))}</TableCell>
                      <TableCell><Chip label={bill.status.replace('_', ' ')} size="small" color={statusColors[bill.status as BillStatus]} variant="outlined" /></TableCell>
                      <TableCell>{bill.due_date ? format(new Date(bill.due_date), 'dd MMM yyyy') : '—'}</TableCell>
                      <TableCell align="center"><IconButton size="small" onClick={() => router.push(`/customer/bills/${bill.id}`)}><VisibilityOutlined fontSize="small" /></IconButton></TableCell>
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
