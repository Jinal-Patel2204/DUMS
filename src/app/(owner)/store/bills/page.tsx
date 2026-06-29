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
import Tooltip from '@mui/material/Tooltip';
import AddOutlined from '@mui/icons-material/AddOutlined';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined';
import ReceiptOutlined from '@mui/icons-material/ReceiptOutlined';
import FileDownloadOutlined from '@mui/icons-material/FileDownloadOutlined';
import { createClient } from '@/lib/supabase/client';
import { useAppSelector } from '@/store/hooks';
import { format } from 'date-fns';
import { exportToCSV, formatCurrencyExport, formatDateExport } from '@/lib/export';
import type { Bill, BillStatus } from '@/types/database';

interface BillWithCustomer extends Bill {
  customers?: { name: string; phone: string };
}

const formatCurrency = (n: number) => `₹${n.toLocaleString('en-IN')}`;

const statusConfig: Record<BillStatus, { color: 'default' | 'info' | 'success' | 'warning' | 'error'; label: string }> = {
  draft: { color: 'default', label: 'Draft' },
  finalized: { color: 'info', label: 'Finalized' },
  partially_paid: { color: 'warning', label: 'Partial' },
  paid: { color: 'success', label: 'Paid' },
  overdue: { color: 'error', label: 'Overdue' },
  cancelled: { color: 'default', label: 'Cancelled' },
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Skeleton variant="text" width={140} height={32} />
          <Skeleton variant="rounded" width={130} height={36} />
        </Box>
        <Card>
          <Box sx={{ p: 2 }}><Skeleton variant="rounded" width={320} height={36} /></Box>
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} variant="rounded" height={52} sx={{ mx: 2, mb: 1 }} />
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
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Bills</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
            Manage invoices and track billing status
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Export bills">
            <Button variant="outlined" size="small" startIcon={<FileDownloadOutlined />} sx={{ borderColor: 'divider', color: 'text.secondary' }} onClick={() => {
              exportToCSV(filteredBills, [
                { key: 'bill_number', label: 'Bill Number' },
                { key: 'customers', label: 'Customer', format: (v) => v?.name || '' },
                { key: 'total_amount', label: 'Amount', format: (v) => formatCurrencyExport(v) },
                { key: 'status', label: 'Status' },
                { key: 'created_at', label: 'Date', format: (v) => formatDateExport(v) },
              ], `bills-${new Date().toISOString().split('T')[0]}`);
            }}>
              Export
            </Button>
          </Tooltip>
          <Button variant="contained" size="small" startIcon={<AddOutlined />} onClick={() => router.push('/store/bills/new')}>
            Create Bill
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Card>
        {/* Filters Bar */}
        <Box sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', borderBottom: 1, borderColor: 'divider' }}>
          <TextField
            placeholder="Search by bill number or customer..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            slotProps={{
              input: {
                startAdornment: <InputAdornment position="start"><SearchOutlined sx={{ fontSize: 18, color: 'text.secondary' }} /></InputAdornment>,
              },
            }}
            sx={{ width: 320 }}
          />
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Status</InputLabel>
            <Select value={statusFilter} label="Status" onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}>
              <MenuItem value="all">All Statuses</MenuItem>
              <MenuItem value="draft">Draft</MenuItem>
              <MenuItem value="finalized">Finalized</MenuItem>
              <MenuItem value="partially_paid">Partially Paid</MenuItem>
              <MenuItem value="paid">Paid</MenuItem>
              <MenuItem value="overdue">Overdue</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
            </Select>
          </FormControl>
          <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
            {filteredBills.length} of {total} bill{total !== 1 ? 's' : ''}
          </Typography>
        </Box>

        {/* Table */}
        {filteredBills.length === 0 ? (
          <Box sx={{ py: 8, textAlign: 'center' }}>
            <ReceiptOutlined sx={{ fontSize: 48, color: 'text.disabled', mb: 1.5 }} />
            <Typography variant="subtitle1" color="text.secondary" sx={{ fontWeight: 500 }}>
              {bills.length === 0 ? 'No bills yet' : 'No bills match your filters'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
              {bills.length === 0 ? 'Create your first bill to get started.' : 'Try adjusting your search or filter.'}
            </Typography>
            {bills.length === 0 && (
              <Button variant="contained" size="small" startIcon={<AddOutlined />} onClick={() => router.push('/store/bills/new')}>
                Create Bill
              </Button>
            )}
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Bill Number</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell align="center" sx={{ width: 80 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredBills.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((bill) => (
                    <TableRow key={bill.id} hover sx={{ cursor: 'pointer' }} onClick={() => router.push(`/store/bills/${bill.id}`)}>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: 'monospace', fontSize: '0.8125rem' }}>
                          {bill.bill_number}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>{bill.customers?.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{bill.customers?.phone}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatCurrency(Number(bill.total_amount))}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={statusConfig[bill.status].label}
                          size="small"
                          color={statusConfig[bill.status].color}
                          variant="filled"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">{format(new Date(bill.created_at), 'dd MMM yyyy')}</Typography>
                      </TableCell>
                      <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                        <Tooltip title="View bill">
                          <IconButton size="small" onClick={() => router.push(`/store/bills/${bill.id}`)}>
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
              count={filteredBills.length}
              page={page}
              onPageChange={(_, p) => setPage(p)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value)); setPage(0); }}
              rowsPerPageOptions={[10, 25, 50]}
            />
          </>
        )}
      </Card>
    </Box>
  );
}
