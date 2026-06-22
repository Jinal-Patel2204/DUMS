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
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Tooltip from '@mui/material/Tooltip';
import { createClient } from '@/lib/supabase/client';
import { useAppSelector } from '@/store/hooks';

interface AuditEntry {
  id: string; user_id: string; user_role: string; action: string;
  entity_type: string; entity_id: string; changes: any;
  metadata: any; ip_address: string | null; created_at: string;
}

const actionColors: Record<string, any> = {
  create: 'success', update: 'info', delete: 'error', void: 'error',
  verify_payment: 'success', reject_payment: 'error',
  login: 'default', logout: 'default', settings_change: 'warning',
  generate_bill: 'info', cancel_bill: 'error',
};

export default function AuditLogsPage() {
  const currentStore = useAppSelector((s) => s.auth.currentStore);
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [moduleFilter, setModuleFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const fetchLogs = async () => {
    if (!currentStore?.id) return;
    setLoading(true);
    const supabase = createClient();
    let query = supabase
      .from('audit_logs')
      .select('*')
      .eq('store_id', currentStore.id)
      .order('created_at', { ascending: false })
      .limit(500);

    if (moduleFilter) query = query.eq('entity_type', moduleFilter);
    if (actionFilter) query = query.eq('action', actionFilter);
    if (dateFrom) query = query.gte('created_at', `${dateFrom}T00:00:00`);
    if (dateTo) query = query.lte('created_at', `${dateTo}T23:59:59`);

    const { data } = await query;
    setLogs((data as AuditEntry[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchLogs(); }, [currentStore?.id, moduleFilter, actionFilter, dateFrom, dateTo]);

  // Realtime subscription
  useEffect(() => {
    if (!currentStore?.id) return;
    const supabase = createClient();
    const channel = supabase
      .channel('audit-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'audit_logs', filter: `store_id=eq.${currentStore.id}` }, (payload) => {
        setLogs((prev) => [payload.new as AuditEntry, ...prev]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [currentStore?.id]);

  if (loading) return <Typography>Loading audit logs...</Typography>;

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>Audit Logs</Typography>

      <Card>
        <Box sx={{ p: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel>Module</InputLabel>
            <Select value={moduleFilter} onChange={(e) => setModuleFilter(e.target.value)} label="Module">
              <MenuItem value="">All</MenuItem>
              <MenuItem value="customer">Customer</MenuItem>
              <MenuItem value="product">Product</MenuItem>
              <MenuItem value="bill">Bill</MenuItem>
              <MenuItem value="payment">Payment</MenuItem>
              <MenuItem value="ledger_entry">Ledger</MenuItem>
              <MenuItem value="store">Store</MenuItem>
              <MenuItem value="user">User</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Action</InputLabel>
            <Select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} label="Action">
              <MenuItem value="">All</MenuItem>
              <MenuItem value="create">Create</MenuItem>
              <MenuItem value="update">Update</MenuItem>
              <MenuItem value="delete">Delete</MenuItem>
              <MenuItem value="verify_payment">Verify</MenuItem>
              <MenuItem value="reject_payment">Reject</MenuItem>
              <MenuItem value="generate_bill">Generate Bill</MenuItem>
              <MenuItem value="cancel_bill">Cancel Bill</MenuItem>
              <MenuItem value="login">Login</MenuItem>
              <MenuItem value="settings_change">Settings</MenuItem>
            </Select>
          </FormControl>
          <TextField size="small" type="date" label="From" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} sx={{ width: 150 }} />
          <TextField size="small" type="date" label="To" value={dateTo} onChange={(e) => setDateTo(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} sx={{ width: 150 }} />
          <Typography variant="body2" color="text.secondary" sx={{ alignSelf: 'center' }}>{logs.length} record(s)</Typography>
        </Box>

        {logs.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}><Typography color="text.secondary">No audit logs found.</Typography></Box>
        ) : (
          <>
            <TableContainer>
              <Table size="small">
                <TableHead><TableRow>
                  <TableCell>Date & Time</TableCell>
                  <TableCell>Module</TableCell>
                  <TableCell>Action</TableCell>
                  <TableCell>Entity ID</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Changes</TableCell>
                </TableRow></TableHead>
                <TableBody>
                  {logs.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((log) => (
                    <TableRow key={log.id}>
                      <TableCell><Typography variant="caption">{new Date(log.created_at).toLocaleString('en-IN')}</Typography></TableCell>
                      <TableCell><Chip label={log.entity_type} size="small" variant="outlined" /></TableCell>
                      <TableCell><Chip label={log.action.replace('_', ' ')} size="small" color={actionColors[log.action] || 'default'} /></TableCell>
                      <TableCell>
                        <Tooltip title={log.entity_id} arrow>
                          <Typography variant="caption" sx={{ fontFamily: 'monospace', cursor: 'pointer' }}>{log.entity_id.slice(0, 8)}...</Typography>
                        </Tooltip>
                      </TableCell>
                      <TableCell><Typography variant="caption">{log.user_role}</Typography></TableCell>
                      <TableCell>
                        {log.changes ? (
                          <Tooltip title={<pre style={{ margin: 0, fontSize: 11, maxWidth: 400, whiteSpace: 'pre-wrap' }}>{JSON.stringify(log.changes, null, 2)}</pre>} arrow>
                            <Typography variant="caption" sx={{ fontFamily: 'monospace', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', display: 'block', cursor: 'pointer' }}>
                              {JSON.stringify(log.changes).slice(0, 80)}
                            </Typography>
                          </Tooltip>
                        ) : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination component="div" count={logs.length} page={page} onPageChange={(_, p) => setPage(p)} rowsPerPage={rowsPerPage} onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value)); setPage(0); }} />
          </>
        )}
      </Card>
    </Box>
  );
}
