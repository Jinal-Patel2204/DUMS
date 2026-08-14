'use client';

import { useState, useMemo } from 'react';
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
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import AddOutlined from '@mui/icons-material/AddOutlined';
import PaymentsOutlined from '@mui/icons-material/PaymentsOutlined';
import FileDownloadOutlined from '@mui/icons-material/FileDownloadOutlined';
import DeleteOutlined from '@mui/icons-material/DeleteOutlined';
import CheckCircleOutlined from '@mui/icons-material/CheckCircleOutlined';
import CancelOutlined from '@mui/icons-material/CancelOutlined';
import { useAppSelector } from '@/store/hooks';
import { useGetPaymentsQuery, useDeletePaymentMutation, useUpdatePaymentStatusMutation } from '@/store/api/paymentsApi';
import { useGetCustomersQuery } from '@/store/api/customersApi';
import { format } from 'date-fns';
import { exportToCSV, formatCurrencyExport, formatDateExport } from '@/lib/export';

const fmt = (n: number) => `₹${Number(n).toLocaleString('en-IN')}`;
const statusColor: Record<string, 'warning' | 'success' | 'error' | 'info' | 'default'> = {
  pending: 'warning', verified: 'success', rejected: 'error', disputed: 'info',
};
const statusLabel: Record<string, string> = {
  pending: 'Pending', verified: 'Verified', rejected: 'Rejected', disputed: 'Disputed',
};

export default function PaymentsPage() {
  const router = useRouter();
  const currentStore = useAppSelector((s) => s.auth.currentStore);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState(0);
  const [methodFilter, setMethodFilter] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<string | null>(null);

  // ─── JAVA BACKEND CALLS via Redux Query ───────────────
  const { data: payments = [], isLoading, error } = useGetPaymentsQuery(
    { storeId: currentStore?.id ?? '' },
    { skip: !currentStore?.id }
  );

  const { data: customersData } = useGetCustomersQuery(
    { storeId: currentStore?.id ?? '' },
    { skip: !currentStore?.id }
  );
  // ─────────────────────────────────────────────────────

  const [deletePayment] = useDeletePaymentMutation();
  const [updatePaymentStatus] = useUpdatePaymentStatusMutation();

  // Build customer name map
  const customerMap = useMemo(() => {
    const map: Record<string, string> = {};
    (customersData?.data ?? []).forEach((c) => { map[c.id] = c.name; });
    return map;
  }, [customersData]);

  const filtered = useMemo(() => {
    let result = payments;
    const statuses = ['', 'pending', 'verified', 'rejected', 'disputed'];
    if (tab > 0) result = result.filter((p) => p.status === statuses[tab]);
    if (methodFilter) result = result.filter((p) => p.method === methodFilter);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((p) =>
        (customerMap[p.customerId] || '').toLowerCase().includes(q) ||
        (p.referenceId || '').toLowerCase().includes(q)
      );
    }
    return result;
  }, [payments, tab, methodFilter, search, customerMap]);

  const pendingCount = useMemo(() => payments.filter((p) => p.status === 'pending').length, [payments]);
  const verifiedCount = useMemo(() => payments.filter((p) => p.status === 'verified').length, [payments]);
  const rejectedCount = useMemo(() => payments.filter((p) => p.status === 'rejected').length, [payments]);

  const handleDelete = (paymentId: string) => {
    setPaymentToDelete(paymentId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (paymentToDelete) {
      await deletePayment({ id: paymentToDelete });
    }
    setDeleteDialogOpen(false);
    setPaymentToDelete(null);
  };

  const handleVerify = async (paymentId: string) => {
    await updatePaymentStatus({ id: paymentId, status: 'verified' });
  };

  const handleReject = async (paymentId: string) => {
    await updatePaymentStatus({ id: paymentId, status: 'rejected' });
  };

  if (isLoading) {
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

  if (error) {
    return (
      <Box>
        <Typography variant="h5" sx={{ mb: 2 }}>Payments</Typography>
        <Card sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="error">Failed to load payments. Make sure the backend is running.</Typography>
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
              exportToCSV(filtered.map((p) => ({
                customer_name: customerMap[p.customerId] || 'Unknown',
                amount: p.amount,
                method: p.method,
                reference_id: p.referenceId,
                status: p.status,
                created_at: p.createdAt,
              })), [
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
                  <TableCell align="center" sx={{ width: 160 }}>Actions</TableCell>
                </TableRow></TableHead>
                <TableBody>
                  {filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((p) => (
                    <TableRow key={p.id} hover sx={{ cursor: 'pointer' }} onClick={() => router.push(`/store/payments/${p.id}`)}>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>{customerMap[p.customerId] || 'Unknown'}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{fmt(p.amount)}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={p.method.replace('_', ' ')} size="small" variant="outlined" sx={{ textTransform: 'capitalize' }} />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'text.secondary' }}>
                          {p.referenceId || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={statusLabel[p.status] || p.status} size="small" color={statusColor[p.status] || 'default'} variant="filled" />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {p.createdAt ? format(new Date(p.createdAt), 'dd MMM yyyy') : '—'}
                        </Typography>
                      </TableCell>
                      <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                        {p.status === 'pending' && (
                          <>
                            <Tooltip title="Verify">
                              <IconButton size="small" color="success" onClick={() => handleVerify(p.id)}>
                                <CheckCircleOutlined sx={{ fontSize: 18 }} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Reject">
                              <IconButton size="small" color="error" onClick={() => handleReject(p.id)}>
                                <CancelOutlined sx={{ fontSize: 18 }} />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                        <Tooltip title="View details">
                          <IconButton size="small" onClick={() => router.push(`/store/payments/${p.id}`)}>
                            <VisibilityOutlined sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton size="small" color="error" onClick={() => handleDelete(p.id)}>
                            <DeleteOutlined sx={{ fontSize: 18 }} />
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Payment</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this payment? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
