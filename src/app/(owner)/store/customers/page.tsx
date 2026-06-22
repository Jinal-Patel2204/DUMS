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
import Skeleton from '@mui/material/Skeleton';
import AddOutlined from '@mui/icons-material/AddOutlined';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined';
import EditOutlined from '@mui/icons-material/EditOutlined';
import { createClient } from '@/lib/supabase/client';
import { useAppSelector } from '@/store/hooks';
import { debugLog } from '@/lib/debug-logger';
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
      debugLog('customers', 'page_load', 'Customers page loaded');
      const supabase = createClient();
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('store_id', currentStore.id)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      if (error) {
        debugLog('customers', 'fetch_error', `Failed: ${error.message}`, 'error');
      } else {
        debugLog('customers', 'fetch_success', `Loaded ${data?.length ?? 0} customers`, 'success');
      }
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
      result = result.filter((c) => c.name.toLowerCase().includes(q) || c.phone.includes(q));
    }
    return result;
  }, [customers, search, tab]);

  if (loading) {
    return (
      <Box>
        <Typography variant="h5" sx={{ mb: 3 }}>Customers</Typography>
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} variant="rounded" height={50} sx={{ mb: 1 }} />
        ))}
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Customers ({customers.length})</Typography>
        <Button variant="contained" startIcon={<AddOutlined />} onClick={() => router.push('/store/customers/new')}>
          Add Customer
        </Button>
      </Box>

      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)}>
            <Tab label={`All (${customers.length})`} />
            <Tab label="Active" />
            <Tab label="Inactive" />
            <Tab label="Has Balance" />
          </Tabs>
        </Box>

        <Box sx={{ p: 2 }}>
          <TextField
            size="small"
            placeholder="Search by name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            slotProps={{
              input: {
                startAdornment: <InputAdornment position="start"><SearchOutlined fontSize="small" /></InputAdornment>,
              },
            }}
            sx={{ width: 300 }}
          />
        </Box>

        {filteredCustomers.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">
              {customers.length === 0 ? 'No customers yet. Add your first customer!' : 'No customers match your filters.'}
            </Typography>
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Phone</TableCell>
                    <TableCell align="right">Balance</TableCell>
                    <TableCell align="right">Credit Limit</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredCustomers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((customer) => (
                    <TableRow key={customer.id} hover>
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
                      <TableCell align="center">
                        <IconButton size="small" onClick={() => router.push(`/store/customers/${customer.id}`)}>
                          <VisibilityOutlined fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => router.push(`/store/customers/${customer.id}?edit=true`)}>
                          <EditOutlined fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              component="div"
              count={filteredCustomers.length}
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
