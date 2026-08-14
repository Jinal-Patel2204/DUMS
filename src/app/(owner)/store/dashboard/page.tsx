'use client';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import Alert from '@mui/material/Alert';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Chip from '@mui/material/Chip';
import PeopleOutlined from '@mui/icons-material/PeopleOutlined';
import ShoppingCartOutlined from '@mui/icons-material/ShoppingCartOutlined';
import ReceiptOutlined from '@mui/icons-material/ReceiptOutlined';
import PendingActionsOutlined from '@mui/icons-material/PendingActionsOutlined';
import PersonAddOutlined from '@mui/icons-material/PersonAddOutlined';
import AddOutlined from '@mui/icons-material/AddOutlined';
import PaymentOutlined from '@mui/icons-material/PaymentOutlined';
import { MetricCard } from '@/components/data-display/MetricCard';
import { useAppSelector } from '@/store/hooks';
import { useGetCustomersQuery } from '@/store/api/customersApi';
import { useGetProductsQuery } from '@/store/api/productsApi';
import { useGetBillsQuery } from '@/store/api/billsApi';
import { useGetPaymentsQuery } from '@/store/api/paymentsApi';
import { useRouter } from 'next/navigation';

const formatCurrency = (n: number) => `₹${n.toLocaleString('en-IN')}`;

export default function DashboardPage() {
  const currentStore = useAppSelector((s) => s.auth.currentStore);
  const user = useAppSelector((s) => s.auth.user);
  const router = useRouter();

  const storeId = currentStore?.id ?? '';

  // Fetch data from Java backend APIs
  const {
    data: customersData,
    isLoading: customersLoading,
    isError: customersError,
  } = useGetCustomersQuery({ storeId }, { skip: !storeId });

  const {
    data: products,
    isLoading: productsLoading,
    isError: productsError,
  } = useGetProductsQuery({ storeId }, { skip: !storeId });

  const {
    data: bills,
    isLoading: billsLoading,
    isError: billsError,
  } = useGetBillsQuery({ storeId }, { skip: !storeId });

  const {
    data: payments,
    isLoading: paymentsLoading,
    isError: paymentsError,
  } = useGetPaymentsQuery({ storeId }, { skip: !storeId });

  const isLoading = customersLoading || productsLoading || billsLoading || paymentsLoading;
  const hasError = customersError || productsError || billsError || paymentsError;

  // Compute metrics
  const totalCustomers = customersData?.total ?? 0;
  const totalProducts = products?.length ?? 0;
  const totalBills = bills?.length ?? 0;
  const pendingPayments = payments?.filter((p) => p.status === 'pending') ?? [];
  const pendingCount = pendingPayments.length;

  // Recent payments (last 5, sorted by createdAt desc)
  const recentPayments = [...(payments ?? [])]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  if (!storeId) {
    return (
      <Box>
        <Typography variant="h5" sx={{ mb: 3 }}>Dashboard</Typography>
        <Alert severity="warning">No store found. Please sign up again or contact support.</Alert>
      </Box>
    );
  }

  if (hasError) {
    return (
      <Box>
        <Typography variant="h5" sx={{ mb: 3 }}>Dashboard</Typography>
        <Alert severity="error" action={<Button onClick={() => window.location.reload()}>Retry</Button>}>
          Failed to load dashboard data. Make sure the backend is running.
        </Alert>
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box>
        <Box sx={{ mb: 3 }}>
          <Skeleton variant="text" width={200} height={32} />
          <Skeleton variant="text" width={140} height={20} />
        </Box>
        <Grid container spacing={2}>
          {[...Array(4)].map((_, i) => (
            <Grid key={i} size={{ xs: 12, sm: 6, md: 3 }}>
              <Skeleton variant="rounded" height={120} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  return (
    <Box>
      {/* Page Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>
          Welcome back{user?.full_name ? `, ${user.full_name.split(' ')[0]}` : ''}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
          Here&apos;s a quick overview of your store.
        </Typography>
      </Box>

      {/* Metric Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard
            title="Total Customers"
            value={totalCustomers}
            icon={<PeopleOutlined sx={{ fontSize: 20 }} />}
            color="#3B82F6"
            subtitle="active accounts"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard
            title="Total Products"
            value={totalProducts}
            icon={<ShoppingCartOutlined sx={{ fontSize: 20 }} />}
            color="#8B5CF6"
            subtitle="in catalog"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard
            title="Total Bills"
            value={totalBills}
            icon={<ReceiptOutlined sx={{ fontSize: 20 }} />}
            color="#10B981"
            subtitle="all time"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard
            title="Pending Payments"
            value={pendingCount}
            icon={<PendingActionsOutlined sx={{ fontSize: 20 }} />}
            color="#F59E0B"
            subtitle="awaiting verification"
          />
        </Grid>
      </Grid>

      <Grid container spacing={2.5}>
        {/* Recent Payments */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                Recent Payments
              </Typography>
              {recentPayments.length === 0 ? (
                <Typography color="text.secondary" variant="body2">
                  No payments recorded yet.
                </Typography>
              ) : (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Method</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentPayments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>
                          {new Date(payment.createdAt).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>
                          {formatCurrency(payment.amount)}
                        </TableCell>
                        <TableCell sx={{ textTransform: 'capitalize' }}>
                          {payment.method}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={payment.status}
                            size="small"
                            color={
                              payment.status === 'verified'
                                ? 'success'
                                : payment.status === 'pending'
                                  ? 'warning'
                                  : 'default'
                            }
                            sx={{ textTransform: 'capitalize', fontSize: '0.7rem' }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Actions */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                Quick Actions
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<PersonAddOutlined />}
                  onClick={() => router.push('/store/customers')}
                  sx={{ justifyContent: 'flex-start' }}
                >
                  Add Customer
                </Button>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<AddOutlined />}
                  onClick={() => router.push('/store/bills/new')}
                  sx={{ justifyContent: 'flex-start' }}
                >
                  Create Bill
                </Button>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<PaymentOutlined />}
                  onClick={() => router.push('/store/payments')}
                  sx={{ justifyContent: 'flex-start' }}
                >
                  Record Payment
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
