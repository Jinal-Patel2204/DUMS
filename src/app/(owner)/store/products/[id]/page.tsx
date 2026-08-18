'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import EditOutlined from '@mui/icons-material/EditOutlined';
import InventoryOutlined from '@mui/icons-material/InventoryOutlined';
import { useGetProductQuery, useUpdateProductMutation } from '@/store/api/productsApi';
import { DetailShell } from '@/components/layout/DetailShell';

const formatCurrency = (n: number) => `₹${n.toLocaleString('en-IN')}`;
const UNITS = ['pcs', 'kg', 'gm', 'ltr', 'ml', 'btl', 'bag', 'packet', 'can', 'box', 'dozen'];

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const isEdit = searchParams.get('edit') === 'true';

  const [editing, setEditing] = useState(isEdit);
  const [error, setError] = useState('');

  const { data: product, isLoading } = useGetProductQuery({ id }, { skip: !id });
  const [updateProduct, { isLoading: saving }] = useUpdateProductMutation();

  const { register, handleSubmit, control, reset } = useForm({
    defaultValues: { name: '', sku: '', unit: 'pcs', description: '', sellingPrice: 0, purchasePrice: 0, discountPercent: 0, stockQuantity: 0, lowStockThreshold: 5 },
  });

  useEffect(() => {
    if (product) {
      reset({
        name: product.name, sku: product.sku || '', unit: product.unit || 'pcs',
        description: product.description || '', sellingPrice: product.sellingPrice,
        purchasePrice: product.purchasePrice, discountPercent: product.discountPercent,
        stockQuantity: product.stockQuantity, lowStockThreshold: product.lowStockThreshold,
      });
    }
  }, [product, reset]);

  const onSubmit = async (data: any) => {
    setError('');
    try {
      await updateProduct({ id, data }).unwrap();
      setEditing(false);
      router.replace(`/store/products/${id}`);
    } catch (err: any) {
      setError(err?.data?.error || 'Failed to update product');
    }
  };

  // ─── VIEW MODE (DetailShell) ─────────────────────────
  if (!editing) {
    const effectivePrice = product ? product.sellingPrice * (1 - product.discountPercent / 100) : 0;
    const profit = product ? effectivePrice - product.purchasePrice : 0;

    return (
      <DetailShell
        pageTitle="Product Details"
        heading={product?.name || 'Product'}
        isLoading={isLoading}
        error={!product && !isLoading ? 'Product not found' : null}
        status={product ? { label: product.isActive ? 'Active' : 'Inactive', color: product.isActive ? 'success' : 'default' } : undefined}
        accentColor="info.main"
        actions={[
          { label: 'Edit', icon: <EditOutlined sx={{ fontSize: 16 }} />, onClick: () => setEditing(true) },
        ]}
        leftFields={product ? [
          { label: 'Selling Price', value: formatCurrency(product.sellingPrice), large: true },
          { label: 'Purchase Price', value: formatCurrency(product.purchasePrice) },
          { label: 'Discount', value: `${product.discountPercent}%` },
          { label: 'Effective Price', value: formatCurrency(effectivePrice) },
          { label: 'Profit/Unit', value: formatCurrency(profit) },
        ] : []}
        rightFields={product ? [
          { label: 'SKU', value: product.sku || '—', mono: true },
          { label: 'Unit', value: product.unit },
          { label: 'Stock Quantity', value: <Chip label={product.stockQuantity} size="small" color={product.stockQuantity === 0 ? 'error' : product.stockQuantity <= product.lowStockThreshold ? 'warning' : 'success'} /> },
          { label: 'Low Stock Alert', value: String(product.lowStockThreshold) },
        ] : []}
        extraSections={product?.description ? [{ fields: [{ label: 'Description', value: product.description }] }] : []}
      />
    );
  }

  // ─── EDIT MODE ───────────────────────────────────────
  if (isLoading || !product) return <DetailShell pageTitle="Product Details" heading="Loading..." isLoading={true} />;

  return (
    <Box>
      <Typography sx={{ fontWeight: 700, fontSize: '1.25rem', mb: 2 }}>Edit Product</Typography>
      <Box sx={{ bgcolor: 'background.paper', borderRadius: 3, border: 1, borderColor: 'divider', borderLeft: '4px solid', borderLeftColor: 'info.main', p: 3, maxWidth: 600 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 4 }}><TextField fullWidth label="SKU" {...register('sku')} /></Grid>
            <Grid size={{ xs: 12, sm: 8 }}><TextField fullWidth label="Product Name" {...register('name')} /></Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller name="unit" control={control} render={({ field }) => (
                <FormControl fullWidth><InputLabel>Unit</InputLabel><Select {...field} label="Unit">{UNITS.map((u) => <MenuItem key={u} value={u}>{u}</MenuItem>)}</Select></FormControl>
              )} />
            </Grid>
            <Grid size={{ xs: 12 }}><TextField fullWidth label="Description" multiline rows={2} {...register('description')} /></Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Controller name="purchasePrice" control={control} render={({ field }) => (
                <TextField fullWidth label="Purchase Price" type="number" value={field.value} onChange={(e) => field.onChange(e.target.value === '' ? 0 : Number(e.target.value))} slotProps={{ input: { startAdornment: <InputAdornment position="start">₹</InputAdornment> } }} />
              )} />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Controller name="sellingPrice" control={control} render={({ field }) => (
                <TextField fullWidth label="Selling Price" type="number" value={field.value} onChange={(e) => field.onChange(e.target.value === '' ? 0 : Number(e.target.value))} slotProps={{ input: { startAdornment: <InputAdornment position="start">₹</InputAdornment> } }} />
              )} />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Controller name="discountPercent" control={control} render={({ field }) => (
                <TextField fullWidth label="Discount %" type="number" value={field.value} onChange={(e) => field.onChange(e.target.value === '' ? 0 : Number(e.target.value))} slotProps={{ input: { endAdornment: <InputAdornment position="end">%</InputAdornment> } }} />
              )} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller name="stockQuantity" control={control} render={({ field }) => (
                <TextField fullWidth label="Stock Quantity" type="number" value={field.value} onChange={(e) => field.onChange(e.target.value === '' ? 0 : Number(e.target.value))} />
              )} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller name="lowStockThreshold" control={control} render={({ field }) => (
                <TextField fullWidth label="Low Stock Alert At" type="number" value={field.value} onChange={(e) => field.onChange(e.target.value === '' ? 0 : Number(e.target.value))} />
              )} />
            </Grid>
          </Grid>
          <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
            <Button type="submit" variant="contained" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
            <Button variant="outlined" onClick={() => { setEditing(false); router.replace(`/store/products/${id}`); }}>Cancel</Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
