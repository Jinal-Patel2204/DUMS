'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import InputAdornment from '@mui/material/InputAdornment';
import Divider from '@mui/material/Divider';
import { productSchema, type ProductInput } from '@/lib/validations/product';
import { useAppSelector } from '@/store/hooks';
import { useCreateProductMutation } from '@/store/api/productsApi';

const DEFAULT_UNITS = ['pcs', 'kg', 'gm', 'ltr', 'ml', 'btl', 'bag', 'packet', 'can', 'box', 'dozen'];

export default function NewProductPage() {
  const router = useRouter();
  const currentStore = useAppSelector((s) => s.auth.currentStore);
  const [error, setError] = useState('');

  // ─── JAVA BACKEND CALL via Redux Query ───────────────
  const [createProduct, { isLoading: loading }] = useCreateProductMutation();
  // ─────────────────────────────────────────────────────

  const { register, handleSubmit, control, watch, formState: { errors } } = useForm<ProductInput>({
    resolver: zodResolver(productSchema) as any,
    defaultValues: { purchase_price: 0 as any, selling_price: 0 as any, discount_percent: 0 as any, stock_quantity: 0 as any, low_stock_threshold: 5 as any, unit: 'pcs' },
  });

  const purchasePrice = watch('purchase_price') || 0;
  const sellingPrice = watch('selling_price') || 0;
  const discount = watch('discount_percent') || 0;

  const effectivePrice = Number(sellingPrice) * (1 - Number(discount) / 100);
  const profit = effectivePrice - Number(purchasePrice);
  const margin = Number(purchasePrice) > 0 ? ((profit / Number(purchasePrice)) * 100).toFixed(1) : '0';

  const onSubmit = async (data: ProductInput) => {
    if (!currentStore) return;
    setError('');

    try {
      await createProduct({
        storeId: currentStore.id,
        name: data.name,
        description: data.description || undefined,
        sku: data.sku || undefined,
        unit: data.unit || 'pcs',
        sellingPrice: data.selling_price,
        purchasePrice: data.purchase_price,
        discountPercent: data.discount_percent,
        stockQuantity: data.stock_quantity,
        lowStockThreshold: data.low_stock_threshold,
      }).unwrap();

      router.push('/store/products');
    } catch (err: any) {
      setError(err?.data?.error || err?.data?.message || 'Failed to create product');
    }
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>Add Product</Typography>

      <Card sx={{ maxWidth: 700 }}>
        <CardContent sx={{ p: 3 }}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField fullWidth label="Product Code *" {...register('sku')} error={!!errors.sku} helperText={errors.sku?.message} />
              </Grid>
              <Grid size={{ xs: 12, sm: 8 }}>
                <TextField fullWidth label="Product Name *" {...register('name')} error={!!errors.name} helperText={errors.name?.message} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller name="unit" control={control} render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Unit</InputLabel>
                    <Select {...field} label="Unit" value={field.value || 'pcs'}>
                      {DEFAULT_UNITS.map((u) => <MenuItem key={u} value={u}>{u}</MenuItem>)}
                    </Select>
                  </FormControl>
                )} />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField fullWidth label="Description" multiline rows={2} {...register('description')} />
              </Grid>

              <Grid size={{ xs: 12 }}><Divider sx={{ my: 1 }}>Pricing</Divider></Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <Controller name="purchase_price" control={control} render={({ field }) => (
                  <TextField fullWidth label="Purchase Price *" type="number" value={field.value} onChange={(e) => field.onChange(e.target.value === '' ? '' : Number(e.target.value))} error={!!errors.purchase_price} helperText={errors.purchase_price?.message}
                    slotProps={{ input: { startAdornment: <InputAdornment position="start">₹</InputAdornment> } }} />
                )} />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Controller name="selling_price" control={control} render={({ field }) => (
                  <TextField fullWidth label="Selling Price *" type="number" value={field.value} onChange={(e) => field.onChange(e.target.value === '' ? '' : Number(e.target.value))} error={!!errors.selling_price} helperText={errors.selling_price?.message}
                    slotProps={{ input: { startAdornment: <InputAdornment position="start">₹</InputAdornment> } }} />
                )} />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Controller name="discount_percent" control={control} render={({ field }) => (
                  <TextField fullWidth label="Discount %" type="number" value={field.value} onChange={(e) => field.onChange(e.target.value === '' ? '' : Number(e.target.value))} error={!!errors.discount_percent} helperText={errors.discount_percent?.message}
                    slotProps={{ input: { endAdornment: <InputAdornment position="end">%</InputAdornment> } }} />
                )} />
              </Grid>

              {/* Auto-calculated */}
              <Grid size={{ xs: 12 }}>
                <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1, display: 'flex', gap: 4 }}>
                  <Box><Typography variant="caption" color="text.secondary">Effective Price</Typography><Typography sx={{ fontWeight: 600 }}>{`₹${effectivePrice.toFixed(2)}`}</Typography></Box>
                  <Box><Typography variant="caption" color="text.secondary">Profit</Typography><Typography sx={{ fontWeight: 600 }} color={profit >= 0 ? 'success.main' : 'error.main'}>{`₹${profit.toFixed(2)}`}</Typography></Box>
                  <Box><Typography variant="caption" color="text.secondary">Margin</Typography><Typography sx={{ fontWeight: 600 }}>{margin}%</Typography></Box>
                </Box>
              </Grid>

              <Grid size={{ xs: 12 }}><Divider sx={{ my: 1 }}>Stock</Divider></Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller name="stock_quantity" control={control} render={({ field }) => (
                  <TextField fullWidth label="Initial Stock" type="number" value={field.value} onChange={(e) => field.onChange(e.target.value === '' ? '' : Number(e.target.value))} error={!!errors.stock_quantity} helperText={errors.stock_quantity?.message} />
                )} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller name="low_stock_threshold" control={control} render={({ field }) => (
                  <TextField fullWidth label="Low Stock Alert At" type="number" value={field.value} onChange={(e) => field.onChange(e.target.value === '' ? '' : Number(e.target.value))} />
                )} />
              </Grid>
            </Grid>

            <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
              <Button type="submit" variant="contained" disabled={loading}>{loading ? 'Saving...' : 'Add Product'}</Button>
              <Button variant="outlined" onClick={() => router.back()}>Cancel</Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
