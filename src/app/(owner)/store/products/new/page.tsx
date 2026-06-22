'use client';

import { useState, useEffect } from 'react';
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
import ArrowBackOutlined from '@mui/icons-material/ArrowBackOutlined';
import { productSchema, type ProductInput } from '@/lib/validations/product';
import { createClient } from '@/lib/supabase/client';
import { useAppSelector } from '@/store/hooks';
import { debugLog } from '@/lib/debug-logger';

interface Category { id: string; name: string; }

const CATEGORY_UNITS: Record<string, string[]> = {
  'Grocery': ['kg', 'gm', 'ltr', 'ml', 'pcs', 'bag', 'packet'],
  'Dairy': ['ltr', 'ml', 'pcs', 'gm', 'kg'],
  'Beverages': ['ltr', 'ml', 'btl', 'pcs', 'can'],
  'Snacks': ['pcs', 'gm', 'kg', 'packet'],
  'Personal Care': ['pcs', 'ml', 'ltr', 'gm', 'btl'],
  'Household': ['pcs', 'ltr', 'ml', 'btl', 'kg', 'gm'],
};

const DEFAULT_UNITS = ['pcs', 'kg', 'gm', 'ltr', 'ml', 'btl', 'bag', 'packet', 'can', 'box', 'dozen'];

export default function NewProductPage() {
  const router = useRouter();
  const currentStore = useAppSelector((s) => s.auth.currentStore);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<ProductInput>({
    resolver: zodResolver(productSchema) as any,
    defaultValues: { purchase_price: 0 as any, selling_price: 0 as any, discount_percent: 0 as any, stock_quantity: 0 as any, low_stock_threshold: 5 as any, unit: 'pcs' },
  });

  const purchasePrice = watch('purchase_price') || 0;
  const sellingPrice = watch('selling_price') || 0;
  const discount = watch('discount_percent') || 0;
  const selectedCategoryId = watch('category_id');

  // Get unit options based on selected category
  const selectedCategoryName = categories.find(c => c.id === selectedCategoryId)?.name || '';
  const unitOptions = CATEGORY_UNITS[selectedCategoryName] || DEFAULT_UNITS;

  const effectivePrice = Number(sellingPrice) * (1 - Number(discount) / 100);
  const profit = effectivePrice - Number(purchasePrice);
  const margin = Number(purchasePrice) > 0 ? ((profit / Number(purchasePrice)) * 100).toFixed(1) : '0';

  useEffect(() => {
    if (!currentStore?.id) return;
    const supabase = createClient();
    supabase.from('categories').select('id, name').eq('store_id', currentStore.id).eq('is_deleted', false).then(({ data }) => {
      setCategories((data as Category[]) ?? []);
    });
  }, [currentStore?.id]);

  const onSubmit = async (data: ProductInput) => {
    if (!currentStore) return;
    setLoading(true);
    setError('');
    const supabase = createClient();

    // Check unique SKU
    const { data: existing } = await supabase.from('products').select('id').eq('store_id', currentStore.id).eq('sku', data.sku).eq('is_deleted', false).limit(1);
    if (existing && existing.length > 0) { setError('Product code already exists.'); setLoading(false); return; }

    const { error: dbError } = await supabase.from('products').insert({
      store_id: currentStore.id,
      sku: data.sku,
      name: data.name,
      category_id: data.category_id || null,
      description: data.description || null,
      purchase_price: data.purchase_price,
      selling_price: data.selling_price,
      discount_percent: data.discount_percent,
      unit: data.unit,
      stock_quantity: data.stock_quantity,
      low_stock_threshold: data.low_stock_threshold,
    });

    if (dbError) { setError(dbError.message); setLoading(false); debugLog('products', 'create_error', dbError.message, 'error'); return; }

    // If initial stock > 0, create stock movement
    if (data.stock_quantity > 0) {
      const { data: { session } } = await supabase.auth.getSession();
      const { data: newProd } = await supabase.from('products').select('id').eq('store_id', currentStore.id).eq('sku', data.sku).single();
      if (newProd) {
        await supabase.from('stock_movements').insert({
          store_id: currentStore.id,
          product_id: newProd.id,
          type: 'stock_in',
          quantity: data.stock_quantity,
          stock_before: 0,
          stock_after: data.stock_quantity,
          notes: 'Initial stock on product creation',
          created_by: session?.user?.id,
        });
      }
    }

    debugLog('products', 'create_success', `Product "${data.name}" created`, 'success');
    router.push('/store/products');
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <Button startIcon={<ArrowBackOutlined />} onClick={() => router.back()}>Back</Button>
        <Typography variant="h5">Add Product</Typography>
      </Box>

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
                <Controller name="category_id" control={control} render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Category</InputLabel>
                    <Select {...field} label="Category" value={field.value || ''} onChange={(e) => {
                      field.onChange(e.target.value);
                      // Reset unit to first option of new category
                      const catName = categories.find(c => c.id === e.target.value)?.name || '';
                      const units = CATEGORY_UNITS[catName] || DEFAULT_UNITS;
                      setValue('unit', units[0]);
                    }}>
                      <MenuItem value="">None</MenuItem>
                      {categories.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                    </Select>
                  </FormControl>
                )} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller name="unit" control={control} render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Unit</InputLabel>
                    <Select {...field} label="Unit" value={field.value || 'pcs'}>
                      {unitOptions.map((u) => <MenuItem key={u} value={u}>{u}</MenuItem>)}
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
