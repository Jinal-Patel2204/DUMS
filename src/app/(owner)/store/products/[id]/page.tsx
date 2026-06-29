'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import EditOutlined from '@mui/icons-material/EditOutlined';
import { productSchema, type ProductInput } from '@/lib/validations/product';
import { createClient } from '@/lib/supabase/client';
import { useAppSelector } from '@/store/hooks';
import { debugLog } from '@/lib/debug-logger';
import type { Product } from '@/types/database';

interface StockMovement { id: string; type: string; quantity: number; stock_before: number; stock_after: number; notes: string | null; created_at: string; }
interface PurchaseEntry { id: string; quantity: number; purchase_price_per_unit: number; total_cost: number; supplier_name: string | null; purchase_date: string; }
interface Category { id: string; name: string; }

const fmt = (n: number) => `₹${Number(n).toLocaleString('en-IN')}`;

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const isEdit = searchParams.get('edit') === 'true';
  const currentStore = useAppSelector((s) => s.auth.currentStore);

  const [product, setProduct] = useState<Product | null>(null);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [purchases, setPurchases] = useState<PurchaseEntry[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editing, setEditing] = useState(isEdit);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  const { register, handleSubmit, control, watch, formState: { errors }, reset } = useForm<ProductInput>({
    resolver: zodResolver(productSchema) as any,
  });

  const purchasePrice = watch('purchase_price') || 0;
  const sellingPrice = watch('selling_price') || 0;
  const discount = watch('discount_percent') || 0;
  const effectivePrice = Number(sellingPrice) * (1 - Number(discount) / 100);
  const profit = effectivePrice - Number(purchasePrice);

  useEffect(() => {
    const fetch = async () => {
      const supabase = createClient();
      const [prodRes, movRes, purRes, catRes] = await Promise.all([
        supabase.from('products').select('*').eq('id', params.id).single(),
        supabase.from('stock_movements').select('*').eq('product_id', params.id).order('created_at', { ascending: false }).limit(20),
        supabase.from('purchase_entries').select('*').eq('product_id', params.id).order('purchase_date', { ascending: false }).limit(20),
        supabase.from('categories').select('id, name').eq('store_id', currentStore?.id || '').eq('is_deleted', false),
      ]);

      if (prodRes.data) {
        setProduct(prodRes.data as Product);
        reset({
          sku: prodRes.data.sku || '',
          name: prodRes.data.name,
          category_id: prodRes.data.category_id || '',
          description: prodRes.data.description || '',
          purchase_price: Number(prodRes.data.purchase_price),
          selling_price: Number(prodRes.data.selling_price),
          discount_percent: Number(prodRes.data.discount_percent),
          unit: prodRes.data.unit,
          stock_quantity: prodRes.data.stock_quantity,
          low_stock_threshold: prodRes.data.low_stock_threshold,
        });
      }
      setMovements((movRes.data as StockMovement[]) ?? []);
      setPurchases((purRes.data as PurchaseEntry[]) ?? []);
      setCategories((catRes.data as Category[]) ?? []);
      setPageLoading(false);
    };
    fetch();
  }, [params.id, currentStore?.id, reset]);

  const onSubmit = async (data: ProductInput) => {
    setLoading(true); setError('');
    const supabase = createClient();
    const { error: dbError } = await supabase.from('products').update({
      sku: data.sku, name: data.name, category_id: data.category_id || null,
      description: data.description || null, purchase_price: data.purchase_price,
      selling_price: data.selling_price, discount_percent: data.discount_percent,
      unit: data.unit, stock_quantity: data.stock_quantity, low_stock_threshold: data.low_stock_threshold,
    }).eq('id', params.id);

    if (dbError) { setError(dbError.message); setLoading(false); return; }
    debugLog('products', 'update_success', `Product "${data.name}" updated`, 'success');
    const { data: updated } = await supabase.from('products').select('*').eq('id', params.id).single();
    if (updated) setProduct(updated as Product);
    setEditing(false); setLoading(false);
  };

  if (pageLoading) return <Typography>Loading...</Typography>;
  if (!product) return <Typography color="error">Product not found</Typography>;

  const catName = categories.find((c) => c.id === product.category_id)?.name || '—';
  const prodProfit = Number(product.selling_price) * (1 - Number(product.discount_percent) / 100) - Number(product.purchase_price);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">{product.name}</Typography>
        {!editing && <Button startIcon={<EditOutlined />} variant="outlined" onClick={() => setEditing(true)}>Edit</Button>}
      </Box>

      {!editing ? (
        <>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Product Info</Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}><Typography variant="body2" color="text.secondary">Code</Typography><Typography variant="body2" sx={{ fontWeight: 500 }}>{product.sku || '—'}</Typography></Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}><Typography variant="body2" color="text.secondary">Category</Typography><Typography variant="body2">{catName}</Typography></Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}><Typography variant="body2" color="text.secondary">Unit</Typography><Typography variant="body2">{product.unit}</Typography></Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}><Typography variant="body2" color="text.secondary">Stock</Typography><Chip label={product.stock_quantity} size="small" color={product.stock_quantity === 0 ? 'error' : product.stock_quantity <= product.low_stock_threshold ? 'warning' : 'success'} /></Box>
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}><Typography variant="body2" color="text.secondary">Purchase Price</Typography><Typography variant="body2">{fmt(product.purchase_price)}</Typography></Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}><Typography variant="body2" color="text.secondary">Selling Price</Typography><Typography variant="body2">{fmt(product.selling_price)}</Typography></Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}><Typography variant="body2" color="text.secondary">Discount</Typography><Typography variant="body2">{product.discount_percent}%</Typography></Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}><Typography variant="body2" color="text.secondary">Profit/unit</Typography><Typography variant="body2" color={prodProfit >= 0 ? 'success.main' : 'error.main'} sx={{ fontWeight: 600 }}>{fmt(prodProfit)}</Typography></Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, md: 8 }}>
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Purchase History</Typography>
                  {purchases.length === 0 ? <Typography variant="body2" color="text.secondary">No purchases recorded</Typography> : (
                    <TableContainer><Table size="small"><TableHead><TableRow><TableCell>Date</TableCell><TableCell>Supplier</TableCell><TableCell align="right">Qty</TableCell><TableCell align="right">Price/unit</TableCell><TableCell align="right">Total</TableCell></TableRow></TableHead><TableBody>
                      {purchases.map((p) => (<TableRow key={p.id}><TableCell>{new Date(p.purchase_date).toLocaleDateString('en-IN')}</TableCell><TableCell>{p.supplier_name || '—'}</TableCell><TableCell align="right">{p.quantity}</TableCell><TableCell align="right">{fmt(p.purchase_price_per_unit)}</TableCell><TableCell align="right">{fmt(p.total_cost)}</TableCell></TableRow>))}
                    </TableBody></Table></TableContainer>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Stock Movements</Typography>
                  {movements.length === 0 ? <Typography variant="body2" color="text.secondary">No stock movements</Typography> : (
                    <TableContainer><Table size="small"><TableHead><TableRow><TableCell>Date</TableCell><TableCell>Type</TableCell><TableCell align="right">Qty</TableCell><TableCell align="right">Before</TableCell><TableCell align="right">After</TableCell><TableCell>Notes</TableCell></TableRow></TableHead><TableBody>
                      {movements.map((m) => (<TableRow key={m.id}><TableCell>{new Date(m.created_at).toLocaleDateString('en-IN')}</TableCell><TableCell><Chip label={m.type} size="small" color={m.type === 'stock_in' || m.type === 'purchase' ? 'success' : m.type === 'stock_out' ? 'error' : 'default'} /></TableCell><TableCell align="right">{m.quantity}</TableCell><TableCell align="right">{m.stock_before}</TableCell><TableCell align="right">{m.stock_after}</TableCell><TableCell>{m.notes || '—'}</TableCell></TableRow>))}
                    </TableBody></Table></TableContainer>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      ) : (
        <Card sx={{ maxWidth: 700 }}>
          <CardContent sx={{ p: 3 }}>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 4 }}><TextField fullWidth label="Product Code" {...register('sku')} error={!!errors.sku} helperText={errors.sku?.message} /></Grid>
                <Grid size={{ xs: 12, sm: 8 }}><TextField fullWidth label="Product Name" {...register('name')} error={!!errors.name} helperText={errors.name?.message} /></Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Controller name="category_id" control={control} render={({ field }) => (
                    <FormControl fullWidth><InputLabel>Category</InputLabel><Select {...field} label="Category" value={field.value || ''}><MenuItem value="">None</MenuItem>{categories.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}</Select></FormControl>
                  )} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label="Unit" {...register('unit')} /></Grid>
                <Grid size={{ xs: 12 }}><TextField fullWidth label="Description" multiline rows={2} {...register('description')} /></Grid>
                <Grid size={{ xs: 12, sm: 4 }}><Controller name="purchase_price" control={control} render={({ field }) => (<TextField fullWidth label="Purchase Price" type="number" value={field.value} onChange={(e) => field.onChange(e.target.value === '' ? '' : Number(e.target.value))} slotProps={{ input: { startAdornment: <InputAdornment position="start">₹</InputAdornment> } }} />)} /></Grid>
                <Grid size={{ xs: 12, sm: 4 }}><Controller name="selling_price" control={control} render={({ field }) => (<TextField fullWidth label="Selling Price" type="number" value={field.value} onChange={(e) => field.onChange(e.target.value === '' ? '' : Number(e.target.value))} slotProps={{ input: { startAdornment: <InputAdornment position="start">₹</InputAdornment> } }} />)} /></Grid>
                <Grid size={{ xs: 12, sm: 4 }}><Controller name="discount_percent" control={control} render={({ field }) => (<TextField fullWidth label="Discount %" type="number" value={field.value} onChange={(e) => field.onChange(e.target.value === '' ? '' : Number(e.target.value))} slotProps={{ input: { endAdornment: <InputAdornment position="end">%</InputAdornment> } }} />)} /></Grid>
                <Grid size={{ xs: 12 }}><Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1, display: 'flex', gap: 4 }}><Box><Typography variant="caption" color="text.secondary">Profit</Typography><Typography sx={{ fontWeight: 600 }} color={profit >= 0 ? 'success.main' : 'error.main'}>{`₹${profit.toFixed(2)}`}</Typography></Box></Box></Grid>
                <Grid size={{ xs: 12, sm: 6 }}><Controller name="stock_quantity" control={control} render={({ field }) => (<TextField fullWidth label="Stock" type="number" value={field.value} onChange={(e) => field.onChange(e.target.value === '' ? '' : Number(e.target.value))} />)} /></Grid>
                <Grid size={{ xs: 12, sm: 6 }}><Controller name="low_stock_threshold" control={control} render={({ field }) => (<TextField fullWidth label="Low Stock Alert" type="number" value={field.value} onChange={(e) => field.onChange(e.target.value === '' ? '' : Number(e.target.value))} />)} /></Grid>
              </Grid>
              <Box sx={{ display: 'flex', gap: 2, mt: 3 }}><Button type="submit" variant="contained" disabled={loading}>{loading ? 'Saving...' : 'Save'}</Button><Button variant="outlined" onClick={() => setEditing(false)}>Cancel</Button></Box>
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
