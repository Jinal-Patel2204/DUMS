'use client';

import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import AccountBalanceWalletOutlined from '@mui/icons-material/AccountBalanceWalletOutlined';
import TrendingUpOutlined from '@mui/icons-material/TrendingUpOutlined';
import CalendarTodayOutlined from '@mui/icons-material/CalendarTodayOutlined';
import InventoryOutlined from '@mui/icons-material/InventoryOutlined';
import PeopleOutlined from '@mui/icons-material/PeopleOutlined';
import ShoppingCartOutlined from '@mui/icons-material/ShoppingCartOutlined';
import ReceiptOutlined from '@mui/icons-material/ReceiptOutlined';
import PendingActionsOutlined from '@mui/icons-material/PendingActionsOutlined';
import ReportProblemOutlined from '@mui/icons-material/ReportProblemOutlined';
import RefreshOutlined from '@mui/icons-material/RefreshOutlined';
import AddOutlined from '@mui/icons-material/AddOutlined';
import ArrowForwardOutlined from '@mui/icons-material/ArrowForwardOutlined';
import { MetricCard } from '@/components/data-display/MetricCard';
import { useAppSelector } from '@/store/hooks';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
} from 'recharts';
import { format, subDays, startOfMonth } from 'date-fns';
import { tokens } from '@/theme';

const formatCurrency = (n: number) => `₹${n.toLocaleString('en-IN')}`;

interface DashboardMetrics {
  totalCustomers: number;
  totalProducts: number;
  totalOutstanding: number;
  todaysCollection: number;
  monthlyCollection: number;
  monthlySales: number;
  monthlyProfit: number;
  pendingVerifications: number;
  overdueCustomers: number;
  lowStockProducts: number;
}

interface ChartData {
  dailySales: { date: string; amount: number }[];
  dailyCollection: { date: string; amount: number }[];
  topCustomers: { name: string; outstanding: number }[];
  topProducts: { name: string; quantity: number }[];
}

export default function DashboardPage() {
  const currentStore = useAppSelector((s) => s.auth.currentStore);
  const user = useAppSelector((s) => s.auth.user);
  const isLoading = useAppSelector((s) => s.auth.isLoading);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [charts, setCharts] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const fetchDashboard = async () => {
      const supabase = createClient();
      try {
        let storeId = currentStore?.id;
        if (!storeId && user?.id) {
          const { data: stores } = await supabase
            .from('stores').select('id').eq('owner_id', user.id).eq('is_deleted', false).limit(1);
          if (stores && stores.length > 0) storeId = stores[0].id;
        }
        if (!storeId) { setError('no_store'); setLoading(false); return; }

        const today = new Date().toISOString().split('T')[0];
        const monthStart = startOfMonth(new Date()).toISOString().split('T')[0];
        const thirtyDaysAgo = subDays(new Date(), 30).toISOString().split('T')[0];

        // Customers
        const { data: customers } = await supabase
          .from('customers').select('name, current_balance').eq('store_id', storeId).eq('is_deleted', false);
        const totalCustomers = customers?.length ?? 0;
        const totalOutstanding = customers?.reduce((sum, c) => sum + Number(c.current_balance), 0) ?? 0;

        // Overdue customers (bills overdue)
        const { data: overdueBills } = await supabase
          .from('bills').select('customer_id').eq('store_id', storeId).eq('status', 'overdue').eq('is_deleted', false);
        const overdueCustomers = new Set(overdueBills?.map(b => b.customer_id)).size;

        // Products
        const { count: totalProducts } = await supabase
          .from('products').select('*', { count: 'exact', head: true }).eq('store_id', storeId).eq('is_deleted', false).eq('is_active', true);

        // Low stock
        const { count: lowStockProducts } = await supabase
          .from('products').select('*', { count: 'exact', head: true }).eq('store_id', storeId).eq('is_deleted', false).eq('is_active', true).lte('stock_quantity', 5);

        // Today's collection
        const { data: todayPayments } = await supabase
          .from('payments').select('amount').eq('store_id', storeId).eq('status', 'verified').gte('verified_at', `${today}T00:00:00`);
        const todaysCollection = todayPayments?.reduce((sum, p) => sum + Number(p.amount), 0) ?? 0;

        // Monthly collection
        const { data: monthPayments } = await supabase
          .from('payments').select('amount').eq('store_id', storeId).eq('status', 'verified').gte('verified_at', `${monthStart}T00:00:00`);
        const monthlyCollection = monthPayments?.reduce((sum, p) => sum + Number(p.amount), 0) ?? 0;

        // Monthly sales (from bills finalized this month)
        const { data: monthBills } = await supabase
          .from('bills').select('total_amount, subtotal, discount_amount').eq('store_id', storeId).eq('is_deleted', false).neq('status', 'cancelled').gte('created_at', `${monthStart}T00:00:00`);
        const monthlySales = monthBills?.reduce((sum, b) => sum + Number(b.total_amount), 0) ?? 0;

        // Monthly profit (from bill_items this month)
        const { data: monthBillIds } = await supabase
          .from('bills').select('id').eq('store_id', storeId).eq('is_deleted', false).neq('status', 'cancelled').gte('created_at', `${monthStart}T00:00:00`);
        let monthlyProfit = 0;
        if (monthBillIds && monthBillIds.length > 0) {
          const ids = monthBillIds.map(b => b.id);
          const { data: billItems } = await supabase
            .from('bill_items').select('product_id, quantity, unit_price, total_price').in('bill_id', ids);
          if (billItems) {
            const productIds = [...new Set(billItems.map(i => i.product_id).filter(Boolean))];
            const { data: prods } = await supabase
              .from('products').select('id, purchase_price').in('id', productIds as string[]);
            const purchaseMap = new Map(prods?.map(p => [p.id, Number(p.purchase_price)]) || []);
            monthlyProfit = billItems.reduce((sum, item) => {
              const cost = (purchaseMap.get(item.product_id!) || 0) * Number(item.quantity);
              return sum + (Number(item.total_price) - cost);
            }, 0);
          }
        }

        // Pending verifications
        const { count: pendingVerifications } = await supabase
          .from('payments').select('*', { count: 'exact', head: true }).eq('store_id', storeId).eq('status', 'pending');

        setMetrics({
          totalCustomers,
          totalProducts: totalProducts ?? 0,
          totalOutstanding,
          todaysCollection,
          monthlyCollection,
          monthlySales,
          monthlyProfit,
          pendingVerifications: pendingVerifications ?? 0,
          overdueCustomers,
          lowStockProducts: lowStockProducts ?? 0,
        });

        // Charts data
        const { data: dailyBills } = await supabase
          .from('bills').select('total_amount, created_at').eq('store_id', storeId).eq('is_deleted', false).neq('status', 'cancelled').gte('created_at', `${thirtyDaysAgo}T00:00:00`).order('created_at');

        const salesByDay = new Map<string, number>();
        dailyBills?.forEach(b => {
          const d = format(new Date(b.created_at), 'dd MMM');
          salesByDay.set(d, (salesByDay.get(d) || 0) + Number(b.total_amount));
        });
        const dailySales = Array.from(salesByDay.entries()).map(([date, amount]) => ({ date, amount }));

        const { data: dailyPayments } = await supabase
          .from('payments').select('amount, verified_at').eq('store_id', storeId).eq('status', 'verified').gte('verified_at', `${thirtyDaysAgo}T00:00:00`).order('verified_at');

        const collByDay = new Map<string, number>();
        dailyPayments?.forEach(p => {
          if (p.verified_at) {
            const d = format(new Date(p.verified_at), 'dd MMM');
            collByDay.set(d, (collByDay.get(d) || 0) + Number(p.amount));
          }
        });
        const dailyCollection = Array.from(collByDay.entries()).map(([date, amount]) => ({ date, amount }));

        const topCustomers = (customers ?? [])
          .filter(c => Number(c.current_balance) > 0)
          .sort((a, b) => Number(b.current_balance) - Number(a.current_balance))
          .slice(0, 5)
          .map(c => ({ name: c.name, outstanding: Number(c.current_balance) }));

        let topProducts: { name: string; quantity: number }[] = [];
        const { data: allBillIds } = await supabase
          .from('bills').select('id').eq('store_id', storeId).eq('is_deleted', false).neq('status', 'cancelled').gte('created_at', `${monthStart}T00:00:00`);
        if (allBillIds && allBillIds.length > 0) {
          const { data: allItems } = await supabase
            .from('bill_items').select('description, quantity').in('bill_id', allBillIds.map(b => b.id));
          if (allItems) {
            const prodMap = new Map<string, number>();
            allItems.forEach(i => {
              prodMap.set(i.description, (prodMap.get(i.description) || 0) + Number(i.quantity));
            });
            topProducts = Array.from(prodMap.entries())
              .sort((a, b) => b[1] - a[1])
              .slice(0, 5)
              .map(([name, quantity]) => ({ name, quantity }));
          }
        }

        setCharts({ dailySales, dailyCollection, topCustomers, topProducts });
      } catch (err) {
        console.error('Dashboard error:', err);
        setError('fetch_error');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [isLoading, currentStore?.id, user?.id]);

  if (!isLoading && error === 'no_store') {
    return (
      <Box>
        <Typography variant="h5" sx={{ mb: 3 }}>Dashboard</Typography>
        <Alert severity="warning">No store found. Please sign up again or contact support.</Alert>
      </Box>
    );
  }

  if (error === 'fetch_error') {
    return (
      <Box>
        <Typography variant="h5" sx={{ mb: 3 }}>Dashboard</Typography>
        <Alert severity="error" action={<Button onClick={() => window.location.reload()}>Retry</Button>}>
          Failed to load dashboard data.
        </Alert>
      </Box>
    );
  }

  if (loading || !metrics) {
    return (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Skeleton variant="text" width={200} height={32} />
            <Skeleton variant="text" width={140} height={20} />
          </Box>
        </Box>
        <Grid container spacing={2}>
          {[...Array(8)].map((_, i) => (
            <Grid key={i} size={{ xs: 12, sm: 6, md: 3 }}>
              <Skeleton variant="rounded" height={120} />
            </Grid>
          ))}
        </Grid>
        <Grid container spacing={2.5} sx={{ mt: 2 }}>
          <Grid size={{ xs: 12, md: 6 }}><Skeleton variant="rounded" height={300} /></Grid>
          <Grid size={{ xs: 12, md: 6 }}><Skeleton variant="rounded" height={300} /></Grid>
        </Grid>
      </Box>
    );
  }

  return (
    <Box>
      {/* Page Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>
            Welcome back{user?.full_name ? `, ${user.full_name.split(' ')[0]}` : ''}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
            Here&apos;s what&apos;s happening with your store today.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Refresh data">
            <IconButton size="small" onClick={() => window.location.reload()} sx={{ border: '1px solid', borderColor: 'divider' }}>
              <RefreshOutlined sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            size="small"
            startIcon={<AddOutlined />}
            onClick={() => router.push('/store/bills/new')}
          >
            New Bill
          </Button>
        </Box>
      </Box>

      {/* Alerts Row */}
      {(metrics.pendingVerifications > 0 || metrics.overdueCustomers > 0 || metrics.lowStockProducts > 0) && (
        <Box sx={{ display: 'flex', gap: 1.5, mb: 3, flexWrap: 'wrap' }}>
          {metrics.pendingVerifications > 0 && (
            <Chip
              icon={<PendingActionsOutlined sx={{ fontSize: 16 }} />}
              label={`${metrics.pendingVerifications} payment${metrics.pendingVerifications > 1 ? 's' : ''} pending verification`}
              color="warning"
              size="small"
              onClick={() => router.push('/store/payments?status=pending')}
              sx={{ cursor: 'pointer' }}
            />
          )}
          {metrics.overdueCustomers > 0 && (
            <Chip
              icon={<ReportProblemOutlined sx={{ fontSize: 16 }} />}
              label={`${metrics.overdueCustomers} customer${metrics.overdueCustomers > 1 ? 's' : ''} overdue`}
              color="error"
              size="small"
              onClick={() => router.push('/store/customers')}
              sx={{ cursor: 'pointer' }}
            />
          )}
          {metrics.lowStockProducts > 0 && (
            <Chip
              icon={<InventoryOutlined sx={{ fontSize: 16 }} />}
              label={`${metrics.lowStockProducts} product${metrics.lowStockProducts > 1 ? 's' : ''} low stock`}
              color="info"
              size="small"
              onClick={() => router.push('/store/products')}
              sx={{ cursor: 'pointer' }}
            />
          )}
        </Box>
      )}

      {/* KPI Cards - Two rows */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard
            title="Monthly Revenue"
            value={formatCurrency(metrics.monthlySales)}
            icon={<ReceiptOutlined sx={{ fontSize: 20 }} />}
            color={tokens.chart.primary}
            subtitle="this month"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard
            title="Monthly Profit"
            value={formatCurrency(metrics.monthlyProfit)}
            icon={<TrendingUpOutlined sx={{ fontSize: 20 }} />}
            color="#10B981"
            subtitle="this month"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard
            title="Outstanding"
            value={formatCurrency(metrics.totalOutstanding)}
            icon={<AccountBalanceWalletOutlined sx={{ fontSize: 20 }} />}
            color="#EF4444"
            subtitle="total receivable"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard
            title="Today's Collection"
            value={formatCurrency(metrics.todaysCollection)}
            icon={<CalendarTodayOutlined sx={{ fontSize: 20 }} />}
            color="#F59E0B"
            subtitle="collected today"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard
            title="Monthly Collection"
            value={formatCurrency(metrics.monthlyCollection)}
            icon={<AccountBalanceWalletOutlined sx={{ fontSize: 20 }} />}
            color="#14B8A6"
            subtitle="this month"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard
            title="Customers"
            value={metrics.totalCustomers}
            icon={<PeopleOutlined sx={{ fontSize: 20 }} />}
            color="#3B82F6"
            subtitle="active accounts"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard
            title="Products"
            value={metrics.totalProducts}
            icon={<ShoppingCartOutlined sx={{ fontSize: 20 }} />}
            color="#8B5CF6"
            subtitle="in catalog"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard
            title="Pending Payments"
            value={metrics.pendingVerifications}
            icon={<PendingActionsOutlined sx={{ fontSize: 20 }} />}
            color="#F59E0B"
            subtitle="awaiting review"
          />
        </Grid>
      </Grid>

      {/* Charts */}
      {charts && (
        <Grid container spacing={2.5}>
          {/* Revenue Trend */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Revenue Trend</Typography>
                    <Typography variant="caption" color="text.secondary">Last 30 days</Typography>
                  </Box>
                  <Chip label="Sales" size="small" sx={{ bgcolor: `${tokens.chart.primary}15`, color: tokens.chart.primary, fontWeight: 500 }} />
                </Box>
                {charts.dailySales.length === 0 ? (
                  <Box sx={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography color="text.secondary" variant="body2">No sales data yet</Typography>
                  </Box>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={charts.dailySales}>
                      <defs>
                        <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={tokens.chart.primary} stopOpacity={0.2} />
                          <stop offset="100%" stopColor={tokens.chart.primary} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                      <XAxis dataKey="date" fontSize={11} stroke="#94A3B8" axisLine={false} tickLine={false} />
                      <YAxis fontSize={11} stroke="#94A3B8" axisLine={false} tickLine={false} />
                      <RechartsTooltip
                        formatter={(v: any) => [formatCurrency(Number(v)), 'Sales']}
                        contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                      />
                      <Area type="monotone" dataKey="amount" stroke={tokens.chart.primary} strokeWidth={2} fill="url(#salesGradient)" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Collection Trend */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Collection Trend</Typography>
                    <Typography variant="caption" color="text.secondary">Last 30 days</Typography>
                  </Box>
                  <Chip label="Payments" size="small" sx={{ bgcolor: `${tokens.chart.secondary}15`, color: tokens.chart.secondary, fontWeight: 500 }} />
                </Box>
                {charts.dailyCollection.length === 0 ? (
                  <Box sx={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography color="text.secondary" variant="body2">No collection data yet</Typography>
                  </Box>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={charts.dailyCollection}>
                      <defs>
                        <linearGradient id="collGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={tokens.chart.secondary} stopOpacity={0.2} />
                          <stop offset="100%" stopColor={tokens.chart.secondary} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                      <XAxis dataKey="date" fontSize={11} stroke="#94A3B8" axisLine={false} tickLine={false} />
                      <YAxis fontSize={11} stroke="#94A3B8" axisLine={false} tickLine={false} />
                      <RechartsTooltip
                        formatter={(v: any) => [formatCurrency(Number(v)), 'Collection']}
                        contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                      />
                      <Area type="monotone" dataKey="amount" stroke={tokens.chart.secondary} strokeWidth={2} fill="url(#collGradient)" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Top Customers By Outstanding */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Top Receivables</Typography>
                    <Typography variant="caption" color="text.secondary">By outstanding balance</Typography>
                  </Box>
                  <Button
                    size="small"
                    endIcon={<ArrowForwardOutlined sx={{ fontSize: 14 }} />}
                    onClick={() => router.push('/store/customers')}
                    sx={{ fontSize: '0.75rem' }}
                  >
                    View all
                  </Button>
                </Box>
                {charts.topCustomers.length === 0 ? (
                  <Box sx={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography color="text.secondary" variant="body2">No outstanding balances</Typography>
                  </Box>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={charts.topCustomers} layout="vertical" barSize={20}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
                      <XAxis type="number" fontSize={11} stroke="#94A3B8" axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="name" fontSize={11} stroke="#94A3B8" width={100} axisLine={false} tickLine={false} />
                      <RechartsTooltip
                        formatter={(v: any) => [formatCurrency(Number(v)), 'Outstanding']}
                        contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                      />
                      <Bar dataKey="outstanding" fill={tokens.chart.quaternary} radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Top Selling Products */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Top Products</Typography>
                    <Typography variant="caption" color="text.secondary">By quantity sold this month</Typography>
                  </Box>
                  <Button
                    size="small"
                    endIcon={<ArrowForwardOutlined sx={{ fontSize: 14 }} />}
                    onClick={() => router.push('/store/products')}
                    sx={{ fontSize: '0.75rem' }}
                  >
                    View all
                  </Button>
                </Box>
                {charts.topProducts.length === 0 ? (
                  <Box sx={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography color="text.secondary" variant="body2">No sales this month</Typography>
                  </Box>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={charts.topProducts} layout="vertical" barSize={20}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
                      <XAxis type="number" fontSize={11} stroke="#94A3B8" axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="name" fontSize={11} stroke="#94A3B8" width={120} axisLine={false} tickLine={false} />
                      <RechartsTooltip
                        contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                      />
                      <Bar dataKey="quantity" fill={tokens.chart.quinary} name="Qty Sold" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
}
