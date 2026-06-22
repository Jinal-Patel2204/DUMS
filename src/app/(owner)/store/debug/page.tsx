'use client';

import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Chip from '@mui/material/Chip';
import DownloadOutlined from '@mui/icons-material/DownloadOutlined';
import DeleteOutlined from '@mui/icons-material/DeleteOutlined';
import RefreshOutlined from '@mui/icons-material/RefreshOutlined';
import { createClient } from '@/lib/supabase/client';

interface DebugLogEntry {
  id: string;
  user_id: string | null;
  page: string;
  action: string;
  level: string;
  message: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export default function DebugPage() {
  const [logs, setLogs] = useState<DebugLogEntry[]>([]);
  const [dateFilter, setDateFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    const supabase = createClient();
    let query = supabase
      .from('debug_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);

    if (dateFilter) {
      query = query.gte('created_at', `${dateFilter}T00:00:00`).lte('created_at', `${dateFilter}T23:59:59`);
    }

    const { data } = await query;
    setLogs((data as DebugLogEntry[]) ?? []);
    setLoading(false);
  };

  // Initial fetch + realtime subscription
  useEffect(() => {
    fetchLogs();

    const supabase = createClient();
    const channel = supabase
      .channel('debug-logs-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'debug_logs' }, (payload) => {
        setLogs((prev) => [payload.new as DebugLogEntry, ...prev]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-fetch when date filter changes
  useEffect(() => { fetchLogs(); }, [dateFilter]);

  const clearLogs = async () => {
    const supabase = createClient();
    await supabase.from('debug_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    setLogs([]);
  };

  const downloadLogs = () => {
    const content = logs.map(l =>
      `[${l.created_at}] [${l.level.toUpperCase()}] [${l.page}/${l.action}] ${l.message}${l.metadata ? ' | ' + JSON.stringify(l.metadata) : ''}`
    ).join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dums-debug-${new Date().toISOString().slice(0, 10)}.log`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getColor = (level: string) => {
    if (level === 'success') return '#4caf50';
    if (level === 'error') return '#f44336';
    if (level === 'warn') return '#ff9800';
    return '#90caf9';
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h5">Debug Logs (Real-time)</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="contained" size="small" startIcon={<RefreshOutlined />} onClick={fetchLogs} disabled={loading}>
            Refresh
          </Button>
          <Button variant="outlined" size="small" startIcon={<DownloadOutlined />} onClick={downloadLogs} disabled={logs.length === 0}>
            Download
          </Button>
          <Button variant="outlined" size="small" color="error" startIcon={<DeleteOutlined />} onClick={clearLogs} disabled={logs.length === 0}>
            Clear All
          </Button>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <TextField
          size="small"
          type="date"
          label="Filter by date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
          sx={{ width: 200 }}
        />
        {dateFilter && <Chip label={dateFilter} onDelete={() => setDateFilter('')} size="small" />}
        <Typography variant="body2" color="text.secondary">{logs.length} log(s)</Typography>
      </Box>

      <Card>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ fontFamily: 'monospace', fontSize: 12, bgcolor: '#0d1117', color: '#e6edf3', p: 2, maxHeight: 550, overflow: 'auto', borderRadius: 1 }}>
            {logs.length === 0 ? (
              <Typography sx={{ color: '#888', fontFamily: 'monospace', fontSize: 12 }}>
                {loading ? 'Loading...' : 'No logs yet. Navigate to Dashboard or Customers page to generate logs.'}
              </Typography>
            ) : (
              logs.map((log) => (
                <Box key={log.id} sx={{ py: 0.4, borderBottom: '1px solid #21262d' }}>
                  <span style={{ color: '#7d8590' }}>{new Date(log.created_at).toLocaleString('en-IN')}</span>{' '}
                  <span style={{ color: getColor(log.level), fontWeight: 700 }}>[{log.level.toUpperCase()}]</span>{' '}
                  <span style={{ color: '#79c0ff' }}>[{log.page}/{log.action}]</span>{' '}
                  {log.message}
                  {log.metadata && <span style={{ color: '#7d8590' }}> | {JSON.stringify(log.metadata)}</span>}
                </Box>
              ))
            )}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
