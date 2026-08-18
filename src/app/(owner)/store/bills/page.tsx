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
import ReceiptOutlined from '@mui/icons-material/ReceiptOutlined';
import { useAppSelector } from '@/store/hooks';
import { useGetBillsQuery, useDeleteBillMutation } from '@/store/api/billsApi';
import { PageShell } from '@/components/layout/PageShell';
import { RowActions } from '@/components/data-display/RowActions';
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog';
import { format } from 'date-fns';
import { exportToCSV, formatCurrencyExport, formatDateExport } from '@/lib/export';

const formatCurrency = (n: number) => `₹${n.toLocaleString('en-IN')}`;

const statusConfig: Record<string, { color: 'default' | 'info' | 'success' | 'warning' | 'error'; label: string }> = {
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
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [billToDelete, setBillToDelete] = useState<string | null>(null);

  const { data: bills = [], isLoading, error } = useGetBillsQuery(
    { storeId: currentStore?.id ?? '' },
    { skip: !currentStore?.id }
  );
  const [deleteBill] = useDeleteBillMutation();

  const filteredBills = useMemo(() => {
    let result = bills;
    if (statusFilter !== 'all') result = result.filter((b) => b.status === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((b) => b.billNumber.toLowerCase().includes(q));
    }
    return result;
  }, [bills, search, statusFilter]);

  const handleDelete = (id: string) => { setBillToDelete(id); setDeleteDialogOpen(true); };
  const confirmDelete = async () => {
    if (billToDelete) await deleteBill({ id: billToDelete });
    setDeleteDialogOpen(false);
    setBillToDelete(null);
  };

  const totalRevenue = useMemo(() => bills.reduce((sum, b) => sum + b.totalAmount, 0), [bills]);
  const paidCount = useMemo(() => bills.filter(b => b.status === 'paid').length, [bills]);
  const overdueCount = useMemo(() => bills.filter(b => b.status === 'overdue').length, [bills]);

  const handleExport = () => {
    exportToCSV(filteredBills.map(b => ({
      bill_number: b.billNumber, amount: b.totalAmount,
      status: b.status, due_date: b.dueDate, created_at: b.createdAt,
    })), [
      { key: 'bill_number', label: 'Bill Number' },
      { key: 'amount', label: 'Amount', format: (v) => formatCurrencyExport(v) },
      { key: 'status', label: 'Status' },
      { key: 'due_date', label: 'Due Date', format: (v) => formatDateExport(v) },
      { key: 'created_at', label: 'Created', format: (v) => formatDateExport(v) },
    ], `bills-${new Date().toISOString().split('T')[0]}`);
  };

  return (
    <>
      <PageShell
        title="Bills"
        subtitle="Manage invoices and track billing status"
        isLoading={isLoading}
        error={error ? 'Failed to load bills. Make sure the backend is running.' : null}
        onExport={handleExport}
        actions={[{ label: 'Create Bill', icon: <AddOutlined />, onClick: () => router.push('/store/bills/new') }]}
        stats={[
          { label: 'Total Bills', value: bills.length },
          { label: 'Paid', value: paidCount, color: 'success.main' },
          { label: 'Overdue', value: overdueCount, color: 'error.main' },
          { label: 'Total Revenue', value: formatCurrency(totalRevenue) },
        ]}
        searchPlaceholder="Search by bill number..."
        searchValue={search}
        onSearchChange={(v) => { setSearch(v); setPage(0); }}
        filters={
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
        }
        resultCount={filteredBills.length}
        isEmpty={filteredBills.length === 0}
        emptyIcon={<ReceiptOutlined />}
        emptyTitle={bills.length === 0 ? 'No bills yet' : 'No bills match your filters'}
        emptyDescription={bills.length === 0 ? 'Create your first bill to get started.' : 'Try adjusting your search or filter.'}
        emptyAction={bills.length === 0 ? { label: 'Create Bill', onClick: () => router.push('/store/bills/new') } : undefined}
        totalCount={filteredBills.length}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={(p) => setPage(p)}
        onRowsPerPageChange={(r) => { setRowsPerPage(r); setPage(0); }}
      >
        <TableContainer>
          <Table>
            <TableHead><TableRow>
              <TableCell>Bill Number</TableCell>
              <TableCell align="right">Amount</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Due Date</TableCell>
              <TableCell>Created</TableCell>
              <TableCell align="center" sx={{ width: 100 }}>Actions</TableCell>
            </TableRow></TableHead>
            <TableBody>
              {filteredBills.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((bill) => (
                <TableRow key={bill.id} hover sx={{ cursor: 'pointer' }} onClick={() => router.push(`/store/bills/${bill.id}`)}>
                  <TableCell><Typography variant="body2" sx={{ fontWeight: 600, fontFamily: 'monospace' }}>{bill.billNumber}</Typography></TableCell>
                  <TableCell align="right"><Typography variant="body2" sx={{ fontWeight: 600 }}>{formatCurrency(bill.totalAmount)}</Typography></TableCell>
                  <TableCell><Chip label={statusConfig[bill.status]?.label || bill.status} size="small" color={statusConfig[bill.status]?.color || 'default'} variant="filled" /></TableCell>
                  <TableCell><Typography variant="body2" color="text.secondary">{bill.dueDate ? format(new Date(bill.dueDate), 'dd MMM yyyy') : '—'}</Typography></TableCell>
                  <TableCell><Typography variant="body2" color="text.secondary">{bill.createdAt ? format(new Date(bill.createdAt), 'dd MMM yyyy') : '—'}</Typography></TableCell>
                  <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                    <RowActions
                      onEdit={() => router.push(`/store/bills/${bill.id}`)}
                      menuItems={[
                        { label: 'View Details', icon: <VisibilityOutlined sx={{ fontSize: 18 }} />, onClick: () => router.push(`/store/bills/${bill.id}`) },
                        { label: 'Delete', icon: <DeleteOutlined sx={{ fontSize: 18 }} />, onClick: () => handleDelete(bill.id), color: 'error', dividerBefore: true },
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
        title="Delete Bill"
        description="Are you sure you want to delete this bill? This action cannot be undone."
        confirmLabel="Delete"
        confirmColor="error"
      />
    </>
  );
}
