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
import AccountBalanceWalletOutlined from '@mui/icons-material/AccountBalanceWalletOutlined';
import TrendingUpOutlined from '@mui/icons-material/TrendingUpOutlined';
import CalendarTodayOutlined from '@mui/icons-material/CalendarTodayOutlined';
import WarningAmberOutlined from '@mui/icons-material/WarningAmberOutlined';
import InventoryOutlined from '@mui/icons-material/InventoryOutlined';
import PeopleOutlined from '@mui/icons-material/PeopleOutlined';
import ShoppingCartOutlined from '@mui/icons-material/ShoppingCartOutlined';
import ReceiptOutlined from '@mui/icons-material/ReceiptOutlined';
import PendingActionsOutlined from '@mui/icons-material/PendingActionsOutlined';
import ReportProblemOutlined from '@mui/icons-material/ReportProblemOutlined';
import { MetricCard } from '@/components/data-display/MetricCard';
import { useAppSelector } from '@/store/hooks';
import { createClient } from '@/lib/supabase/client';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';

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
        // Daily sales (last 30 days)
        const { data: dailyBills } = await supabase
          .from('bills').select('total_amount, created_at').eq('store_id', storeId).eq('is_deleted', false).neq('status', 'cancelled').gte('created_at', `${thirtyDaysAgo}T00:00:00`).order('created_at');

        const salesByDay = new Map<string, number>();
        dailyBills?.forEach(b => {
          const d = format(new Date(b.created_at), 'dd MMM');
          salesByDay.set(d, (salesByDay.get(d) || 0) + Number(b.total_amount));
        });
        const dailySales = Array.from(salesByDay.entries()).map(([date, amount]) => ({ date, amount }));

        // Daily collection (last 30 days)
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

        // Top customers by outstanding
        const topCustomers = (customers ?? [])
          .filter(c => Number(c.current_balance) > 0)
          .sort((a, b) => Number(b.current_balance) - Number(a.current_balance))
          .slice(0, 5)
          .map(c => ({ name: c.name, outstanding: Number(c.current_balance) }));

        // Top selling products
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
        <Typography variant="h5" sx={{ mb: 3 }}>Dashboard</Typography>
        <Grid container spacing={2.5}>
          {[...Array(10)].map((_, i) => (
            <Grid key={i} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
              <Skeleton variant="rounded" height={100} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>Dashboard</Typography>

      {/* Metric Cards */}
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
          <MetricCard title="Total Customers" value={metrics.totalCustomers} icon={<PeopleOutlined />} color="#1976d2" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
          <MetricCard title="Total Products" value={metrics.totalProducts} icon={<ShoppingCartOutlined />} color="#9c27b0" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
          <MetricCard title="Total Outstanding" value={formatCurrency(metrics.totalOutstanding)} icon={<AccountBalanceWalletOutlined />} color="#d32f2f" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
          <MetricCard title="Today's Collection" value={formatCurrency(metrics.todaysCollection)} icon={<TrendingUpOutlined />} color="#2e7d32" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
          <MetricCard title="Monthly Collection" value={formatCurrency(metrics.monthlyCollection)} icon={<CalendarTodayOutlined />} color="#0288d1" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
          <MetricCard title="Monthly Sales" value={formatCurrency(metrics.monthlySales)} icon={<ReceiptOutlined />} color="#7b1fa2" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
          <MetricCard title="Monthly Profit" value={formatCurrency(metrics.monthlyProfit)} icon={<TrendingUpOutlined />} color="#388e3c" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
          <MetricCard title="Pending Verification" value={metrics.pendingVerifications} icon={<PendingActionsOutlined />} color="#ed6c02" subtitle="payments awaiting" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
          <MetricCard title="Overdue Customers" value={metrics.overdueCustomers} icon={<ReportProblemOutlined />} color="#d32f2f" subtitle="past due date" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
          <MetricCard title="Low Stock Products" value={metrics.lowStockProducts} icon={<InventoryOutlined />} color="#f57c00" subtitle="below threshold" />
        </Grid>
      </Grid>

      {/* Charts */}
      {charts && (
        <Grid container spacing={2.5} sx={{ mt: 2 }}>
          {/* Daily Sales Trend */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>Daily Sales (Last 30 Days)</Typography>
                {charts.dailySales.length === 0 ? (
                  <Typography color="text.secondary" variant="body2">No sales data yet</Typography>
                ) : (
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={charts.dailySales}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" fontSize={11} />
                      <YAxis fontSize={11} />
                      <Tooltip formatter={(v: number) => formatCurrency(v)} />
                      <Line type="monotone" dataKey="amount" stroke="#1976d2" name="Sales" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Daily Collection Trend */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>Daily Collection (Last 30 Days)</Typography>
                {charts.dailyCollection.length === 0 ? (
                  <Typography color="text.secondary" variant="body2">No collection data yet</Typography>
                ) : (
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={charts.dailyCollection}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" fontSize={11} />
                      <YAxis fontSize={11} />
                      <Tooltip formatter={(v: number) => formatCurrency(v)} />
                      <Line type="monotone" dataKey="amount" stroke="#2e7d32" name="Collection" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Top Customers By Outstanding */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>Top Customers By Outstanding</Typography>
                {charts.topCustomers.length === 0 ? (
                  <Typography color="text.secondary" variant="body2">No outstanding balances</Typography>
                ) : (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={charts.topCustomers} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" fontSize={11} />
                      <YAxis type="category" dataKey="name" fontSize={11} width={100} />
                      <Tooltip formatter={(v: number) => formatCurrency(v)} />
                      <Bar dataKey="outstanding" fill="#d32f2f" name="Outstanding" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Top Selling Products */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>Top Selling Products (This Month)</Typography>
                {charts.topProducts.length === 0 ? (
                  <Typography color="text.secondary" variant="body2">No sales this month</Typography>
                ) : (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={charts.topProducts} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" fontSize={11} />
                      <YAxis type="category" dataKey="name" fontSize={11} width={120} />
                      <Tooltip />
                      <Bar dataKey="quantity" fill="#7b1fa2" name="Qty Sold" />
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
