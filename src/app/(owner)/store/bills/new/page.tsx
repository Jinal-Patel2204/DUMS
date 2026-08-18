'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
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
import PersonOutlined from '@mui/icons-material/PersonOutlined';
import ShoppingCartOutlined from '@mui/icons-material/ShoppingCartOutlined';
import AddOutlined from '@mui/icons-material/AddOutlined';
import ReceiptOutlined from '@mui/icons-material/ReceiptOutlined';
import { createBillSchema, type CreateBillInput } from '@/lib/validations/bill';
import { useAppSelector } from '@/store/hooks';
import { useGetCustomersQuery } from '@/store/api/customersApi';
import { useGetProductsQuery } from '@/store/api/productsApi';
import { useCreateBillMutation } from '@/store/api/billsApi';
import { FormShell } from '@/components/layout/FormShell';

const fmt = (n: number) => `₹ ${n.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

function numberToWords(num: number): string {
  if (num === 0) return 'Zero Rupees Only';
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const n = Math.floor(num);
  if (n < 20) return `${ones[n]} Rupees Only`;
  if (n < 100) return `${tens[Math.floor(n / 10)]} ${ones[n % 10]} Rupees Only`.trim();
  if (n < 1000) return `${ones[Math.floor(n / 100)]} Hundred ${numberToWords(n % 100).replace(' Rupees Only', '')} Rupees Only`.trim();
  if (n < 100000) return `${numberToWords(Math.floor(n / 1000)).replace(' Rupees Only', '')} Thousand ${numberToWords(n % 1000).replace(' Rupees Only', '')} Rupees Only`.trim();
  return `${numberToWords(Math.floor(n / 100000)).replace(' Rupees Only', '')} Lakh ${numberToWords(n % 100000).replace(' Rupees Only', '')} Rupees Only`.trim();
}

export default function CreateBillPage() {
  const router = useRouter();
  const currentStore = useAppSelector((s) => s.auth.currentStore);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  const { data: customersData } = useGetCustomersQuery(
    { storeId: currentStore?.id ?? '', pageSize: 100 },
    { skip: !currentStore?.id }
  );
  const { data: productsData, isLoading: productsLoading } = useGetProductsQuery(
    { storeId: currentStore?.id ?? '' },
    { skip: !currentStore?.id }
  );
  const [createBillApi] = useCreateBillMutation();

  const customers = customersData?.data ?? [];
  const products = productsData ?? [];

  const { register, handleSubmit, control, setValue, watch, formState: { errors } } = useForm<CreateBillInput>({
    resolver: zodResolver(createBillSchema) as any,
    defaultValues: { customer_id: '', notes: '', due_date: '', items: [] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const watchItems = watch('items');

  const addProduct = (product: any) => {
    append({ product_id: product.id, description: product.name, quantity: 1, unit_price: Number(product.sellingPrice), discount_percent: Number(product.discountPercent) });
  };

  const subtotal = watchItems?.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.unit_price)), 0) || 0;
  const totalDiscount = watchItems?.reduce((sum, item) => {
    const line = Number(item.quantity) * Number(item.unit_price);
    return sum + (line * Number(item.discount_percent)) / 100;
  }, 0) || 0;
  const grandTotal = subtotal - totalDiscount;

  const onSubmit = async (data: CreateBillInput) => {
    if (!currentStore?.id) return;
    setSubmitting(true); setError('');
    try {
      await createBillApi({
        storeId: currentStore.id, customerId: data.customer_id,
        notes: data.notes || undefined, dueDate: data.due_date || undefined,
        subtotal, discountAmount: totalDiscount, totalAmount: grandTotal,
      }).unwrap();
      router.push('/store/bills');
    } catch (err: any) {
      setError(err?.data?.error || 'Failed to create bill');
      setSubmitting(false);
    }
  };

  return (
    <FormShell
      title="Create Bill"
      subtitle="Create a new bill for your customer."
      error={error}
      onSubmit={handleSubmit(onSubmit)}
      onCancel={() => router.back()}
      submitLabel="Finalize Bill"
      isSubmitting={submitting || fields.length === 0}
      sections={[
        {
          title: 'Customer',
          icon: <PersonOutlined />,
          content: (
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>Customer *</Typography>
                <Autocomplete
                  options={customers}
                  getOptionLabel={(c: any) => `${c.name} (${c.phone})`}
                  value={selectedCustomer}
                  onChange={(_, customer) => { setSelectedCustomer(customer); setValue('customer_id', customer?.id || ''); }}
                  filterOptions={(options, { inputValue }) => {
                    if (!inputValue) return options;
                    const q = inputValue.toLowerCase();
                    return options.filter((c: any) => c.name.toLowerCase().includes(q) || c.phone.includes(q));
                  }}
                  renderInput={(params) => (
                    <TextField {...params} placeholder="Search and select customer" error={!!errors.customer_id} helperText={errors.customer_id?.message} />
                  )}
                  renderOption={(props, option: any) => (
                    <li {...props} key={option.id}>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>{option.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{option.phone}</Typography>
                      </Box>
                    </li>
                  )}
                />
              </Box>
              <Button
                variant="outlined"
                size="small"
                startIcon={<AddOutlined />}
                onClick={() => router.push('/store/customers/new')}
                sx={{ textTransform: 'none', fontWeight: 500, mt: 3, whiteSpace: 'nowrap', borderColor: 'divider', color: 'text.secondary' }}
              >
                Add New Customer
              </Button>
            </Box>
          ),
        },
        {
          title: 'Products',
          icon: <ShoppingCartOutlined />,
          content: (
            <>
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <Autocomplete
                  sx={{ flex: 1 }}
                  options={products}
                  getOptionLabel={(p: any) => `${p.name} - ${fmt(Number(p.sellingPrice))}`}
                  onChange={(_, product) => { if (product) addProduct(product); }}
                  value={null}
                  loading={productsLoading}
                  noOptionsText={productsLoading ? 'Loading...' : 'No products found'}
                  filterOptions={(options, { inputValue }) => {
                    if (!inputValue) return options;
                    const q = inputValue.toLowerCase();
                    return options.filter((p: any) => p.name.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q));
                  }}
                  renderInput={(params) => <TextField {...params} placeholder="Search & Add Product by name / code" />}
                  renderOption={(props, option: any) => (
                    <li {...props} key={option.id}>
                      <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between' }}>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>{option.name}</Typography>
                          <Typography variant="caption" color="text.secondary">{option.sku || 'No SKU'} • Stock: {option.stockQuantity}</Typography>
                        </Box>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>{fmt(Number(option.sellingPrice))}</Typography>
                      </Box>
                    </li>
                  )}
                  blurOnSelect clearOnBlur
                />
                <Button variant="outlined" size="small" startIcon={<AddOutlined />}
                  onClick={() => router.push('/store/products/new')}
                  sx={{ textTransform: 'none', fontWeight: 500, whiteSpace: 'nowrap', borderColor: 'divider', color: 'text.secondary' }}>
                  Add Product
                </Button>
              </Box>

              {errors.items?.message && <Alert severity="error" sx={{ mb: 1 }}>{errors.items.message}</Alert>}

              {/* Items Table */}
              <TableContainer sx={{ border: 1, borderColor: 'divider', borderRadius: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>#</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>PRODUCT</TableCell>
                      <TableCell sx={{ fontWeight: 600 }} align="right">PRICE</TableCell>
                      <TableCell sx={{ fontWeight: 600 }} align="center">QTY</TableCell>
                      <TableCell sx={{ fontWeight: 600 }} align="center">DISCOUNT</TableCell>
                      <TableCell sx={{ fontWeight: 600 }} align="center">TAX (%)</TableCell>
                      <TableCell sx={{ fontWeight: 600 }} align="right">TOTAL</TableCell>
                      <TableCell sx={{ fontWeight: 600 }} align="center">ACTIONS</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {fields.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} sx={{ py: 6, textAlign: 'center' }}>
                          <Box sx={{ color: 'text.disabled', mb: 1 }}>📦</Box>
                          <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>
                            No products added yet
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Search and add products to the bill.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      fields.map((field, index) => {
                        const qty = Number(watchItems?.[index]?.quantity || 0);
                        const price = Number(watchItems?.[index]?.unit_price || 0);
                        const disc = Number(watchItems?.[index]?.discount_percent || 0);
                        const itemTotal = qty * price * (1 - disc / 100);
                        return (
                          <TableRow key={field.id}>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell><Typography variant="body2" sx={{ fontWeight: 500 }}>{watchItems?.[index]?.description}</Typography></TableCell>
                            <TableCell align="right">
                              <Controller name={`items.${index}.unit_price`} control={control} render={({ field: f }) => (
                                <TextField size="small" type="number" value={f.value} onChange={(e) => f.onChange(Number(e.target.value))} sx={{ width: 90 }} />
                              )} />
                            </TableCell>
                            <TableCell align="center">
                              <Controller name={`items.${index}.quantity`} control={control} render={({ field: f }) => (
                                <TextField size="small" type="number" value={f.value} onChange={(e) => f.onChange(Number(e.target.value))} sx={{ width: 60 }} />
                              )} />
                            </TableCell>
                            <TableCell align="center">
                              <Controller name={`items.${index}.discount_percent`} control={control} render={({ field: f }) => (
                                <TextField size="small" type="number" value={f.value} onChange={(e) => f.onChange(Number(e.target.value))} sx={{ width: 60 }} />
                              )} />
                            </TableCell>
                            <TableCell align="center">
                              <Typography variant="body2" color="text.secondary">0%</Typography>
                            </TableCell>
                            <TableCell align="right"><Typography variant="body2" sx={{ fontWeight: 600 }}>{fmt(itemTotal)}</Typography></TableCell>
                            <TableCell align="center">
                              <IconButton size="small" color="error" onClick={() => remove(index)}><DeleteOutlined sx={{ fontSize: 16 }} /></IconButton>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          ),
        },
        {
          title: 'Additional Details',
          icon: <ReceiptOutlined />,
          content: (
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth label="Due Date (optional)" type="date" {...register('due_date')} slotProps={{ inputLabel: { shrink: true } }} placeholder="dd-mm-yyyy" />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth label="Notes (optional)" placeholder="Add any notes or terms for this bill" multiline rows={2} {...register('notes')} />
              </Grid>
            </Grid>
          ),
        },
      ]}
      preview={
        <>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Box sx={{ width: 28, height: 28, borderRadius: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'secondary.main', color: 'white' }}>
              <ReceiptOutlined sx={{ fontSize: 16 }} />
            </Box>
            <Typography sx={{ fontWeight: 700, fontSize: '1rem' }}>Bill Summary</Typography>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>Subtotal</Typography>
              <Typography sx={{ fontSize: '0.875rem', fontWeight: 500 }}>{fmt(subtotal)}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>Discount</Typography>
              <Typography sx={{ fontSize: '0.875rem', fontWeight: 500, color: 'error.main' }}>- {fmt(totalDiscount)}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>Tax</Typography>
              <Typography sx={{ fontSize: '0.875rem', fontWeight: 500, color: 'success.main' }}>+ {fmt(0)}</Typography>
            </Box>

            <Divider sx={{ my: 1 }} />

            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography sx={{ fontSize: '1rem', fontWeight: 700 }}>Total Amount</Typography>
              <Typography sx={{ fontSize: '1.125rem', fontWeight: 700 }}>{fmt(grandTotal)}</Typography>
            </Box>
          </Box>

          {/* Amount in Words */}
          <Box sx={{ mt: 2, p: 1.5, bgcolor: 'background.default', borderRadius: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.25 }}>Amount in Words</Typography>
            <Typography variant="body2" sx={{ fontWeight: 500, fontStyle: 'italic' }}>
              {numberToWords(grandTotal)}
            </Typography>
          </Box>
        </>
      }
    />
  );
}
