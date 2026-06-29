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
import Skeleton from '@mui/material/Skeleton';
import Tooltip from '@mui/material/Tooltip';
import AddOutlined from '@mui/icons-material/AddOutlined';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined';
import EditOutlined from '@mui/icons-material/EditOutlined';
import DeleteOutlined from '@mui/icons-material/DeleteOutlined';
import InventoryOutlined from '@mui/icons-material/InventoryOutlined';
import FileDownloadOutlined from '@mui/icons-material/FileDownloadOutlined';
import { createClient } from '@/lib/supabase/client';
import { useAppSelector } from '@/store/hooks';
import { debugLog } from '@/lib/debug-logger';
import { exportToCSV, formatCurrencyExport } from '@/lib/export';
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

  const handleDelete = async (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const confirmed = window.confirm(`Are you sure you want to archive "${product.name}"? This product will no longer appear in lists but existing bills will retain it.`);
    if (!confirmed) return;

    const supabase = createClient();
    const { error } = await supabase.from('products').update({ is_deleted: true }).eq('id', productId);
    if (error) {
      debugLog('products', 'delete_error', error.message, 'error');
      return;
    }
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    debugLog('products', 'delete', `Product "${product.name}" archived`, 'warn');
  };

  if (loading) {
    return (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Skeleton variant="text" width={160} height={32} />
          <Skeleton variant="rounded" width={130} height={36} />
        </Box>
        <Card>
          <Box sx={{ p: 2, display: 'flex', gap: 2 }}>
            <Skeleton variant="rounded" width={250} height={36} />
            <Skeleton variant="rounded" width={150} height={36} />
            <Skeleton variant="rounded" width={130} height={36} />
          </Box>
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} variant="rounded" height={48} sx={{ mx: 2, mb: 1 }} />
          ))}
        </Card>
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Typography variant="h5" sx={{ mb: 2 }}>Products</Typography>
        <Card sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="error">{error}</Typography>
        </Card>
      </Box>
    );
  }

  return (
    <Box>
      {/* Page Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Products</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
            Manage your product catalog and pricing
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Export products">
            <Button variant="outlined" size="small" startIcon={<FileDownloadOutlined />} sx={{ borderColor: 'divider', color: 'text.secondary' }} onClick={() => {
              exportToCSV(filtered, [
                { key: 'sku', label: 'SKU' },
                { key: 'name', label: 'Product Name' },
                { key: 'purchase_price', label: 'Purchase Price', format: (v) => formatCurrencyExport(v) },
                { key: 'selling_price', label: 'Selling Price', format: (v) => formatCurrencyExport(v) },
                { key: 'stock_quantity', label: 'Stock' },
                { key: 'is_active', label: 'Status', format: (v) => v ? 'Active' : 'Inactive' },
              ], `products-${new Date().toISOString().split('T')[0]}`);
            }}>
              Export
            </Button>
          </Tooltip>
          <Button variant="contained" size="small" startIcon={<AddOutlined />} onClick={() => router.push('/store/products/new')}>
            Add Product
          </Button>
        </Box>
      </Box>

      <Card>
        {/* Filters Bar */}
        <Box sx={{ p: 2, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', borderBottom: 1, borderColor: 'divider' }}>
          <TextField
            placeholder="Search by name or SKU..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchOutlined sx={{ fontSize: 18, color: 'text.secondary' }} /></InputAdornment> } }}
            sx={{ width: 260 }}
          />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Category</InputLabel>
            <Select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(0); }} label="Category">
              <MenuItem value="">All Categories</MenuItem>
              {categories.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel>Stock</InputLabel>
            <Select value={stockFilter} onChange={(e) => { setStockFilter(e.target.value); setPage(0); }} label="Stock">
              <MenuItem value="">All Stock</MenuItem>
              <MenuItem value="in">In Stock</MenuItem>
              <MenuItem value="low">Low Stock</MenuItem>
              <MenuItem value="out">Out of Stock</MenuItem>
            </Select>
          </FormControl>
          <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
            {filtered.length} of {products.length} product{products.length !== 1 ? 's' : ''}
          </Typography>
        </Box>

        {/* Table */}
        {filtered.length === 0 ? (
          <Box sx={{ py: 8, textAlign: 'center' }}>
            <InventoryOutlined sx={{ fontSize: 48, color: 'text.disabled', mb: 1.5 }} />
            <Typography variant="subtitle1" color="text.secondary" sx={{ fontWeight: 500 }}>
              {products.length === 0 ? 'No products yet' : 'No products match your filters'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
              {products.length === 0 ? 'Add your first product to start selling.' : 'Try adjusting your search or filter.'}
            </Typography>
            {products.length === 0 && (
              <Button variant="contained" size="small" startIcon={<AddOutlined />} onClick={() => router.push('/store/products/new')}>
                Add Product
              </Button>
            )}
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>SKU</TableCell>
                    <TableCell>Product</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell align="right">Purchase</TableCell>
                    <TableCell align="right">Selling</TableCell>
                    <TableCell align="right">Margin</TableCell>
                    <TableCell align="center">Stock</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="center" sx={{ width: 120 }}>Actions</TableCell>
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
                      <TableRow key={p.id} hover sx={{ cursor: 'pointer' }} onClick={() => router.push(`/store/products/${p.id}`)}>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 500, fontFamily: 'monospace', fontSize: '0.75rem' }}>
                            {p.sku || '—'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>{p.name}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">{catName}</Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" color="text.secondary">{fmt(p.purchase_price)}</Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>{fmt(p.selling_price)}</Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" sx={{ fontWeight: 600, color: profit >= 0 ? 'success.main' : 'error.main' }}>
                            {fmt(profit)}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip 
                            label={p.stock_quantity} 
                            size="small" 
                            color={isOut ? 'error' : isLow ? 'warning' : 'success'} 
                            variant="filled"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip label={p.is_active ? 'Active' : 'Inactive'} size="small" color={p.is_active ? 'success' : 'default'} variant="filled" />
                        </TableCell>
                        <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                          <Tooltip title="View">
                            <IconButton size="small" onClick={() => router.push(`/store/products/${p.id}`)}>
                              <VisibilityOutlined sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit">
                            <IconButton size="small" onClick={() => router.push(`/store/products/${p.id}?edit=true`)}>
                              <EditOutlined sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Archive">
                            <IconButton size="small" color="error" onClick={() => handleDelete(p.id)}>
                              <DeleteOutlined sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={filtered.length}
              page={page}
              onPageChange={(_, p) => setPage(p)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value)); setPage(0); }}
              rowsPerPageOptions={[10, 25, 50]}
            />
          </>
        )}
      </Card>
    </Box>
  );
}
