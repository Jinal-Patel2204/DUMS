'use client';

import { useState, useMemo } from 'react';
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
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Skeleton from '@mui/material/Skeleton';
import Tooltip from '@mui/material/Tooltip';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import AddOutlined from '@mui/icons-material/AddOutlined';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined';
import EditOutlined from '@mui/icons-material/EditOutlined';
import DeleteOutlined from '@mui/icons-material/DeleteOutlined';
import InventoryOutlined from '@mui/icons-material/InventoryOutlined';
import FileDownloadOutlined from '@mui/icons-material/FileDownloadOutlined';
import { useAppSelector } from '@/store/hooks';
import { useGetProductsQuery, useDeleteProductMutation } from '@/store/api/productsApi';
import { exportToCSV, formatCurrencyExport } from '@/lib/export';

const fmt = (n: number) => `₹${Number(n).toLocaleString('en-IN')}`;

export default function ProductsPage() {
  const router = useRouter();
  const currentStore = useAppSelector((s) => s.auth.currentStore);
  const [search, setSearch] = useState('');
  const [stockFilter, setStockFilter] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);

  // ─── JAVA BACKEND CALL via Redux Query ───────────────
  const { data: products = [], isLoading, error } = useGetProductsQuery(
    { storeId: currentStore?.id ?? '' },
    { skip: !currentStore?.id }
  );
  // ─────────────────────────────────────────────────────

  const [deleteProduct] = useDeleteProductMutation();

  const filtered = useMemo(() => {
    let result = products;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((p) => p.name.toLowerCase().includes(q) || (p.sku && p.sku.toLowerCase().includes(q)));
    }
    if (stockFilter === 'low') result = result.filter((p) => p.stockQuantity > 0 && p.stockQuantity <= p.lowStockThreshold);
    if (stockFilter === 'out') result = result.filter((p) => p.stockQuantity === 0);
    if (stockFilter === 'in') result = result.filter((p) => p.stockQuantity > p.lowStockThreshold);
    return result;
  }, [products, search, stockFilter]);

  const handleDelete = (productId: string) => {
    setProductToDelete(productId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (productToDelete) {
      await deleteProduct({ id: productToDelete });
    }
    setDeleteDialogOpen(false);
    setProductToDelete(null);
  };

  if (isLoading) {
    return (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Skeleton variant="text" width={160} height={32} />
          <Skeleton variant="rounded" width={130} height={36} />
        </Box>
        <Card>
          <Box sx={{ p: 2, display: 'flex', gap: 2 }}>
            <Skeleton variant="rounded" width={250} height={36} />
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
          <Typography color="error">Failed to load products. Make sure the backend is running.</Typography>
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
              exportToCSV(filtered.map(p => ({
                sku: p.sku,
                name: p.name,
                purchase_price: p.purchasePrice,
                selling_price: p.sellingPrice,
                stock_quantity: p.stockQuantity,
                is_active: p.isActive,
              })), [
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
                    const effectivePrice = Number(p.sellingPrice) * (1 - Number(p.discountPercent) / 100);
                    const profit = effectivePrice - Number(p.purchasePrice);
                    const isLow = p.stockQuantity > 0 && p.stockQuantity <= p.lowStockThreshold;
                    const isOut = p.stockQuantity === 0;
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
                        <TableCell align="right">
                          <Typography variant="body2" color="text.secondary">{fmt(p.purchasePrice)}</Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>{fmt(p.sellingPrice)}</Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" sx={{ fontWeight: 600, color: profit >= 0 ? 'success.main' : 'error.main' }}>
                            {fmt(profit)}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={p.stockQuantity}
                            size="small"
                            color={isOut ? 'error' : isLow ? 'warning' : 'success'}
                            variant="filled"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip label={p.isActive ? 'Active' : 'Inactive'} size="small" color={p.isActive ? 'success' : 'default'} variant="filled" />
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Archive Product</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to archive this product? It will no longer appear in product lists but existing bills will retain it.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Archive
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
