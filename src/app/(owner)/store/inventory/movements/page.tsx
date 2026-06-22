'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TablePagination from '@mui/material/TablePagination';
import Chip from '@mui/material/Chip';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import ArrowBackOutlined from '@mui/icons-material/ArrowBackOutlined';
import { createClient } from '@/lib/supabase/client';
import { useAppSelector } from '@/store/hooks';
import { debugLog } from '@/lib/debug-logger';

interface Movement {
  id: string; product_id: string; type: string; quantity: number;
  stock_before: number; stock_after: number; notes: string | null;
  reference_type: string | null; created_at: string;
}
interface ProductMap { [id: string]: string; }

export default function StockMovementsPage() {
  const router = useRouter();
  const currentStore = useAppSelector((s) => s.auth.currentStore);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [productNames, setProductNames] = useState<ProductMap>({});
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  useEffect(() => {
    if (!currentStore?.id) return;
    const fetch = async () => {
      const supabase = createClient();
      debugLog('inventory', 'movements_load', 'Stock movements page loaded');

      const [movRes, prodRes] = await Promise.all([
        supabase.from('stock_movements').select('*').eq('store_id', currentStore.id).order('created_at', { ascending: false }).limit(200),
        supabase.from('products').select('id, name').eq('store_id', currentStore.id),
      ]);

      setMovements((movRes.data as Movement[]) ?? []);
      const map: ProductMap = {};
      (prodRes.data ?? []).forEach((p: any) => { map[p.id] = p.name; });
      setProductNames(map);
      setLoading(false);
    };
    fetch();
  }, [currentStore?.id]);

  const filtered = typeFilter ? movements.filter(m => m.type === typeFilter) : movements;

  const getChipColor = (type: string) => {
    if (type === 'stock_in' || type === 'purchase') return 'success';
    if (type === 'stock_out') return 'error';
    return 'default';
  };

  if (loading) return <Typography>Loading movements...</Typography>;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <Button startIcon={<ArrowBackOutlined />} onClick={() => router.back()}>Back</Button>
        <Typography variant="h5">Stock Movements</Typography>
      </Box>

      <Card>
        <Box sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Type</InputLabel>
            <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} label="Type">
              <MenuItem value="">All</MenuItem>
              <MenuItem value="stock_in">Stock In</MenuItem>
              <MenuItem value="stock_out">Stock Out</MenuItem>
              <MenuItem value="purchase">Purchase</MenuItem>
              <MenuItem value="adjustment">Adjustment</MenuItem>
            </Select>
          </FormControl>
          <Typography variant="body2" color="text.secondary">{filtered.length} movement(s)</Typography>
        </Box>

        {filtered.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}><Typography color="text.secondary">No stock movements recorded yet.</Typography></Box>
        ) : (
          <>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Product</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell align="right">Qty</TableCell>
                    <TableCell align="right">Before</TableCell>
                    <TableCell align="right">After</TableCell>
                    <TableCell>Notes</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((m) => (
                    <TableRow key={m.id}>
                      <TableCell>{new Date(m.created_at).toLocaleDateString('en-IN')}</TableCell>
                      <TableCell>{productNames[m.product_id] || m.product_id.slice(0, 8)}</TableCell>
                      <TableCell><Chip label={m.type.replace('_', ' ')} size="small" color={getChipColor(m.type) as any} /></TableCell>
                      <TableCell align="right">{m.quantity}</TableCell>
                      <TableCell align="right">{m.stock_before}</TableCell>
                      <TableCell align="right">{m.stock_after}</TableCell>
                      <TableCell>{m.notes || '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination component="div" count={filtered.length} page={page} onPageChange={(_, p) => setPage(p)} rowsPerPage={rowsPerPage} onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value)); setPage(0); }} />
          </>
        )}
      </Card>
    </Box>
  );
}
