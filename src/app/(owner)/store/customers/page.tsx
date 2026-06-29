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
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Tooltip from '@mui/material/Tooltip';
import AddOutlined from '@mui/icons-material/AddOutlined';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined';
import EditOutlined from '@mui/icons-material/EditOutlined';
import DownloadOutlined from '@mui/icons-material/DownloadOutlined';
import { createClient } from '@/lib/supabase/client';
import { useAppSelector } from '@/store/hooks';
import { useTableSort } from '@/hooks/useTableSort';
import { SortableTableCell } from '@/components/data-display/SortableTableCell';
import { PageLoading } from '@/components/feedback/PageLoading';
import { EmptyState } from '@/components/feedback/EmptyState';
import { exportToCSV, formatCurrencyExport } from '@/lib/export';
import type { Customer } from '@/types/database';

const formatCurrency = (n: number) => `₹${n.toLocaleString('en-IN')}`;

export default function CustomersPage() {
  const router = useRouter();
  const currentStore = useAppSelector((s) => s.auth.currentStore);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    if (!currentStore?.id) return;
    const fetchCustomers = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('customers')
        .select('*')
        .eq('store_id', currentStore.id)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      setCustomers((data as Customer[]) ?? []);
      setLoading(false);
    };
    fetchCustomers();
  }, [currentStore?.id]);

  const filteredCustomers = useMemo(() => {
    let result = customers;
    if (tab === 1) result = result.filter((c) => c.is_active);
    if (tab === 2) result = result.filter((c) => !c.is_active);
    if (tab === 3) result = result.filter((c) => c.current_balance > 0);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((c) => c.name.toLowerCase().includes(q) || c.phone.includes(q) || c.email?.toLowerCase().includes(q));
    }
    return result;
  }, [customers, search, tab]);

  const { sortedData, handleSort, getSortDirection } = useTableSort(filteredCustomers, 'name', 'asc');

  const handleExport = () => {
    exportToCSV(filteredCustomers, [
      { key: 'name', label: 'Name' },
      { key: 'phone', label: 'Phone' },
      { key: 'email', label: 'Email' },
      { key: 'current_balance', label: 'Balance', format: (v) => formatCurrencyExport(v) },
      { key: 'credit_limit', label: 'Credit Limit', format: (v) => formatCurrencyExport(v) },
      { key: 'is_active', label: 'Status', format: (v) => v ? 'Active' : 'Inactive' },
    ], `customers-${new Date().toISOString().split('T')[0]}`);
  };

  if (loading) return <PageLoading title="Customers" />;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h5">Customers ({customers.length})</Typography>
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
            <Tab label={`All (${customers.length})`} />
            <Tab label={`Active (${customers.filter(c => c.is_active).length})`} />
            <Tab label={`Inactive (${customers.filter(c => !c.is_active).length})`} />
            <Tab label={`Has Balance (${customers.filter(c => c.current_balance > 0).length})`} />
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
            title={customers.length === 0 ? 'No customers yet' : 'No customers match your search'}
            description={customers.length === 0 ? 'Add your first customer to get started with credit management.' : 'Try adjusting your filters or search terms.'}
            actionLabel={customers.length === 0 ? 'Add Customer' : undefined}
            onAction={customers.length === 0 ? () => router.push('/store/customers/new') : undefined}
          />
        ) : (
          <>
            <TableContainer>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <SortableTableCell field="name" label="Name" sortDirection={getSortDirection('name')} onSort={handleSort} />
                    <TableCell>Phone</TableCell>
                    <SortableTableCell field="current_balance" label="Balance" sortDirection={getSortDirection('current_balance')} onSort={handleSort} align="right" />
                    <SortableTableCell field="credit_limit" label="Credit Limit" sortDirection={getSortDirection('credit_limit')} onSort={handleSort} align="right" />
                    <TableCell>Status</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sortedData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((customer) => (
                    <TableRow key={customer.id} hover sx={{ cursor: 'pointer' }} onClick={() => router.push(`/store/customers/${customer.id}`)}>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>{customer.name}</Typography>
                        {customer.email && <Typography variant="caption" color="text.secondary">{customer.email}</Typography>}
                      </TableCell>
                      <TableCell>{customer.phone}</TableCell>
                      <TableCell align="right">
                        <Typography color={Number(customer.current_balance) > 0 ? 'error.main' : 'success.main'} sx={{ fontWeight: 500 }}>
                          {formatCurrency(Number(customer.current_balance))}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">{formatCurrency(Number(customer.credit_limit))}</TableCell>
                      <TableCell>
                        <Chip
                          label={customer.is_active ? 'Active' : 'Inactive'}
                          size="small"
                          color={customer.is_active ? 'success' : 'default'}
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
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              component="div"
              count={sortedData.length}
              page={page}
              onPageChange={(_, p) => setPage(p)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value)); setPage(0); }}
              rowsPerPageOptions={[10, 25, 50, 100]}
            />
          </>
        )}
      </Card>
    </Box>
  );
}
