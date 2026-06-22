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
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import AddOutlined from '@mui/icons-material/AddOutlined';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined';
import EditOutlined from '@mui/icons-material/EditOutlined';
import DeleteOutlined from '@mui/icons-material/DeleteOutlined';
import { createClient } from '@/lib/supabase/client';
import { useAppSelector } from '@/store/hooks';
import { debugLog } from '@/lib/debug-logger';
import type { Product } from '@/types/database';

interface Category { id: string; name: string; }

const fmt = (n: number) => `₹${Number(n).toLocaleString('en-IN')}`;

export default function ProductsPage() {
  const router = useRouter();
  const currentStore = useAppSelector((s) => s.auth.currentStore);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [stockFilter, setStockFilter] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    if (!currentStore?.id) return;
    const fetch = async () => {
      const supabase = createClient();
      debugLog('products', 'page_load', 'Products page loaded');

      const [prodRes, catRes] = await Promise.all([
        supabase.from('products').select('*').eq('store_id', currentStore.id).eq('is_deleted', false).order('created_at', { ascending: false }),
        supabase.from('categories').select('id, name').eq('store_id', currentStore.id).eq('is_deleted', false),
      ]);

      if (prodRes.error) { setError(prodRes.error.message); debugLog('products', 'fetch_error', prodRes.error.message, 'error'); }
      else { setProducts((prodRes.data as Product[]) ?? []); debugLog('products', 'fetch_success', `${prodRes.data?.length} products loaded`, 'success'); }

      setCategories((catRes.data as Category[]) ?? []);
      setLoading(false);
    };
    fetch();
  }, [currentStore?.id]);

  const filtered = useMemo(() => {
    let result = products;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((p) => p.name.toLowerCase().includes(q) || (p.sku && p.sku.toLowerCase().includes(q)));
    }
    if (categoryFilter) result = result.filter((p) => p.category_id === categoryFilter);
    if (stockFilter === 'low') result = result.filter((p) => p.stock_quantity > 0 && p.stock_quantity <= p.low_stock_threshold);
    if (stockFilter === 'out') result = result.filter((p) => p.stock_quantity === 0);
    if (stockFilter === 'in') result = result.filter((p) => p.stock_quantity > p.low_stock_threshold);
    return result;
  }, [products, search, categoryFilter, stockFilter]);

  const handleDelete = async (id: string) => {
    if (!confirm('Soft delete this product?')) return;
    const supabase = createClient();
    await supabase.from('products').update({ is_deleted: true }).eq('id', id);
    setProducts((prev) => prev.filter((p) => p.id !== id));
    debugLog('products', 'delete', `Product ${id} soft-deleted`, 'warn');
  };

  if (loading) return <Typography>Loading products...</Typography>;
  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Products ({products.length})</Typography>
        <Button variant="contained" startIcon={<AddOutlined />} onClick={() => router.push('/store/products/new')}>Add Product</Button>
      </Box>

      <Card>
        <Box sx={{ p: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField size="small" placeholder="Search code or name..." value={search} onChange={(e) => setSearch(e.target.value)}
            slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchOutlined fontSize="small" /></InputAdornment> } }}
            sx={{ width: 250 }} />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Category</InputLabel>
            <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} label="Category">
              <MenuItem value="">All</MenuItem>
              {categories.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel>Stock</InputLabel>
            <Select value={stockFilter} onChange={(e) => setStockFilter(e.target.value)} label="Stock">
              <MenuItem value="">All</MenuItem>
              <MenuItem value="in">In Stock</MenuItem>
              <MenuItem value="low">Low Stock</MenuItem>
              <MenuItem value="out">Out of Stock</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {filtered.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}><Typography color="text.secondary">{products.length === 0 ? 'No products yet.' : 'No products match filters.'}</Typography></Box>
        ) : (
          <>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Code</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell align="right">Purchase</TableCell>
                    <TableCell align="right">Selling</TableCell>
                    <TableCell align="right">Profit</TableCell>
                    <TableCell align="center">Stock</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((p) => {
                    const effectivePrice = Number(p.selling_price) * (1 - Number(p.discount_percent) / 100);
                    const profit = effectivePrice - Number(p.purchase_price);
                    const catName = categories.find((c) => c.id === p.category_id)?.name || '—';
                    const isLow = p.stock_quantity > 0 && p.stock_quantity <= p.low_stock_threshold;
                    const isOut = p.stock_quantity === 0;
                    return (
                      <TableRow key={p.id} hover>
                        <TableCell><Typography variant="body2" sx={{ fontWeight: 500 }}>{p.sku || '—'}</Typography></TableCell>
                        <TableCell>{p.name}</TableCell>
                        <TableCell>{catName}</TableCell>
                        <TableCell align="right">{fmt(p.purchase_price)}</TableCell>
                        <TableCell align="right">{fmt(p.selling_price)}</TableCell>
                        <TableCell align="right"><Typography color={profit >= 0 ? 'success.main' : 'error.main'} variant="body2">{fmt(profit)}</Typography></TableCell>
                        <TableCell align="center"><Chip label={p.stock_quantity} size="small" color={isOut ? 'error' : isLow ? 'warning' : 'default'} /></TableCell>
                        <TableCell><Chip label={p.is_active ? 'Active' : 'Inactive'} size="small" color={p.is_active ? 'success' : 'default'} variant="outlined" /></TableCell>
                        <TableCell align="center">
                          <IconButton size="small" onClick={() => router.push(`/store/products/${p.id}`)}><VisibilityOutlined fontSize="small" /></IconButton>
                          <IconButton size="small" onClick={() => router.push(`/store/products/${p.id}?edit=true`)}><EditOutlined fontSize="small" /></IconButton>
                          <IconButton size="small" color="error" onClick={() => handleDelete(p.id)}><DeleteOutlined fontSize="small" /></IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })}
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
