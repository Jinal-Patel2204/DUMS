'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import AddOutlined from '@mui/icons-material/AddOutlined';
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined';
import DeleteOutlined from '@mui/icons-material/DeleteOutlined';
import CheckCircleOutlined from '@mui/icons-material/CheckCircleOutlined';
import CancelOutlined from '@mui/icons-material/CancelOutlined';
import PaymentsOutlined from '@mui/icons-material/PaymentsOutlined';
import { useAppSelector } from '@/store/hooks';
import { useGetPaymentsQuery, useDeletePaymentMutation, useUpdatePaymentStatusMutation } from '@/store/api/paymentsApi';
import { useGetCustomersQuery } from '@/store/api/customersApi';
import { PageShell } from '@/components/layout/PageShell';
import { RowActions } from '@/components/data-display/RowActions';
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog';
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

  const { data: payments = [], isLoading, error } = useGetPaymentsQuery(
    { storeId: currentStore?.id ?? '' },
    { skip: !currentStore?.id }
  );
  const { data: customersData } = useGetCustomersQuery(
    { storeId: currentStore?.id ?? '' },
    { skip: !currentStore?.id }
  );

  const [deletePayment] = useDeletePaymentMutation();
  const [updatePaymentStatus] = useUpdatePaymentStatusMutation();

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
  const totalRevenue = useMemo(() => payments.reduce((sum, p) => sum + p.amount, 0), [payments]);

  const handleDelete = (id: string) => { setPaymentToDelete(id); setDeleteDialogOpen(true); };
  const confirmDelete = async () => {
    if (paymentToDelete) await deletePayment({ id: paymentToDelete });
    setDeleteDialogOpen(false);
    setPaymentToDelete(null);
  };
  const handleVerify = async (id: string) => { await updatePaymentStatus({ id, status: 'verified' }); };
  const handleReject = async (id: string) => { await updatePaymentStatus({ id, status: 'rejected' }); };

  const handleExport = () => {
    exportToCSV(filtered.map((p) => ({
      customer_name: customerMap[p.customerId] || 'Unknown',
      amount: p.amount, method: p.method, reference_id: p.referenceId,
      status: p.status, created_at: p.createdAt,
    })), [
      { key: 'customer_name', label: 'Customer' },
      { key: 'amount', label: 'Amount', format: (v) => formatCurrencyExport(v) },
      { key: 'method', label: 'Method' },
      { key: 'reference_id', label: 'Reference' },
      { key: 'status', label: 'Status' },
      { key: 'created_at', label: 'Date', format: (v) => formatDateExport(v) },
    ], `payments-${new Date().toISOString().split('T')[0]}`);
  };

  return (
    <>
      <PageShell
        title="Payments"
        subtitle="Track and verify customer payments"
        isLoading={isLoading}
        error={error ? 'Failed to load payments. Make sure the backend is running.' : null}
        onExport={handleExport}
        actions={[{ label: 'Record Payment', icon: <AddOutlined />, onClick: () => router.push('/store/payments/new') }]}
        tabs={[
          { label: 'All', count: payments.length },
          { label: 'Pending', count: pendingCount },
          { label: 'Verified', count: verifiedCount },
          { label: 'Rejected', count: rejectedCount },
        ]}
        activeTab={tab}
        onTabChange={(v) => { setTab(v); setPage(0); }}
        stats={[
          { label: 'Total Unverified', value: pendingCount },
          { label: 'Total Payments', value: payments.length },
          { label: 'Total Revenue', value: fmt(totalRevenue) },
        ]}
        searchPlaceholder="Search customer or reference..."
        searchValue={search}
        onSearchChange={(v) => { setSearch(v); setPage(0); }}
        filters={
          <>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Method</InputLabel>
              <Select value={methodFilter} onChange={(e) => { setMethodFilter(e.target.value); setPage(0); }} label="Method">
                <MenuItem value="">All Methods</MenuItem>
                <MenuItem value="cash">Cash</MenuItem>
                <MenuItem value="upi">UPI</MenuItem>
                <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
                <MenuItem value="cheque">Cheque</MenuItem>
              </Select>
            </FormControl>
          </>
        }
        resultCount={filtered.length}
        isEmpty={filtered.length === 0}
        emptyIcon={<PaymentsOutlined />}
        emptyTitle={payments.length === 0 ? 'No payments yet' : 'No payments match your filters'}
        emptyDescription={payments.length === 0 ? 'Record a payment to get started.' : 'Try adjusting your search or filter.'}
        totalCount={filtered.length}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={(p) => setPage(p)}
        onRowsPerPageChange={(r) => { setRowsPerPage(r); setPage(0); }}
        rowsPerPageOptions={[15, 25, 50]}
      >
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
                  <TableCell><Typography variant="body2" sx={{ fontWeight: 500 }}>{customerMap[p.customerId] || 'Unknown'}</Typography></TableCell>
                  <TableCell align="right"><Typography variant="body2" sx={{ fontWeight: 600 }}>{fmt(p.amount)}</Typography></TableCell>
                  <TableCell><Chip label={p.method.replace('_', ' ')} size="small" variant="outlined" sx={{ textTransform: 'capitalize' }} /></TableCell>
                  <TableCell><Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'text.secondary' }}>{p.referenceId || '—'}</Typography></TableCell>
                  <TableCell><Chip label={statusLabel[p.status] || p.status} size="small" color={statusColor[p.status] || 'default'} variant="filled" /></TableCell>
                  <TableCell><Typography variant="body2" color="text.secondary">{p.createdAt ? format(new Date(p.createdAt), 'dd MMM yyyy') : '—'}</Typography></TableCell>
                  <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                    <RowActions
                      onEdit={() => router.push(`/store/payments/${p.id}`)}
                      menuItems={[
                        { label: 'View Details', icon: <VisibilityOutlined sx={{ fontSize: 18 }} />, onClick: () => router.push(`/store/payments/${p.id}`) },
                        ...(p.status === 'pending' ? [
                          { label: 'Verify', icon: <CheckCircleOutlined sx={{ fontSize: 18 }} />, onClick: () => handleVerify(p.id) },
                          { label: 'Reject', icon: <CancelOutlined sx={{ fontSize: 18 }} />, onClick: () => handleReject(p.id) },
                        ] : []),
                        { label: 'Delete', icon: <DeleteOutlined sx={{ fontSize: 18 }} />, onClick: () => handleDelete(p.id), color: 'error' as const, dividerBefore: true },
                      ]}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </PageShell>

      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Payment"
        description="Are you sure you want to delete this payment? This action cannot be undone."
        confirmLabel="Delete"
        confirmColor="error"
      />
    </>
  );
}
