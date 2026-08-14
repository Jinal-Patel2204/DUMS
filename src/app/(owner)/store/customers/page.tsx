'use client';

import { useState, useMemo } from 'react';
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
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Tooltip from '@mui/material/Tooltip';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import AddOutlined from '@mui/icons-material/AddOutlined';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined';
import EditOutlined from '@mui/icons-material/EditOutlined';
import DeleteOutlined from '@mui/icons-material/DeleteOutlined';
import DownloadOutlined from '@mui/icons-material/DownloadOutlined';
import { useAppSelector } from '@/store/hooks';
import { useGetCustomersQuery, useDeleteCustomerMutation, type CustomerResponse } from '@/store/api/customersApi';
import { useTableSort } from '@/hooks/useTableSort';
import { SortableTableCell } from '@/components/data-display/SortableTableCell';
import { PageLoading } from '@/components/feedback/PageLoading';
import { EmptyState } from '@/components/feedback/EmptyState';
import { exportToCSV, formatCurrencyExport } from '@/lib/export';

const formatCurrency = (n: number) => `₹${n.toLocaleString('en-IN')}`;

export default function CustomersPage() {
  const router = useRouter();
  const currentStore = useAppSelector((s) => s.auth.currentStore);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // ─── JAVA BACKEND CALL via Redux Query ───────────────
  const { data, isLoading } = useGetCustomersQuery(
    {
      storeId: currentStore?.id ?? '',
      page,
      pageSize: rowsPerPage,
      search: search || undefined,
    },
    { skip: !currentStore?.id }
  );
  // ─────────────────────────────────────────────────────

  const [deleteCustomer] = useDeleteCustomerMutation();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<string | null>(null);
  const customers = data?.data ?? [];
  const totalCount = data?.total ?? 0;

  const handleDelete = (id: string) => {
    setCustomerToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (customerToDelete) {
      await deleteCustomer({ id: customerToDelete });
    }
    setDeleteDialogOpen(false);
    setCustomerToDelete(null);
  };

  const filteredCustomers = useMemo(() => {
    let result = customers;
    if (tab === 1) result = result.filter((c) => c.isActive);
    if (tab === 2) result = result.filter((c) => !c.isActive);
    if (tab === 3) result = result.filter((c) => c.currentBalance > 0);
    return result;
  }, [customers, tab]);

  const { sortedData, handleSort, getSortDirection } = useTableSort(filteredCustomers, 'name', 'asc');

  const handleExport = () => {
    exportToCSV(filteredCustomers.map(c => ({
      name: c.name,
      phone: c.phone,
      email: c.email || '',
      current_balance: c.currentBalance,
      credit_limit: c.creditLimit,
      is_active: c.isActive,
    })), [
      { key: 'name', label: 'Name' },
      { key: 'phone', label: 'Phone' },
      { key: 'email', label: 'Email' },
      { key: 'current_balance', label: 'Balance', format: (v) => formatCurrencyExport(v) },
      { key: 'credit_limit', label: 'Credit Limit', format: (v) => formatCurrencyExport(v) },
      { key: 'is_active', label: 'Status', format: (v) => v ? 'Active' : 'Inactive' },
    ], `customers-${new Date().toISOString().split('T')[0]}`);
  };

  if (isLoading) return <PageLoading title="Customers" />;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h5">Customers ({totalCount})</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {customers.length > 0 && (
            <Tooltip title="Export to CSV">
              <Button variant="outlined" startIcon={<DownloadOutlined />} onClick={handleExport} size="small">
                Export
              </Button>
            </Tooltip>
          )}
          <Button variant="contained" startIcon={<AddOutlined />} onClick={() => router.push('/store/customers/new')}>
            Add Customer
          </Button>
        </Box>
      </Box>

      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tab} onChange={(_, v) => { setTab(v); setPage(0); }}>
            <Tab label={`All (${totalCount})`} />
            <Tab label="Active" />
            <Tab label="Inactive" />
            <Tab label="Has Balance" />
          </Tabs>
        </Box>

        <Box sx={{ p: 2 }}>
          <TextField
            size="small"
            placeholder="Search by name, phone, or email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            slotProps={{
              input: {
                startAdornment: <InputAdornment position="start"><SearchOutlined fontSize="small" /></InputAdornment>,
              },
            }}
            sx={{ width: { xs: '100%', sm: 350 } }}
          />
        </Box>

        {sortedData.length === 0 ? (
          <EmptyState
            title={totalCount === 0 ? 'No customers yet' : 'No customers match your search'}
            description={totalCount === 0 ? 'Add your first customer to get started with credit management.' : 'Try adjusting your filters or search terms.'}
            actionLabel={totalCount === 0 ? 'Add Customer' : undefined}
            onAction={totalCount === 0 ? () => router.push('/store/customers/new') : undefined}
          />
        ) : (
          <>
            <TableContainer>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <SortableTableCell field="name" label="Name" sortDirection={getSortDirection('name')} onSort={handleSort} />
                    <TableCell>Phone</TableCell>
                    <SortableTableCell field="currentBalance" label="Balance" sortDirection={getSortDirection('currentBalance')} onSort={handleSort} align="right" />
                    <SortableTableCell field="creditLimit" label="Credit Limit" sortDirection={getSortDirection('creditLimit')} onSort={handleSort} align="right" />
                    <TableCell>Status</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sortedData.map((customer) => (
                    <TableRow key={customer.id} hover sx={{ cursor: 'pointer' }} onClick={() => router.push(`/store/customers/${customer.id}`)}>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>{customer.name}</Typography>
                        {customer.email && <Typography variant="caption" color="text.secondary">{customer.email}</Typography>}
                      </TableCell>
                      <TableCell>{customer.phone}</TableCell>
                      <TableCell align="right">
                        <Typography color={customer.currentBalance > 0 ? 'error.main' : 'success.main'} sx={{ fontWeight: 500 }}>
                          {formatCurrency(customer.currentBalance)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">{formatCurrency(customer.creditLimit)}</TableCell>
                      <TableCell>
                        <Chip
                          label={customer.isActive ? 'Active' : 'Inactive'}
                          size="small"
                          color={customer.isActive ? 'success' : 'default'}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                        <Tooltip title="View Details">
                          <IconButton size="small" onClick={() => router.push(`/store/customers/${customer.id}`)}>
                            <VisibilityOutlined fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => router.push(`/store/customers/${customer.id}?edit=true`)}>
                            <EditOutlined fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton size="small" color="error" onClick={() => handleDelete(customer.id)}>
                            <DeleteOutlined fontSize="small" />
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
              count={totalCount}
              page={page}
              onPageChange={(_, p) => setPage(p)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value)); setPage(0); }}
              rowsPerPageOptions={[10, 25, 50, 100]}
            />
          </>
        )}
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Customer</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this customer? This action cannot be undone.
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
