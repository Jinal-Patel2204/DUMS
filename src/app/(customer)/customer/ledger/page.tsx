'use client';

import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TablePagination from '@mui/material/TablePagination';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import Alert from '@mui/material/Alert';
import DownloadOutlined from '@mui/icons-material/DownloadOutlined';
import { useCustomerAuth } from '@/hooks/useCustomerAuth';
import { createClient } from '@/lib/supabase/client';
import { format } from 'date-fns';

const formatCurrency = (n: number) => `₹${n.toLocaleString('en-IN')}`;

export default function CustomerLedgerPage() {
  const { customer, loading: authLoading } = useCustomerAuth();
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  useEffect(() => {
    if (authLoading || !customer) return;
    const fetch = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('ledger_entries').select('*')
        .eq('customer_id', customer.customerId)
        .order('created_at', { ascending: false });
      setEntries(data || []);
      setLoading(false);
    };
    fetch();
  }, [authLoading, customer]);

  const exportCSV = () => {
    if (entries.length === 0) return;
    const headers = ['Date', 'Description', 'Debit', 'Credit', 'Balance'];
    const rows = entries.map(e => [
      format(new Date(e.entry_date), 'dd/MM/yyyy'),
      e.description,
      Number(e.debit_amount),
      Number(e.credit_amount),
      Number(e.balance_after),
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `ledger-${format(new Date(), 'yyyy-MM-dd')}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  if (authLoading || loading) return <Box><Typography variant="h5" sx={{ mb: 3 }}>My Ledger</Typography>{[1,2,3].map(i => <Skeleton key={i} variant="rounded" height={50} sx={{ mb: 1 }} />)}</Box>;
  if (!customer) return <Alert severity="warning">No customer account linked.</Alert>;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">My Ledger</Typography>
        {entries.length > 0 && (
          <Button variant="outlined" startIcon={<DownloadOutlined />} onClick={exportCSV}>Export CSV</Button>
        )}
      </Box>

      <Card>
        {entries.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}><Typography color="text.secondary">No ledger entries yet.</Typography></Box>
        ) : (
          <>
            <TableContainer>
              <Table size="small">
                <TableHead><TableRow>
                  <TableCell>Date</TableCell><TableCell>Description</TableCell><TableCell>Type</TableCell><TableCell align="right">Debit</TableCell><TableCell align="right">Credit</TableCell><TableCell align="right">Balance</TableCell>
                </TableRow></TableHead>
                <TableBody>
                  {entries.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((e) => (
                    <TableRow key={e.id}>
                      <TableCell>{format(new Date(e.entry_date), 'dd MMM yyyy')}</TableCell>
                      <TableCell>{e.description}</TableCell>
                      <TableCell><Chip label={e.entry_type} size="small" color={e.entry_type === 'debit' ? 'success' : 'error'} variant="outlined" /></TableCell>
                      <TableCell align="right">{formatCurrency(Number(e.debit_amount))}</TableCell>
                      <TableCell align="right">{formatCurrency(Number(e.credit_amount))}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 500 }}>{formatCurrency(Number(e.balance_after))}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination component="div" count={entries.length} page={page} onPageChange={(_, p) => setPage(p)} rowsPerPage={rowsPerPage} onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value)); setPage(0); }} />
          </>
        )}
      </Card>
    </Box>
  );
}
