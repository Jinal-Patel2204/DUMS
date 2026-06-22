'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import InputAdornment from '@mui/material/InputAdornment';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Divider from '@mui/material/Divider';
import ArrowBackOutlined from '@mui/icons-material/ArrowBackOutlined';
import { purchaseEntrySchema, type PurchaseEntryInput } from '@/lib/validations/product';
import { createClient } from '@/lib/supabase/client';
import { useAppSelector } from '@/store/hooks';
import { debugLog } from '@/lib/debug-logger';

interface ProductOption { id: string; name: string; sku: string | null; stock_quantity: number; }
interface PurchaseRecord { id: string; product_id: string; quantity: number; purchase_price_per_unit: number; total_cost: number; supplier_name: string | null; purchase_date: string; created_at: string; }

const fmt = (n: number) => `₹${Number(n).toLocaleString('en-IN')}`;

export default function PurchaseEntryPage() {
  const router = useRouter();
  const currentStore = useAppSelector((s) => s.auth.currentStore);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, control, watch, reset, formState: { errors } } = useForm<PurchaseEntryInput>({
    resolver: zodResolver(purchaseEntrySchema) as any,
    defaultValues: { quantity: 0 as any, purchase_price_per_unit: 0 as any, purchase_date: new Date().toISOString().split('T')[0] },
  });

  const qty = watch('quantity') || 0;
  const price = watch('purchase_price_per_unit') || 0;
  const totalCost = Number(qty) * Number(price);

  useEffect(() => {
    if (!currentStore?.id) return;
    const fetch = async () => {
      const supabase = createClient();
      const [prodRes, purRes] = await Promise.all([
        supabase.from('products').select('id, name, sku, stock_quantity').eq('store_id', currentStore.id).eq('is_deleted', false).order('name'),
        supabase.from('purchase_entries').select('*').eq('store_id', currentStore.id).order('created_at', { ascending: false }).limit(50),
      ]);
      setProducts((prodRes.data as ProductOption[]) ?? []);
      setPurchases((purRes.data as PurchaseRecord[]) ?? []);
    };
    fetch();
  }, [currentStore?.id]);

  const onSubmit = async (data: PurchaseEntryInput) => {
    if (!currentStore) return;
    setLoading(true); setError(''); setSuccess('');
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    // Get current stock
    const { data: prod } = await supabase.from('products').select('stock_quantity').eq('id', data.product_id).single();
    const currentStock = prod?.stock_quantity ?? 0;
    const newStock = currentStock + Number(data.quantity);
    const cost = Number(data.quantity) * Number(data.purchase_price_per_unit);

    // Insert purchase entry
    const { error: purErr } = await supabase.from('purchase_entries').insert({
      store_id: currentStore.id,
      product_id: data.product_id,
      quantity: data.quantity,
      purchase_price_per_unit: data.purchase_price_per_unit,
      total_cost: cost,
      supplier_name: data.supplier_name || null,
      invoice_number: data.invoice_number || null,
      purchase_date: data.purchase_date,
      notes: data.notes || null,
      created_by: session?.user?.id,
    });

    if (purErr) { setError(purErr.message); setLoading(false); return; }

    // Create stock movement
    await supabase.from('stock_movements').insert({
      store_id: currentStore.id,
      product_id: data.product_id,
      type: 'purchase',
      quantity: data.quantity,
      stock_before: currentStock,
      stock_after: newStock,
      notes: `Purchase from ${data.supplier_name || 'supplier'}`,
      created_by: session?.user?.id,
    });

    // Update product stock
    await supabase.from('products').update({ stock_quantity: newStock }).eq('id', data.product_id);

    debugLog('inventory', 'purchase_created', `Purchase: ${data.quantity} units, ${fmt(cost)}`, 'success');
    setSuccess('Purchase entry recorded successfully!');
    reset({ quantity: 0 as any, purchase_price_per_unit: 0 as any, purchase_date: new Date().toISOString().split('T')[0], product_id: '', supplier_name: '', invoice_number: '', notes: '' });

    // Refresh purchases list
    const { data: updated } = await supabase.from('purchase_entries').select('*').eq('store_id', currentStore.id).order('created_at', { ascending: false }).limit(50);
    setPurchases((updated as PurchaseRecord[]) ?? []);
    setLoading(false);
  };

  const getProductName = (id: string) => products.find(p => p.id === id)?.name || id;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <Button startIcon={<ArrowBackOutlined />} onClick={() => router.back()}>Back</Button>
        <Typography variant="h5">Purchase Entry</Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 5 }}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>New Purchase</Typography>
              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
              {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

              <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12 }}>
                    <Controller name="product_id" control={control} render={({ field }) => (
                      <FormControl fullWidth error={!!errors.product_id}>
                        <InputLabel>Product *</InputLabel>
                        <Select {...field} label="Product *" value={field.value || ''}>
                          {products.map((p) => <MenuItem key={p.id} value={p.id}>{p.name} {p.sku ? `(${p.sku})` : ''} — Stock: {p.stock_quantity}</MenuItem>)}
                        </Select>
                      </FormControl>
                    )} />
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Controller name="quantity" control={control} render={({ field }) => (
                      <TextField fullWidth label="Quantity *" type="number" value={field.value} onChange={(e) => field.onChange(e.target.value === '' ? '' : Number(e.target.value))} error={!!errors.quantity} helperText={errors.quantity?.message} />
                    )} />
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Controller name="purchase_price_per_unit" control={control} render={({ field }) => (
                      <TextField fullWidth label="Price/unit *" type="number" value={field.value} onChange={(e) => field.onChange(e.target.value === '' ? '' : Number(e.target.value))} error={!!errors.purchase_price_per_unit}
                        slotProps={{ input: { startAdornment: <InputAdornment position="start">₹</InputAdornment> } }} />
                    )} />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Box sx={{ bgcolor: 'grey.50', p: 1.5, borderRadius: 1 }}>
                      <Typography variant="body2">Total Cost: <strong>{fmt(totalCost)}</strong></Typography>
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 6 }}><TextField fullWidth label="Supplier" {...register('supplier_name')} /></Grid>
                  <Grid size={{ xs: 6 }}><TextField fullWidth label="Invoice #" {...register('invoice_number')} /></Grid>
                  <Grid size={{ xs: 12 }}><TextField fullWidth label="Purchase Date *" type="date" {...register('purchase_date')} slotProps={{ inputLabel: { shrink: true } }} error={!!errors.purchase_date} /></Grid>
                  <Grid size={{ xs: 12 }}><TextField fullWidth label="Notes" multiline rows={2} {...register('notes')} /></Grid>
                </Grid>
                <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }} disabled={loading}>{loading ? 'Saving...' : 'Record Purchase'}</Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 7 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Recent Purchases</Typography>
              {purchases.length === 0 ? <Typography variant="body2" color="text.secondary">No purchase entries yet</Typography> : (
                <TableContainer><Table size="small"><TableHead><TableRow><TableCell>Date</TableCell><TableCell>Product</TableCell><TableCell>Supplier</TableCell><TableCell align="right">Qty</TableCell><TableCell align="right">Price</TableCell><TableCell align="right">Total</TableCell></TableRow></TableHead><TableBody>
                  {purchases.map((p) => (<TableRow key={p.id}><TableCell>{new Date(p.purchase_date).toLocaleDateString('en-IN')}</TableCell><TableCell>{getProductName(p.product_id)}</TableCell><TableCell>{p.supplier_name || '—'}</TableCell><TableCell align="right">{p.quantity}</TableCell><TableCell align="right">{fmt(p.purchase_price_per_unit)}</TableCell><TableCell align="right">{fmt(p.total_cost)}</TableCell></TableRow>))}
                </TableBody></Table></TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
