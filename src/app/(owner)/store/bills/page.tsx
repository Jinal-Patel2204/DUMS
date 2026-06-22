'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
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
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Skeleton from '@mui/material/Skeleton';
import Alert from '@mui/material/Alert';
import AddOutlined from '@mui/icons-material/AddOutlined';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined';
import { createClient } from '@/lib/supabase/client';
import { useAppSelector } from '@/store/hooks';
import { format } from 'date-fns';
import type { Bill, BillStatus } from '@/types/database';

interface BillWithCustomer extends Bill {
  customers?: { name: string; phone: string };
}

const formatCurrency = (n: number) => `₹${n.toLocaleString('en-IN')}`;

const statusColors: Record<BillStatus, 'default' | 'info' | 'success' | 'warning' | 'error'> = {
  draft: 'default',
  finalized: 'info',
  partially_paid: 'warning',
  paid: 'success',
  overdue: 'error',
  cancelled: 'default',
};

export default function BillsPage() {
  const router = useRouter();
  const currentStore = useAppSelector((s) => s.auth.currentStore);
  const [bills, setBills] = useState<BillWithCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (!currentStore?.id) return;
    const fetchBills = async () => {
      setLoading(true);
      setError('');
      const supabase = createClient();

      let query = supabase
        .from('bills')
        .select('*, customers!inner(name, phone)', { count: 'exact' })
        .eq('store_id', currentStore.id)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error: fetchError, count } = await query;

      if (fetchError) {
        setError(fetchError.message);
        setLoading(false);
        return;
      }
      setBills((data as BillWithCustomer[]) || []);
      setTotal(count || 0);
      setLoading(false);
    };
    fetchBills();
  }, [currentStore?.id, statusFilter]);

  const filteredBills = useMemo(() => {
    if (!search) return bills;
    const q = search.toLowerCase();
    return bills.filter(
      (b) =>
        b.bill_number.toLowerCase().includes(q) ||
        b.customers?.name.toLowerCase().includes(q) ||
        b.customers?.phone.includes(q)
    );
  }, [bills, search]);

  if (loading) {
    return (
      <Box>
        <Typography variant="h5" sx={{ mb: 3 }}>Bills</Typography>
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} variant="rounded" height={50} sx={{ mb: 1 }} />
        ))}
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Bills ({total})</Typography>
        <Button variant="contained" startIcon={<AddOutlined />} onClick={() => router.push('/store/bills/new')}>
          Create Bill
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Card>
        <Box sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            size="small"
            placeholder="Search by bill number or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            slotProps={{
              input: {
                startAdornment: <InputAdornment position="start"><SearchOutlined fontSize="small" /></InputAdornment>,
              },
            }}
            sx={{ width: 320 }}
          />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select value={statusFilter} label="Status" onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}>
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="draft">Draft</MenuItem>
              <MenuItem value="finalized">Finalized</MenuItem>
              <MenuItem value="partially_paid">Partially Paid</MenuItem>
              <MenuItem value="paid">Paid</MenuItem>
              <MenuItem value="overdue">Overdue</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {filteredBills.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">
              {bills.length === 0 ? 'No bills yet. Create your first bill!' : 'No bills match your filters.'}
            </Typography>
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Bill #</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredBills.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((bill) => (
                    <TableRow key={bill.id} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>{bill.bill_number}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{bill.customers?.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{bill.customers?.phone}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography sx={{ fontWeight: 500 }}>{formatCurrency(Number(bill.total_amount))}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={bill.status.replace('_', ' ')}
                          size="small"
                          color={statusColors[bill.status]}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{format(new Date(bill.created_at), 'dd MMM yyyy')}</Typography>
                      </TableCell>
                      <TableCell align="center">
                        <IconButton size="small" onClick={() => router.push(`/store/bills/${bill.id}`)}>
                          <VisibilityOutlined fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              component="div"
              count={filteredBills.length}
              page={page}
              onPageChange={(_, p) => setPage(p)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value)); setPage(0); }}
            />
          </>
        )}
      </Card>
    </Box>
  );
}
