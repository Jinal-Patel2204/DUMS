'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import Autocomplete from '@mui/material/Autocomplete';
import IconButton from '@mui/material/IconButton';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';
import DeleteOutlined from '@mui/icons-material/DeleteOutlined';
import { createBillSchema, type CreateBillInput } from '@/lib/validations/bill';
import { createClient } from '@/lib/supabase/client';
import { useAppSelector } from '@/store/hooks';
import type { Customer, Product } from '@/types/database';

const formatCurrency = (n: number) => `₹${n.toLocaleString('en-IN')}`;

export default function CreateBillPage() {
  const router = useRouter();
  const currentStore = useAppSelector((s) => s.auth.currentStore);
  const authLoading = useAppSelector((s) => s.auth.isLoading);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [productsLoading, setProductsLoading] = useState(true);

  const { register, handleSubmit, control, setValue, watch, formState: { errors } } = useForm<CreateBillInput>({
    resolver: zodResolver(createBillSchema) as any,
    defaultValues: { customer_id: '', notes: '', due_date: '', items: [] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const watchItems = watch('items');

  // Fetch customers
  useEffect(() => {
    if (!currentStore?.id) return;
    const supabase = createClient();
    const fetchCustomers = async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('store_id', currentStore.id)
        .eq('is_deleted', false)
        .eq('is_active', true)
        .order('name');
      if (error) {
        console.error('Customers fetch error:', error.message);
      }
      setCustomers((data as Customer[]) || []);
    };
    fetchCustomers();
  }, [currentStore?.id]);

  // Fetch products
  useEffect(() => {
    if (!currentStore?.id) return;
    const supabase = createClient();
    const fetchProducts = async () => {
      setProductsLoading(true);
      // First check: how many products exist for this store
      const { data, error, count } = await supabase
        .from('products')
        .select('*', { count: 'exact' })
        .eq('store_id', currentStore.id)
        .eq('is_deleted', false)
        .eq('is_active', true)
        .order('name');
      if (error) {
        console.error('Products fetch error:', error.message, error);
      } else {
        console.log('Products fetched:', data?.length, 'for store:', currentStore.id);
      }
      setProducts((data as Product[]) || []);
      setProductsLoading(false);
    };
    fetchProducts();
  }, [currentStore?.id]);

  const addProduct = (product: Product) => {
    append({
      product_id: product.id,
      description: product.name,
      quantity: 1,
      unit_price: Number(product.selling_price),
      discount_percent: Number(product.discount_percent),
    });
  };

  // Calculate totals
  const subtotal = watchItems?.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.unit_price)), 0) || 0;
  const totalDiscount = watchItems?.reduce((sum, item) => {
    const line = Number(item.quantity) * Number(item.unit_price);
    return sum + (line * Number(item.discount_percent)) / 100;
  }, 0) || 0;
  const grandTotal = subtotal - totalDiscount;

  const onSubmit = async (data: CreateBillInput) => {
    if (!currentStore?.id) return;
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch(`/api/stores/${currentStore.id}/bills`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: data.customer_id,
          notes: data.notes,
          dueDate: data.due_date,
          items: data.items,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        setError(errData.error || 'Failed to create bill');
        setSubmitting(false);
        return;
      }

      router.push('/store/bills');
    } catch {
      setError('Network error. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>Create Bill</Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {!currentStore && !authLoading && (
        <Alert severity="warning" sx={{ mb: 2 }}>No store found. Please refresh the page.</Alert>
      )}

      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        {/* Customer Selection */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>Customer</Typography>
            <Autocomplete
              options={customers}
              getOptionLabel={(c) => `${c.name} (${c.phone})`}
              value={selectedCustomer}
              onChange={(_, customer) => {
                setSelectedCustomer(customer);
                setValue('customer_id', customer?.id || '');
              }}
              filterOptions={(options, { inputValue }) => {
                if (!inputValue) return options;
                const q = inputValue.toLowerCase();
                return options.filter((c) => c.name.toLowerCase().includes(q) || c.phone.includes(q));
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Search Customer"
                  error={!!errors.customer_id}
                  helperText={errors.customer_id?.message}
                  placeholder="Type name or phone..."
                />
              )}
              renderOption={(props, option) => (
                <li {...props} key={option.id}>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>{option.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{option.phone}</Typography>
                  </Box>
                </li>
              )}
            />

            {selectedCustomer && (
              <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Chip label={`Balance: ${formatCurrency(Number(selectedCustomer.current_balance))}`} color={Number(selectedCustomer.current_balance) > 0 ? 'error' : 'success'} variant="outlined" />
                <Chip label={`Credit Limit: ${formatCurrency(Number(selectedCustomer.credit_limit))}`} variant="outlined" />
                <Chip label={selectedCustomer.phone} variant="outlined" />
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Product Selection */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>Products</Typography>
            <Autocomplete
              options={products}
              getOptionLabel={(p) => `${p.name} - ${formatCurrency(Number(p.selling_price))}/${p.unit}`}
              onChange={(_, product) => {
                if (product) addProduct(product);
              }}
              value={null}
              loading={productsLoading}
              noOptionsText={productsLoading ? 'Loading products...' : 'No products found'}
              filterOptions={(options, { inputValue }) => {
                if (!inputValue) return options;
                const q = inputValue.toLowerCase();
                return options.filter((p) => p.name.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q));
              }}
              renderInput={(params) => (
                <TextField {...params} label="Search & Add Product" placeholder="Type product name or SKU..." />
              )}
              renderOption={(props, option) => (
                <li {...props} key={option.id}>
                  <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>{option.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{option.sku || 'No SKU'} • Stock: {option.stock_quantity} {option.unit}</Typography>
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>{formatCurrency(Number(option.selling_price))}</Typography>
                  </Box>
                </li>
              )}
              blurOnSelect
              clearOnBlur
            />

            {errors.items?.message && (
              <Alert severity="error" sx={{ mt: 1 }}>{errors.items.message}</Alert>
            )}
          </CardContent>
        </Card>

        {/* Items Table */}
        {fields.length > 0 && (
          <Card sx={{ mb: 3 }}>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Product</TableCell>
                    <TableCell align="center" sx={{ width: 100 }}>Qty</TableCell>
                    <TableCell align="center" sx={{ width: 130 }}>Price</TableCell>
                    <TableCell align="center" sx={{ width: 100 }}>Disc %</TableCell>
                    <TableCell align="right" sx={{ width: 120 }}>Total</TableCell>
                    <TableCell align="center" sx={{ width: 50 }}></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {fields.map((field, index) => {
                    const qty = Number(watchItems?.[index]?.quantity || 0);
                    const price = Number(watchItems?.[index]?.unit_price || 0);
                    const disc = Number(watchItems?.[index]?.discount_percent || 0);
                    const lineTotal = qty * price;
                    const lineDisc = (lineTotal * disc) / 100;
                    const itemTotal = lineTotal - lineDisc;

                    return (
                      <TableRow key={field.id}>
                        <TableCell>
                          <Typography variant="body2">{watchItems?.[index]?.description}</Typography>
                        </TableCell>
                        <TableCell>
                          <Controller
                            name={`items.${index}.quantity`}
                            control={control}
                            render={({ field: f }) => (
                              <TextField
                                size="small"
                                type="number"
                                value={f.value}
                                onChange={(e) => f.onChange(Number(e.target.value))}
                                slotProps={{ htmlInput: { min: 0.001, step: 1 } }}
                                sx={{ width: 80 }}
                              />
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          <Controller
                            name={`items.${index}.unit_price`}
                            control={control}
                            render={({ field: f }) => (
                              <TextField
                                size="small"
                                type="number"
                                value={f.value}
                                onChange={(e) => f.onChange(Number(e.target.value))}
                                slotProps={{ htmlInput: { min: 0, step: 0.01 } }}
                                sx={{ width: 110 }}
                              />
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          <Controller
                            name={`items.${index}.discount_percent`}
                            control={control}
                            render={({ field: f }) => (
                              <TextField
                                size="small"
                                type="number"
                                value={f.value}
                                onChange={(e) => f.onChange(Number(e.target.value))}
                                slotProps={{ htmlInput: { min: 0, max: 100, step: 0.5 } }}
                                sx={{ width: 80 }}
                              />
                            )}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>{formatCurrency(itemTotal)}</Typography>
                        </TableCell>
                        <TableCell align="center">
                          <IconButton size="small" color="error" onClick={() => remove(index)}>
                            <DeleteOutlined fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            <Divider />
            <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
              <Typography variant="body2">Subtotal: {formatCurrency(subtotal)}</Typography>
              <Typography variant="body2" color="error.main">Discount: -{formatCurrency(totalDiscount)}</Typography>
              <Typography variant="h6">Grand Total: {formatCurrency(grandTotal)}</Typography>
            </Box>
          </Card>
        )}

        {/* Notes & Due Date */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Due Date (optional)"
                  type="date"
                  {...register('due_date')}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Notes (optional)"
                  multiline
                  rows={2}
                  {...register('notes')}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Submit */}
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button type="submit" variant="contained" size="large" disabled={submitting || fields.length === 0}>
            {submitting ? 'Creating...' : 'Finalize Bill'}
          </Button>
          <Button variant="outlined" size="large" onClick={() => router.back()}>Cancel</Button>
        </Box>
      </Box>
    </Box>
  );
}
