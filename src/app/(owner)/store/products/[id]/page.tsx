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
import Divider from '@mui/material/Divider';
import Alert from '@mui/material/Alert';
import Skeleton from '@mui/material/Skeleton';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import EditOutlined from '@mui/icons-material/EditOutlined';
import { useGetProductQuery, useUpdateProductMutation } from '@/store/api/productsApi';

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

  const { register, handleSubmit, control, reset, watch } = useForm({
    defaultValues: { name: '', sku: '', unit: 'pcs', description: '', sellingPrice: 0, purchasePrice: 0, discountPercent: 0, stockQuantity: 0, lowStockThreshold: 5 },
  });

  useEffect(() => {
    if (product) {
      reset({
        name: product.name,
        sku: product.sku || '',
        unit: product.unit || 'pcs',
        description: product.description || '',
        sellingPrice: product.sellingPrice,
        purchasePrice: product.purchasePrice,
        discountPercent: product.discountPercent,
        stockQuantity: product.stockQuantity,
        lowStockThreshold: product.lowStockThreshold,
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

  if (isLoading || !product) {
    return <Box><Skeleton variant="rounded" height={40} sx={{ mb: 2, width: 200 }} /><Skeleton variant="rounded" height={300} /></Box>;
  }

  const effectivePrice = product.sellingPrice * (1 - product.discountPercent / 100);
  const profit = effectivePrice - product.purchasePrice;

  if (!editing) {
    return (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h5">{product.name}</Typography>
            <Chip label={product.isActive ? 'Active' : 'Inactive'} color={product.isActive ? 'success' : 'default'} size="small" />
          </Box>
          <Button startIcon={<EditOutlined />} variant="outlined" onClick={() => setEditing(true)}>Edit</Button>
        </Box>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card><CardContent>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>Product Information</Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}><Typography variant="body2" color="text.secondary">SKU</Typography><Typography variant="body2" sx={{ fontWeight: 500 }}>{product.sku || '—'}</Typography></Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}><Typography variant="body2" color="text.secondary">Unit</Typography><Typography variant="body2">{product.unit}</Typography></Box>
              {product.description && <Box sx={{ mt: 1 }}><Typography variant="body2" color="text.secondary">Description</Typography><Typography variant="body2">{product.description}</Typography></Box>}
            </CardContent></Card>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card><CardContent>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>Stock</Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}><Typography variant="body2" color="text.secondary">Current Stock</Typography><Chip label={product.stockQuantity} size="small" color={product.stockQuantity === 0 ? 'error' : product.stockQuantity <= product.lowStockThreshold ? 'warning' : 'success'} /></Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}><Typography variant="body2" color="text.secondary">Low Stock Threshold</Typography><Typography variant="body2">{product.lowStockThreshold}</Typography></Box>
            </CardContent></Card>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card><CardContent>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>Pricing</Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}><Typography variant="body2" color="text.secondary">Purchase Price</Typography><Typography variant="body2">{formatCurrency(product.purchasePrice)}</Typography></Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}><Typography variant="body2" color="text.secondary">Selling Price</Typography><Typography variant="body2">{formatCurrency(product.sellingPrice)}</Typography></Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}><Typography variant="body2" color="text.secondary">Discount</Typography><Typography variant="body2">{product.discountPercent}%</Typography></Box>
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}><Typography variant="body2" color="text.secondary">Effective Price</Typography><Typography variant="body2" sx={{ fontWeight: 500 }}>{formatCurrency(effectivePrice)}</Typography></Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}><Typography variant="body2" color="text.secondary">Profit/Unit</Typography><Typography variant="body2" sx={{ fontWeight: 600 }} color={profit >= 0 ? 'success.main' : 'error.main'}>{formatCurrency(profit)}</Typography></Box>
            </CardContent></Card>
          </Grid>
        </Grid>
      </Box>
    );
  }

  // EDIT MODE
  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>Edit Product</Typography>
      <Card sx={{ maxWidth: 600 }}>
        <CardContent sx={{ p: 3 }}>
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
                  <TextField fullWidth label="Purchase Price" type="number" value={field.value} onChange={(e) => field.onChange(e.target.value === '' ? 0 : Number(e.target.value))} onFocus={(e) => e.target.select()} slotProps={{ input: { startAdornment: <InputAdornment position="start">₹</InputAdornment> } }} />
                )} />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Controller name="sellingPrice" control={control} render={({ field }) => (
                  <TextField fullWidth label="Selling Price" type="number" value={field.value} onChange={(e) => field.onChange(e.target.value === '' ? 0 : Number(e.target.value))} onFocus={(e) => e.target.select()} slotProps={{ input: { startAdornment: <InputAdornment position="start">₹</InputAdornment> } }} />
                )} />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Controller name="discountPercent" control={control} render={({ field }) => (
                  <TextField fullWidth label="Discount %" type="number" value={field.value} onChange={(e) => field.onChange(e.target.value === '' ? 0 : Number(e.target.value))} onFocus={(e) => e.target.select()} slotProps={{ input: { endAdornment: <InputAdornment position="end">%</InputAdornment> } }} />
                )} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller name="stockQuantity" control={control} render={({ field }) => (
                  <TextField fullWidth label="Stock Quantity" type="number" value={field.value} onChange={(e) => field.onChange(e.target.value === '' ? 0 : Number(e.target.value))} onFocus={(e) => e.target.select()} />
                )} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller name="lowStockThreshold" control={control} render={({ field }) => (
                  <TextField fullWidth label="Low Stock Alert At" type="number" value={field.value} onChange={(e) => field.onChange(e.target.value === '' ? 0 : Number(e.target.value))} onFocus={(e) => e.target.select()} />
                )} />
              </Grid>
            </Grid>
            <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
              <Button type="submit" variant="contained" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
              <Button variant="outlined" onClick={() => { setEditing(false); router.replace(`/store/products/${id}`); }}>Cancel</Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
