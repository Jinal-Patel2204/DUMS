'use client';

import { useState, useEffect, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Button from '@mui/material/Button';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Skeleton from '@mui/material/Skeleton';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import DownloadOutlined from '@mui/icons-material/DownloadOutlined';
import { createClient } from '@/lib/supabase/client';
import { useAppSelector } from '@/store/hooks';
import { format, subDays, startOfMonth } from 'date-fns';

const formatCurrency = (n: number) => `₹${n.toLocaleString('en-IN')}`;

type ReportType = 'outstanding' | 'ledger' | 'payment' | 'sales' | 'profit' | 'inventory' | 'overdue' | 'installment';

export default function ReportsPage() {
  const currentStore = useAppSelector((s) => s.auth.currentStore);
  const [reportType, setReportType] = useState<ReportType>('outstanding');
  const [dateFrom, setDateFrom] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [dateTo, setDateTo] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [customerFilter, setCustomerFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [customers, setCustomers] = useState<{ id: string; name: string }[]>([]);
  const [reportData, setReportData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generated, setGenerated] = useState(false);

  useEffect(() => {
    if (!currentStore?.id) return;
    const supabase = createClient();
    supabase.from('customers').select('id, name').eq('store_id', currentStore.id).eq('is_deleted', false).order('name').then(({ data }) => {
      setCustomers(data || []);
    });
  }, [currentStore?.id]);

  const generateReport = useCallback(async () => {
    if (!currentStore?.id) return;
    setLoading(true);
    setError('');
    setReportData([]);
    const supabase = createClient();
    const storeId = currentStore.id;

    try {
      switch (reportType) {
        case 'outstanding': {
          let query = supabase.from('customers').select('id, name, phone, current_balance, credit_limit')
            .eq('store_id', storeId).eq('is_deleted', false).gt('current_balance', 0).order('current_balance', { ascending: false });
          if (customerFilter !== 'all') query = query.eq('id', customerFilter);
          const { data } = await query;
          setReportData(data || []);
          break;
        }
        case 'ledger': {
          let query = supabase.from('ledger_entries').select('*, customers(name)')
            .eq('store_id', storeId).gte('entry_date', dateFrom).lte('entry_date', dateTo).order('created_at', { ascending: false });
          if (customerFilter !== 'all') query = query.eq('customer_id', customerFilter);
          const { data } = await query;
          setReportData(data || []);
          break;
        }
        case 'payment': {
          let query = supabase.from('payments').select('*, customers(name)')
            .eq('store_id', storeId).gte('created_at', `${dateFrom}T00:00:00`).lte('created_at', `${dateTo}T23:59:59`).order('created_at', { ascending: false });
          if (statusFilter !== 'all') query = query.eq('status', statusFilter);
          if (customerFilter !== 'all') query = query.eq('customer_id', customerFilter);
          const { data } = await query;
          setReportData(data || []);
          break;
        }
        case 'sales': {
          let query = supabase.from('bills').select('*, customers(name)')
            .eq('store_id', storeId).eq('is_deleted', false).neq('status', 'cancelled')
            .gte('created_at', `${dateFrom}T00:00:00`).lte('created_at', `${dateTo}T23:59:59`).order('created_at', { ascending: false });
          if (customerFilter !== 'all') query = query.eq('customer_id', customerFilter);
          const { data } = await query;
          setReportData(data || []);
          break;
        }
        case 'profit': {
          const { data: bills } = await supabase.from('bills').select('id, bill_number, total_amount, created_at, customers(name)')
            .eq('store_id', storeId).eq('is_deleted', false).neq('status', 'cancelled')
            .gte('created_at', `${dateFrom}T00:00:00`).lte('created_at', `${dateTo}T23:59:59`).order('created_at', { ascending: false });
          if (bills && bills.length > 0) {
            const { data: items } = await supabase.from('bill_items').select('bill_id, product_id, quantity, total_price').in('bill_id', bills.map(b => b.id));
            const prodIds = [...new Set((items || []).map(i => i.product_id).filter(Boolean))];
            const { data: prods } = await supabase.from('products').select('id, purchase_price').in('id', prodIds as string[]);
            const costMap = new Map(prods?.map(p => [p.id, Number(p.purchase_price)]) || []);
            const profitByBill = new Map<string, number>();
            items?.forEach(i => {
              const cost = (costMap.get(i.product_id!) || 0) * Number(i.quantity);
              profitByBill.set(i.bill_id, (profitByBill.get(i.bill_id) || 0) + (Number(i.total_price) - cost));
            });
            setReportData(bills.map(b => ({ ...b, profit: profitByBill.get(b.id) || 0 })));
          } else {
            setReportData([]);
          }
          break;
        }
        case 'inventory': {
          const { data } = await supabase.from('products').select('name, sku, stock_quantity, low_stock_threshold, selling_price, purchase_price, unit')
            .eq('store_id', storeId).eq('is_deleted', false).eq('is_active', true).order('stock_quantity');
          setReportData(data || []);
          break;
        }
        case 'overdue': {
          const { data } = await supabase.from('bills').select('*, customers(name, phone)')
            .eq('store_id', storeId).eq('is_deleted', false).eq('status', 'overdue').order('due_date');
          setReportData(data || []);
          break;
        }
        case 'installment': {
          const { data } = await supabase.from('installment_plans').select('*, customers(name)')
            .eq('store_id', storeId).eq('is_deleted', false).order('created_at', { ascending: false });
          if (statusFilter !== 'all') {
            setReportData((data || []).filter((d: any) => d.status === statusFilter));
          } else {
            setReportData(data || []);
          }
          break;
        }
      }
      setGenerated(true);
    } catch (err) {
      setError('Failed to generate report');
    } finally {
      setLoading(false);
    }
  }, [currentStore?.id, reportType, dateFrom, dateTo, customerFilter, statusFilter]);

  const exportCSV = () => {
    if (reportData.length === 0) return;
    const headers = Object.keys(reportData[0]).filter(k => k !== 'customers');
    const rows = reportData.map(row => headers.map(h => {
      const val = row[h];
      if (typeof val === 'object' && val !== null) return JSON.stringify(val);
      return val ?? '';
    }));
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportType}-report-${dateFrom}-to-${dateTo}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderTable = () => {
    if (loading) return <Skeleton variant="rounded" height={200} />;
    if (error) return <Alert severity="error">{error}</Alert>;
    if (!generated) return <Typography color="text.secondary" sx={{ p: 3, textAlign: 'center' }}>Select filters and click Generate Report</Typography>;
    if (reportData.length === 0) return <Alert severity="info">No data found for the selected filters.</Alert>;

    switch (reportType) {
      case 'outstanding':
        return (
          <TableContainer>
            <Table size="small">
              <TableHead><TableRow><TableCell>Customer</TableCell><TableCell>Phone</TableCell><TableCell align="right">Outstanding</TableCell><TableCell align="right">Credit Limit</TableCell></TableRow></TableHead>
              <TableBody>
                {reportData.map((r: any) => (
                  <TableRow key={r.id}><TableCell>{r.name}</TableCell><TableCell>{r.phone}</TableCell><TableCell align="right" sx={{ color: 'error.main', fontWeight: 500 }}>{formatCurrency(Number(r.current_balance))}</TableCell><TableCell align="right">{formatCurrency(Number(r.credit_limit))}</TableCell></TableRow>
                ))}
                <TableRow><TableCell colSpan={2} sx={{ fontWeight: 700 }}>Total</TableCell><TableCell align="right" sx={{ fontWeight: 700, color: 'error.main' }}>{formatCurrency(reportData.reduce((s, r) => s + Number(r.current_balance), 0))}</TableCell><TableCell /></TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        );
      case 'ledger':
        return (
          <TableContainer>
            <Table size="small">
              <TableHead><TableRow><TableCell>Date</TableCell><TableCell>Customer</TableCell><TableCell>Type</TableCell><TableCell>Description</TableCell><TableCell align="right">Debit</TableCell><TableCell align="right">Credit</TableCell><TableCell align="right">Balance</TableCell></TableRow></TableHead>
              <TableBody>
                {reportData.map((r: any) => (
                  <TableRow key={r.id}><TableCell>{format(new Date(r.entry_date), 'dd MMM yyyy')}</TableCell><TableCell>{r.customers?.name}</TableCell><TableCell><Chip label={r.entry_type} size="small" color={r.entry_type === 'debit' ? 'error' : 'success'} variant="outlined" /></TableCell><TableCell>{r.description}</TableCell><TableCell align="right">{formatCurrency(Number(r.debit_amount))}</TableCell><TableCell align="right">{formatCurrency(Number(r.credit_amount))}</TableCell><TableCell align="right">{formatCurrency(Number(r.balance_after))}</TableCell></TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        );
      case 'payment':
        return (
          <TableContainer>
            <Table size="small">
              <TableHead><TableRow><TableCell>Date</TableCell><TableCell>Customer</TableCell><TableCell align="right">Amount</TableCell><TableCell>Method</TableCell><TableCell>Status</TableCell></TableRow></TableHead>
              <TableBody>
                {reportData.map((r: any) => (
                  <TableRow key={r.id}><TableCell>{format(new Date(r.created_at), 'dd MMM yyyy')}</TableCell><TableCell>{r.customers?.name}</TableCell><TableCell align="right">{formatCurrency(Number(r.amount))}</TableCell><TableCell>{r.method}</TableCell><TableCell><Chip label={r.status} size="small" variant="outlined" /></TableCell></TableRow>
                ))}
                <TableRow><TableCell colSpan={2} sx={{ fontWeight: 700 }}>Total</TableCell><TableCell align="right" sx={{ fontWeight: 700 }}>{formatCurrency(reportData.reduce((s, r) => s + Number(r.amount), 0))}</TableCell><TableCell colSpan={2} /></TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        );
      case 'sales':
        return (
          <TableContainer>
            <Table size="small">
              <TableHead><TableRow><TableCell>Date</TableCell><TableCell>Bill #</TableCell><TableCell>Customer</TableCell><TableCell align="right">Subtotal</TableCell><TableCell align="right">Discount</TableCell><TableCell align="right">Total</TableCell><TableCell>Status</TableCell></TableRow></TableHead>
              <TableBody>
                {reportData.map((r: any) => (
                  <TableRow key={r.id}><TableCell>{format(new Date(r.created_at), 'dd MMM yyyy')}</TableCell><TableCell>{r.bill_number}</TableCell><TableCell>{r.customers?.name}</TableCell><TableCell align="right">{formatCurrency(Number(r.subtotal))}</TableCell><TableCell align="right">{formatCurrency(Number(r.discount_amount))}</TableCell><TableCell align="right" sx={{ fontWeight: 500 }}>{formatCurrency(Number(r.total_amount))}</TableCell><TableCell><Chip label={r.status} size="small" variant="outlined" /></TableCell></TableRow>
                ))}
                <TableRow><TableCell colSpan={5} sx={{ fontWeight: 700 }}>Total</TableCell><TableCell align="right" sx={{ fontWeight: 700 }}>{formatCurrency(reportData.reduce((s, r) => s + Number(r.total_amount), 0))}</TableCell><TableCell /></TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        );
      case 'profit':
        return (
          <TableContainer>
            <Table size="small">
              <TableHead><TableRow><TableCell>Date</TableCell><TableCell>Bill #</TableCell><TableCell>Customer</TableCell><TableCell align="right">Revenue</TableCell><TableCell align="right">Profit</TableCell></TableRow></TableHead>
              <TableBody>
                {reportData.map((r: any) => (
                  <TableRow key={r.id}><TableCell>{format(new Date(r.created_at), 'dd MMM yyyy')}</TableCell><TableCell>{r.bill_number}</TableCell><TableCell>{r.customers?.name}</TableCell><TableCell align="right">{formatCurrency(Number(r.total_amount))}</TableCell><TableCell align="right" sx={{ color: r.profit >= 0 ? 'success.main' : 'error.main', fontWeight: 500 }}>{formatCurrency(r.profit)}</TableCell></TableRow>
                ))}
                <TableRow><TableCell colSpan={3} sx={{ fontWeight: 700 }}>Total</TableCell><TableCell align="right" sx={{ fontWeight: 700 }}>{formatCurrency(reportData.reduce((s, r) => s + Number(r.total_amount), 0))}</TableCell><TableCell align="right" sx={{ fontWeight: 700 }}>{formatCurrency(reportData.reduce((s, r) => s + r.profit, 0))}</TableCell></TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        );
      case 'inventory':
        return (
          <TableContainer>
            <Table size="small">
              <TableHead><TableRow><TableCell>Code</TableCell><TableCell>Product</TableCell><TableCell>Unit</TableCell><TableCell align="right">Stock</TableCell><TableCell align="right">Threshold</TableCell><TableCell>Status</TableCell><TableCell align="right">Value</TableCell></TableRow></TableHead>
              <TableBody>
                {reportData.map((r: any, i: number) => (
                  <TableRow key={i}><TableCell>{r.sku}</TableCell><TableCell>{r.name}</TableCell><TableCell>{r.unit}</TableCell><TableCell align="right">{r.stock_quantity}</TableCell><TableCell align="right">{r.low_stock_threshold}</TableCell><TableCell><Chip label={r.stock_quantity <= r.low_stock_threshold ? 'Low' : 'OK'} size="small" color={r.stock_quantity <= r.low_stock_threshold ? 'error' : 'success'} variant="outlined" /></TableCell><TableCell align="right">{formatCurrency(r.stock_quantity * Number(r.selling_price))}</TableCell></TableRow>
                ))}
                <TableRow><TableCell colSpan={6} sx={{ fontWeight: 700 }}>Total Inventory Value</TableCell><TableCell align="right" sx={{ fontWeight: 700 }}>{formatCurrency(reportData.reduce((s, r) => s + r.stock_quantity * Number(r.selling_price), 0))}</TableCell></TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        );
      case 'overdue':
        return (
          <TableContainer>
            <Table size="small">
              <TableHead><TableRow><TableCell>Bill #</TableCell><TableCell>Customer</TableCell><TableCell>Phone</TableCell><TableCell>Due Date</TableCell><TableCell align="right">Amount</TableCell></TableRow></TableHead>
              <TableBody>
                {reportData.map((r: any) => (
                  <TableRow key={r.id}><TableCell>{r.bill_number}</TableCell><TableCell>{r.customers?.name}</TableCell><TableCell>{r.customers?.phone}</TableCell><TableCell>{r.due_date ? format(new Date(r.due_date), 'dd MMM yyyy') : '-'}</TableCell><TableCell align="right" sx={{ color: 'error.main', fontWeight: 500 }}>{formatCurrency(Number(r.total_amount))}</TableCell></TableRow>
                ))}
                <TableRow><TableCell colSpan={4} sx={{ fontWeight: 700 }}>Total Overdue</TableCell><TableCell align="right" sx={{ fontWeight: 700, color: 'error.main' }}>{formatCurrency(reportData.reduce((s, r) => s + Number(r.total_amount), 0))}</TableCell></TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        );
      case 'installment':
        return (
          <TableContainer>
            <Table size="small">
              <TableHead><TableRow><TableCell>Customer</TableCell><TableCell align="right">Total</TableCell><TableCell align="right">Paid</TableCell><TableCell align="right">Remaining</TableCell><TableCell>Frequency</TableCell><TableCell>Status</TableCell></TableRow></TableHead>
              <TableBody>
                {reportData.map((r: any) => (
                  <TableRow key={r.id}><TableCell>{r.customers?.name}</TableCell><TableCell align="right">{formatCurrency(Number(r.total_amount))}</TableCell><TableCell align="right">{formatCurrency(Number(r.total_paid))}</TableCell><TableCell align="right">{formatCurrency(Number(r.remaining_amount))}</TableCell><TableCell>{r.frequency}</TableCell><TableCell><Chip label={r.status} size="small" variant="outlined" /></TableCell></TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        );
      default:
        return null;
    }
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>Reports</Typography>

      {/* Report Type Tabs */}
      <Card sx={{ mb: 3 }}>
        <Tabs value={reportType} onChange={(_, v) => { setReportType(v); setGenerated(false); }} variant="scrollable" scrollButtons="auto">
          <Tab label="Outstanding" value="outstanding" />
          <Tab label="Ledger" value="ledger" />
          <Tab label="Payment" value="payment" />
          <Tab label="Sales" value="sales" />
          <Tab label="Profit" value="profit" />
          <Tab label="Inventory" value="inventory" />
          <Tab label="Overdue" value="overdue" />
          <Tab label="Installment" value="installment" />
        </Tabs>
      </Card>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            {reportType !== 'outstanding' && reportType !== 'inventory' && reportType !== 'overdue' && (
              <>
                <Grid size={{ xs: 12, sm: 3 }}>
                  <TextField fullWidth size="small" label="From" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
                </Grid>
                <Grid size={{ xs: 12, sm: 3 }}>
                  <TextField fullWidth size="small" label="To" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
                </Grid>
              </>
            )}
            {reportType !== 'inventory' && (
              <Grid size={{ xs: 12, sm: 3 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Customer</InputLabel>
                  <Select value={customerFilter} label="Customer" onChange={(e) => setCustomerFilter(e.target.value)}>
                    <MenuItem value="all">All Customers</MenuItem>
                    {customers.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
            )}
            {(reportType === 'payment' || reportType === 'installment') && (
              <Grid size={{ xs: 12, sm: 3 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select value={statusFilter} label="Status" onChange={(e) => setStatusFilter(e.target.value)}>
                    <MenuItem value="all">All</MenuItem>
                    {reportType === 'payment' && <>
                      <MenuItem value="pending">Pending</MenuItem>
                      <MenuItem value="verified">Verified</MenuItem>
                      <MenuItem value="rejected">Rejected</MenuItem>
                    </>}
                    {reportType === 'installment' && <>
                      <MenuItem value="active">Active</MenuItem>
                      <MenuItem value="completed">Completed</MenuItem>
                      <MenuItem value="overdue">Overdue</MenuItem>
                      <MenuItem value="defaulted">Defaulted</MenuItem>
                    </>}
                  </Select>
                </FormControl>
              </Grid>
            )}
            <Grid size={{ xs: 12, sm: 3 }}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button variant="contained" onClick={generateReport} disabled={loading}>
                  {loading ? 'Loading...' : 'Generate'}
                </Button>
                {reportData.length > 0 && (
                  <Button variant="outlined" startIcon={<DownloadOutlined />} onClick={exportCSV}>
                    CSV
                  </Button>
                )}
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Report Table */}
      <Card>
        {renderTable()}
      </Card>
    </Box>
  );
}
