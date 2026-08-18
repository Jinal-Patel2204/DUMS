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
import PeopleOutlined from '@mui/icons-material/PeopleOutlined';
import { useAppSelector } from '@/store/hooks';
import { useGetCustomersQuery, useDeleteCustomerMutation } from '@/store/api/customersApi';
import { PRICE_LEVELS } from '@/lib/validations/customer';
import { PageShell } from '@/components/layout/PageShell';
import { RowActions } from '@/components/data-display/RowActions';
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog';
import { exportToCSV, formatCurrencyExport } from '@/lib/export';

const formatCurrency = (n: number) => `₹${n.toLocaleString('en-IN')}`;

export default function CustomersPage() {
  const router = useRouter();
  const currentStore = useAppSelector((s) => s.auth.currentStore);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState(0);
  const [priceLevelFilter, setPriceLevelFilter] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<string | null>(null);

  const { data, isLoading, error } = useGetCustomersQuery(
    { storeId: currentStore?.id ?? '', page, pageSize: rowsPerPage, search: search || undefined },
    { skip: !currentStore?.id }
  );

  const [deleteCustomer] = useDeleteCustomerMutation();
  const customers = useMemo(() => data?.data ?? [], [data]);
  const totalCount = data?.total ?? 0;

  const filteredCustomers = useMemo(() => {
    let result = customers;
    if (tab === 1) result = result.filter((c) => c.isActive);
    if (tab === 2) result = result.filter((c) => !c.isActive);
    if (tab === 3) result = result.filter((c) => c.currentBalance > 0);
    if (priceLevelFilter) result = result.filter((c) => c.priceLevel === priceLevelFilter);
    return result;
  }, [customers, tab, priceLevelFilter]);

  const activeCount = useMemo(() => customers.filter(c => c.isActive).length, [customers]);
  const totalBalance = useMemo(() => customers.reduce((sum, c) => sum + c.currentBalance, 0), [customers]);
  const totalCreditLimit = useMemo(() => customers.reduce((sum, c) => sum + c.creditLimit, 0), [customers]);

  const handleDelete = (id: string) => { setCustomerToDelete(id); setDeleteDialogOpen(true); };
  const confirmDelete = async () => {
    if (customerToDelete) await deleteCustomer({ id: customerToDelete });
    setDeleteDialogOpen(false);
    setCustomerToDelete(null);
  };

  const handleExport = () => {
    exportToCSV(filteredCustomers.map(c => ({
      name: c.name, phone: c.phone, email: c.email || '',
      current_balance: c.currentBalance, credit_limit: c.creditLimit,
      price_level: c.priceLevel || 'retail', is_active: c.isActive,
    })), [
      { key: 'name', label: 'Name' },
      { key: 'phone', label: 'Phone' },
      { key: 'email', label: 'Email' },
      { key: 'current_balance', label: 'Balance', format: (v) => formatCurrencyExport(v) },
      { key: 'credit_limit', label: 'Credit Limit', format: (v) => formatCurrencyExport(v) },
      { key: 'price_level', label: 'Price Level' },
      { key: 'is_active', label: 'Status', format: (v) => v ? 'Active' : 'Inactive' },
    ], `customers-${new Date().toISOString().split('T')[0]}`);
  };

  return (
    <>
      <PageShell
        title="Customers"
        subtitle="Manage customers, credit limits, and price levels"
        isLoading={isLoading}
        error={error ? 'Failed to load customers. Make sure the backend is running.' : null}
        onExport={handleExport}
        actions={[{ label: 'Add Customer', icon: <AddOutlined />, onClick: () => router.push('/store/customers/new') }]}
        tabs={[
          { label: 'All', count: totalCount },
          { label: 'Active', count: activeCount },
          { label: 'Inactive' },
          { label: 'Has Balance' },
        ]}
        activeTab={tab}
        onTabChange={(v) => { setTab(v); setPage(0); }}
        stats={[
          { label: 'Total Customers', value: totalCount },
          { label: 'Outstanding', value: formatCurrency(totalBalance), color: 'error.main' },
          { label: 'Total Credit', value: formatCurrency(totalCreditLimit) },
        ]}
        searchPlaceholder="Search by name, phone, or email..."
        searchValue={search}
        onSearchChange={(v) => { setSearch(v); setPage(0); }}
        filters={
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Price Level</InputLabel>
            <Select value={priceLevelFilter} onChange={(e) => { setPriceLevelFilter(e.target.value); setPage(0); }} label="Price Level">
              <MenuItem value="">All Levels</MenuItem>
              {PRICE_LEVELS.map((level) => (
                <MenuItem key={level.value} value={level.value}>{level.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        }
        resultCount={filteredCustomers.length}
        isEmpty={filteredCustomers.length === 0}
        emptyIcon={<PeopleOutlined />}
        emptyTitle={totalCount === 0 ? 'No customers yet' : 'No customers match your filters'}
        emptyDescription={totalCount === 0 ? 'Add your first customer to get started.' : 'Try adjusting your search or filter.'}
        emptyAction={totalCount === 0 ? { label: 'Add Customer', onClick: () => router.push('/store/customers/new') } : undefined}
        totalCount={totalCount}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={(p) => setPage(p)}
        onRowsPerPageChange={(r) => { setRowsPerPage(r); setPage(0); }}
        rowsPerPageOptions={[15, 25, 50, 100]}
      >
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Customer</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell align="right">Balance</TableCell>
                <TableCell align="right">Credit Limit</TableCell>
                <TableCell>Price Level</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center" sx={{ width: 140 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredCustomers.map((customer) => (
                <TableRow key={customer.id} hover sx={{ cursor: 'pointer' }} onClick={() => router.push(`/store/customers/${customer.id}`)}>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>{customer.name}</Typography>
                    {customer.email && <Typography variant="caption" color="text.secondary">{customer.email}</Typography>}
                  </TableCell>
                  <TableCell><Typography variant="body2" color="text.secondary">{customer.phone}</Typography></TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" sx={{ fontWeight: 600, color: customer.currentBalance > 0 ? 'error.main' : 'success.main' }}>
                      {formatCurrency(customer.currentBalance)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right"><Typography variant="body2">{formatCurrency(customer.creditLimit)}</Typography></TableCell>
                  <TableCell>
                    <Chip
                      label={PRICE_LEVELS.find(l => l.value === customer.priceLevel)?.label || customer.priceLevel || 'Retail'}
                      size="small"
                      color={customer.priceLevel === 'vip' ? 'warning' : customer.priceLevel === 'wholesale' ? 'info' : customer.priceLevel === 'distributor' ? 'secondary' : 'default'}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip label={customer.isActive ? 'Active' : 'Inactive'} size="small" color={customer.isActive ? 'success' : 'default'} variant="filled" />
                  </TableCell>
                  <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                    <RowActions
                      onEdit={() => router.push(`/store/customers/${customer.id}?edit=true`)}
                      menuItems={[
                        { label: 'View Details', icon: <VisibilityOutlined sx={{ fontSize: 18 }} />, onClick: () => router.push(`/store/customers/${customer.id}`) },
                        { label: 'Delete', icon: <DeleteOutlined sx={{ fontSize: 18 }} />, onClick: () => handleDelete(customer.id), color: 'error', dividerBefore: true },
                      ]}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </PageShell>

      {/* Delete Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Customer"
        description="Are you sure you want to delete this customer? This action cannot be undone."
        confirmLabel="Delete"
        confirmColor="error"
      />
    </>
  );
}
