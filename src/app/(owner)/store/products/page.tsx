'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import AddOutlined from '@mui/icons-material/AddOutlined';
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined';
import DeleteOutlined from '@mui/icons-material/DeleteOutlined';
import InventoryOutlined from '@mui/icons-material/InventoryOutlined';
import ContentCopyOutlined from '@mui/icons-material/ContentCopyOutlined';
import { useAppSelector } from '@/store/hooks';
import { useGetProductsQuery, useDeleteProductMutation } from '@/store/api/productsApi';
import { PageShell } from '@/components/layout/PageShell';
import { RowActions } from '@/components/data-display/RowActions';
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog';
import { exportToCSV, formatCurrencyExport } from '@/lib/export';

const fmt = (n: number) => `₹${Number(n).toLocaleString('en-IN')}`;

export default function ProductsPage() {
  const router = useRouter();
  const currentStore = useAppSelector((s) => s.auth.currentStore);
  const [search, setSearch] = useState('');
  const [stockFilter, setStockFilter] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);

  const { data: products = [], isLoading, error } = useGetProductsQuery(
    { storeId: currentStore?.id ?? '' },
    { skip: !currentStore?.id }
  );
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

  const handleDelete = (id: string) => { setProductToDelete(id); setDeleteDialogOpen(true); };
  const confirmDelete = async () => {
    if (productToDelete) await deleteProduct({ id: productToDelete });
    setDeleteDialogOpen(false);
    setProductToDelete(null);
  };

  const handleExport = () => {
    exportToCSV(filtered.map(p => ({
      sku: p.sku, name: p.name, purchase_price: p.purchasePrice,
      selling_price: p.sellingPrice, stock_quantity: p.stockQuantity, is_active: p.isActive,
    })), [
      { key: 'sku', label: 'SKU' },
      { key: 'name', label: 'Product Name' },
      { key: 'purchase_price', label: 'Purchase Price', format: (v) => formatCurrencyExport(v) },
      { key: 'selling_price', label: 'Selling Price', format: (v) => formatCurrencyExport(v) },
      { key: 'stock_quantity', label: 'Stock' },
      { key: 'is_active', label: 'Status', format: (v) => v ? 'Active' : 'Inactive' },
    ], `products-${new Date().toISOString().split('T')[0]}`);
  };

  const totalStock = useMemo(() => products.reduce((sum, p) => sum + p.stockQuantity, 0), [products]);
  const lowStockCount = useMemo(() => products.filter(p => p.stockQuantity > 0 && p.stockQuantity <= p.lowStockThreshold).length, [products]);
  const outOfStockCount = useMemo(() => products.filter(p => p.stockQuantity === 0).length, [products]);

  return (
    <>
      <PageShell
        title="Products"
        subtitle="Manage your product catalog and pricing"
        isLoading={isLoading}
        error={error ? 'Failed to load products. Make sure the backend is running.' : null}
        onExport={handleExport}
        actions={[{ label: 'Add Product', icon: <AddOutlined />, onClick: () => router.push('/store/products/new') }]}
        stats={[
          { label: 'Total Products', value: products.length },
          { label: 'Total Stock', value: totalStock },
          { label: 'Low Stock', value: lowStockCount, color: 'warning.main' },
          { label: 'Out of Stock', value: outOfStockCount, color: 'error.main' },
        ]}
        searchPlaceholder="Search by name or SKU..."
        searchValue={search}
        onSearchChange={(v) => { setSearch(v); setPage(0); }}
        filters={
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel>Stock</InputLabel>
            <Select value={stockFilter} onChange={(e) => { setStockFilter(e.target.value); setPage(0); }} label="Stock">
              <MenuItem value="">All Stock</MenuItem>
              <MenuItem value="in">In Stock</MenuItem>
              <MenuItem value="low">Low Stock</MenuItem>
              <MenuItem value="out">Out of Stock</MenuItem>
            </Select>
          </FormControl>
        }
        resultCount={filtered.length}
        isEmpty={filtered.length === 0}
        emptyIcon={<InventoryOutlined />}
        emptyTitle={products.length === 0 ? 'No products yet' : 'No products match your filters'}
        emptyDescription={products.length === 0 ? 'Add your first product to start selling.' : 'Try adjusting your search or filter.'}
        emptyAction={products.length === 0 ? { label: 'Add Product', onClick: () => router.push('/store/products/new') } : undefined}
        totalCount={filtered.length}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={(p) => setPage(p)}
        onRowsPerPageChange={(r) => { setRowsPerPage(r); setPage(0); }}
      >
        <TableContainer>
          <Table>
            <TableHead><TableRow>
              <TableCell>SKU</TableCell>
              <TableCell>Product</TableCell>
              <TableCell align="right">Purchase</TableCell>
              <TableCell align="right">Selling</TableCell>
              <TableCell align="right">Margin</TableCell>
              <TableCell align="center">Stock</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="center" sx={{ width: 120 }}>Actions</TableCell>
            </TableRow></TableHead>
            <TableBody>
              {filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((p) => {
                const effectivePrice = Number(p.sellingPrice) * (1 - Number(p.discountPercent) / 100);
                const profit = effectivePrice - Number(p.purchasePrice);
                const isLow = p.stockQuantity > 0 && p.stockQuantity <= p.lowStockThreshold;
                const isOut = p.stockQuantity === 0;
                return (
                  <TableRow key={p.id} hover sx={{ cursor: 'pointer' }} onClick={() => router.push(`/store/products/${p.id}`)}>
                    <TableCell><Typography variant="body2" sx={{ fontWeight: 500, fontFamily: 'monospace', fontSize: '0.75rem' }}>{p.sku || '—'}</Typography></TableCell>
                    <TableCell><Typography variant="body2" sx={{ fontWeight: 500 }}>{p.name}</Typography></TableCell>
                    <TableCell align="right"><Typography variant="body2" color="text.secondary">{fmt(p.purchasePrice)}</Typography></TableCell>
                    <TableCell align="right"><Typography variant="body2" sx={{ fontWeight: 500 }}>{fmt(p.sellingPrice)}</Typography></TableCell>
                    <TableCell align="right"><Typography variant="body2" sx={{ fontWeight: 600, color: profit >= 0 ? 'success.main' : 'error.main' }}>{fmt(profit)}</Typography></TableCell>
                    <TableCell align="center"><Chip label={p.stockQuantity} size="small" color={isOut ? 'error' : isLow ? 'warning' : 'success'} variant="filled" /></TableCell>
                    <TableCell><Chip label={p.isActive ? 'Active' : 'Inactive'} size="small" color={p.isActive ? 'success' : 'default'} variant="filled" /></TableCell>
                    <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                      <RowActions
                        onEdit={() => router.push(`/store/products/${p.id}?edit=true`)}
                        menuItems={[
                          { label: 'View Details', icon: <VisibilityOutlined sx={{ fontSize: 18 }} />, onClick: () => router.push(`/store/products/${p.id}`) },
                          { label: 'Duplicate Product', icon: <ContentCopyOutlined sx={{ fontSize: 18 }} />, onClick: () => router.push(`/store/products/new?duplicate=${p.id}`) },
                          { label: 'Delete', icon: <DeleteOutlined sx={{ fontSize: 18 }} />, onClick: () => handleDelete(p.id), color: 'error', dividerBefore: true },
                        ]}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </PageShell>

      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        title="Archive Product"
        description="Are you sure you want to archive this product? It will no longer appear in product lists but existing bills will retain it."
        confirmLabel="Archive"
        confirmColor="error"
      />
    </>
  );
}
