'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import InputAdornment from '@mui/material/InputAdornment';
import Divider from '@mui/material/Divider';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import AttachMoneyOutlined from '@mui/icons-material/AttachMoneyOutlined';
import Inventory2Outlined from '@mui/icons-material/Inventory2Outlined';
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined';
import { productSchema, type ProductInput } from '@/lib/validations/product';
import { useAppSelector } from '@/store/hooks';
import { useCreateProductMutation } from '@/store/api/productsApi';
import { FormShell } from '@/components/layout/FormShell';
import { ImageUpload } from '@/components/inputs/ImageUpload';

const UNITS = ['pcs', 'kg', 'gm', 'ltr', 'ml', 'btl', 'bag', 'packet', 'can', 'box', 'dozen'];
const fmt = (n: number) => `₹ ${n.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

function PreviewRow({ label, value, mono, bold }: { label: string; value: string; mono?: boolean; bold?: boolean }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary' }}>{label}</Typography>
      <Typography sx={{
        fontSize: '0.8125rem',
        fontWeight: bold ? 700 : 500,
        textAlign: 'right',
        maxWidth: '55%',
        ...(mono && { fontFamily: 'monospace' }),
      }}>
        {value}
      </Typography>
    </Box>
  );
}

export default function NewProductPage() {
  const router = useRouter();
  const currentStore = useAppSelector((s) => s.auth.currentStore);
  const [error, setError] = useState('');
  const [productImage, setProductImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [createProduct, { isLoading: loading }] = useCreateProductMutation();

  const { register, handleSubmit, control, watch, formState: { errors } } = useForm<ProductInput>({
    resolver: zodResolver(productSchema) as any,
    defaultValues: { purchase_price: 0 as any, selling_price: 0 as any, discount_percent: 0 as any, stock_quantity: 0 as any, low_stock_threshold: 5 as any, unit: 'pcs' },
  });

  const name = watch('name') || '';
  const sku = watch('sku') || '';
  const unit = watch('unit') || 'pcs';
  const description = watch('description') || '';
  const purchasePrice = Number(watch('purchase_price')) || 0;
  const sellingPrice = Number(watch('selling_price')) || 0;
  const discount = Number(watch('discount_percent')) || 0;
  const stockQty = Number(watch('stock_quantity')) || 0;
  const lowStock = Number(watch('low_stock_threshold')) || 5;

  const effectivePrice = sellingPrice * (1 - discount / 100);
  const profit = effectivePrice - purchasePrice;
  const margin = purchasePrice > 0 ? ((profit / purchasePrice) * 100).toFixed(2) : '0.00';
  const markup = effectivePrice > 0 ? ((profit / effectivePrice) * 100).toFixed(2) : '0.00';

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
    <FormShell
      title="Add Product"
      subtitle="Enter product details to add new item to your store."
      error={error}
      onSubmit={handleSubmit(onSubmit)}
      onCancel={() => router.back()}
      submitLabel="Save Product"
      isSubmitting={loading}
      sections={[
        {
          title: 'Product Information',
          icon: <InfoOutlined />,
          content: (
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 5 }}>
                <TextField fullWidth label="Product Code *" {...register('sku')} error={!!errors.sku} helperText={errors.sku?.message} />
              </Grid>
              <Grid size={{ xs: 12, sm: 7 }}>
                <TextField fullWidth label="Product Name *" {...register('name')} error={!!errors.name} helperText={errors.name?.message} />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Controller name="unit" control={control} render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Unit *</InputLabel>
                    <Select {...field} label="Unit *" value={field.value || 'pcs'}>
                      {UNITS.map((u) => <MenuItem key={u} value={u}>{u}</MenuItem>)}
                    </Select>
                  </FormControl>
                )} />
              </Grid>
              <Grid size={{ xs: 12, sm: 8 }}>
                <TextField fullWidth label="Description" multiline rows={2} {...register('description')} slotProps={{ htmlInput: { maxLength: 200 } }} helperText={`${description.length}/200`} />
              </Grid>
            </Grid>
          ),
        },
        {
          title: 'Pricing',
          icon: <AttachMoneyOutlined />,
          content: (
            <>
              <Grid container spacing={2}>
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
                    <TextField fullWidth label="Discount %" type="number" value={field.value} onChange={(e) => field.onChange(e.target.value === '' ? '' : Number(e.target.value))}
                      slotProps={{ input: { endAdornment: <InputAdornment position="end">%</InputAdornment> } }} />
                  )} />
                </Grid>
              </Grid>
              {/* Calculated Stats */}
              <Box sx={{ mt: 2, p: 2, bgcolor: 'background.default', borderRadius: 2, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Final / Effective Price</Typography>
                  <Typography sx={{ fontWeight: 700, color: 'secondary.main' }}>{fmt(effectivePrice)}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Profit</Typography>
                  <Typography sx={{ fontWeight: 700, color: profit >= 0 ? 'success.main' : 'error.main' }}>{fmt(profit)}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Margin</Typography>
                  <Typography sx={{ fontWeight: 700, color: 'success.main' }}>{margin}%</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Markup</Typography>
                  <Typography sx={{ fontWeight: 700, color: 'info.main' }}>{markup}%</Typography>
                </Box>
              </Box>
            </>
          ),
        },
        {
          title: 'Inventory / Stock',
          icon: <Inventory2Outlined />,
          content: (
            <>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Controller name="stock_quantity" control={control} render={({ field }) => (
                    <TextField fullWidth label="Initial Stock *" type="number" value={field.value} onChange={(e) => field.onChange(e.target.value === '' ? '' : Number(e.target.value))} error={!!errors.stock_quantity} helperText={errors.stock_quantity?.message}
                      slotProps={{ input: { endAdornment: <InputAdornment position="end">{unit}</InputAdornment> } }} />
                  )} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Controller name="low_stock_threshold" control={control} render={({ field }) => (
                    <TextField fullWidth label="Low Stock Threshold *" type="number" value={field.value} onChange={(e) => field.onChange(e.target.value === '' ? '' : Number(e.target.value))}
                      slotProps={{ input: { endAdornment: <InputAdornment position="end">{unit}</InputAdornment> } }} />
                  )} />
                </Grid>
              </Grid>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <InfoOutlined sx={{ fontSize: 14 }} /> You will be notified when stock reaches the threshold.
              </Typography>
            </>
          ),
        },
      ]}
      preview={
        <>
          {/* Preview Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
            <VisibilityOutlined sx={{ fontSize: 18, color: 'secondary.main' }} />
            <Typography sx={{ fontWeight: 700, fontSize: '1rem' }}>Product Preview</Typography>
          </Box>

          {/* Product Image */}
          <Box sx={{ mb: 2.5 }}>
            <ImageUpload
              value={imagePreview}
              onChange={(file, url) => { setProductImage(file); setImagePreview(url); }}
              placeholder="Upload product image or take photo"
              height={150}
            />
          </Box>

          {/* Product Info Section */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
            <PreviewRow label="Product Name" value={name || '—'} />
            <PreviewRow label="Product Code" value={sku || '—'} mono />
            <PreviewRow label="Unit" value={unit} />
            {description && <PreviewRow label="Description" value={description} />}
          </Box>

          {/* Pricing Section */}
          <Divider sx={{ my: 2, borderStyle: 'dashed' }} />
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
            <PreviewRow label="Selling Price" value={fmt(sellingPrice)} />
            <PreviewRow label="Discount" value={`${discount}%`} />
            <PreviewRow label="Final Price" value={fmt(effectivePrice)} bold />
          </Box>

          {/* Stock Section */}
          <Divider sx={{ my: 2, borderStyle: 'dashed' }} />
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
            <PreviewRow label="Initial Stock" value={`${stockQty} ${unit}`} />
            <PreviewRow label="Low Stock Threshold" value={`${lowStock} ${unit}`} />
          </Box>

          {/* Profit Banner */}
          {profit > 0 && (
            <Box sx={{
              mt: 2.5,
              p: 2,
              bgcolor: '#ECFDF5',
              borderRadius: 2,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 1,
            }}>
              <Typography sx={{ fontSize: 18 }}>📈</Typography>
              <Typography variant="body2" sx={{ color: '#065F46', fontWeight: 500, lineHeight: 1.5 }}>
                You will earn <strong>{fmt(profit)}</strong> profit with <strong>{margin}%</strong> margin on this product.
              </Typography>
            </Box>
          )}
        </>
      }
    />
  );
}
