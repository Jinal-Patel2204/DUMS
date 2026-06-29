'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Skeleton from '@mui/material/Skeleton';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import AccountBalanceWalletOutlined from '@mui/icons-material/AccountBalanceWalletOutlined';
import CheckCircleOutlined from '@mui/icons-material/CheckCircleOutlined';
import CalendarMonthOutlined from '@mui/icons-material/CalendarMonthOutlined';
import EventOutlined from '@mui/icons-material/EventOutlined';
import ScheduleOutlined from '@mui/icons-material/ScheduleOutlined';
import PaymentsOutlined from '@mui/icons-material/PaymentsOutlined';
import ArrowForwardOutlined from '@mui/icons-material/ArrowForwardOutlined';
import { MetricCard } from '@/components/data-display/MetricCard';
import { useCustomerAuth } from '@/hooks/useCustomerAuth';
import { createClient } from '@/lib/supabase/client';
import { format } from 'date-fns';
import { tokens } from '@/theme';

const formatCurrency = (n: number) => `₹${n.toLocaleString('en-IN')}`;

interface Metrics {
  totalOutstanding: number;
  totalPaid: number;
  activeInstallments: number;
  upcomingDueAmount: number;
  upcomingDueDate: string | null;
}

export default function CustomerDashboardPage() {
  const { customer, loading: authLoading } = useCustomerAuth();
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (authLoading || !customer) return;
    const fetch = async () => {
      const supabase = createClient();
      try {
        const { data: custData } = await supabase
          .from('customers').select('current_balance').eq('id', customer.customerId).single();
        const totalOutstanding = Number(custData?.current_balance || 0);

        const { data: payments } = await supabase
          .from('payments').select('amount').eq('customer_id', customer.customerId).eq('status', 'verified');
        const totalPaid = payments?.reduce((s, p) => s + Number(p.amount), 0) ?? 0;

        const { count: activeInstallments } = await supabase
          .from('installment_plans').select('*', { count: 'exact', head: true })
          .eq('customer_id', customer.customerId).eq('status', 'active').eq('is_deleted', false);

        const { data: nextDue } = await supabase
          .from('payment_schedule')
          .select('due_date, amount_due, plan_id')
          .in('status', ['pending', 'overdue'])
          .order('due_date')
          .limit(10);

        let upcomingDueAmount = 0;
        let upcomingDueDate: string | null = null;
        if (nextDue && nextDue.length > 0) {
          const { data: plans } = await supabase
            .from('installment_plans').select('id').eq('customer_id', customer.customerId).eq('is_deleted', false);
          const planIds = new Set(plans?.map(p => p.id) || []);
          const myDues = nextDue.filter(d => planIds.has(d.plan_id));
          if (myDues.length > 0) {
            upcomingDueAmount = Number(myDues[0].amount_due);
            upcomingDueDate = myDues[0].due_date;
          }
        }

        const { data: dueBills } = await supabase
          .from('bills').select('due_date, total_amount')
          .eq('customer_id', customer.customerId).eq('is_deleted', false)
          .in('status', ['finalized', 'partially_paid', 'overdue'])
          .not('due_date', 'is', null)
          .order('due_date')
          .limit(1);

        if (dueBills && dueBills.length > 0 && !upcomingDueDate) {
          upcomingDueAmount = Number(dueBills[0].total_amount);
          upcomingDueDate = dueBills[0].due_date;
        }

        setMetrics({ totalOutstanding, totalPaid, activeInstallments: activeInstallments ?? 0, upcomingDueAmount, upcomingDueDate });
      } catch {
        setError('Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [authLoading, customer]);

  if (authLoading || loading) {
    return (
      <Box>
        <Box sx={{ mb: 3 }}>
          <Skeleton variant="text" width={220} height={32} />
          <Skeleton variant="text" width={160} height={20} />
        </Box>
        <Grid container spacing={2}>
          {[...Array(5)].map((_, i) => <Grid key={i} size={{ xs: 12, sm: 6, md: 4 }}><Skeleton variant="rounded" height={120} /></Grid>)}
        </Grid>
      </Box>
    );
  }

  if (!customer) {
    return <Alert severity="warning">No customer account linked. Contact your store owner.</Alert>;
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Welcome back, {customer.name.split(' ')[0]}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
            Your account overview and payment status
          </Typography>
        </Box>
        <Button
          variant="contained"
          size="small"
          startIcon={<PaymentsOutlined />}
          onClick={() => router.push('/customer/payments/new')}
        >
          Make Payment
        </Button>
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <MetricCard
            title="Outstanding Balance"
            value={formatCurrency(metrics?.totalOutstanding ?? 0)}
            icon={<AccountBalanceWalletOutlined sx={{ fontSize: 20 }} />}
            color="#EF4444"
            subtitle="amount due"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <MetricCard
            title="Total Paid"
            value={formatCurrency(metrics?.totalPaid ?? 0)}
            icon={<CheckCircleOutlined sx={{ fontSize: 20 }} />}
            color="#10B981"
            subtitle="lifetime payments"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <MetricCard
            title="Active Installments"
            value={metrics?.activeInstallments ?? 0}
            icon={<CalendarMonthOutlined sx={{ fontSize: 20 }} />}
            color="#3B82F6"
            subtitle="ongoing plans"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <MetricCard
            title="Upcoming Payment"
            value={formatCurrency(metrics?.upcomingDueAmount ?? 0)}
            icon={<ScheduleOutlined sx={{ fontSize: 20 }} />}
            color="#F59E0B"
            subtitle="next due amount"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <MetricCard
            title="Next Due Date"
            value={metrics?.upcomingDueDate ? format(new Date(metrics.upcomingDueDate), 'dd MMM yyyy') : 'No dues'}
            icon={<EventOutlined sx={{ fontSize: 20 }} />}
            color="#8B5CF6"
            subtitle={metrics?.upcomingDueDate ? 'mark your calendar' : 'all clear'}
          />
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Card>
        <CardContent sx={{ p: 2.5 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>Quick Actions</Typography>
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            <Button variant="outlined" size="small" endIcon={<ArrowForwardOutlined sx={{ fontSize: 14 }} />} onClick={() => router.push('/customer/bills')}>
              View Bills
            </Button>
            <Button variant="outlined" size="small" endIcon={<ArrowForwardOutlined sx={{ fontSize: 14 }} />} onClick={() => router.push('/customer/payments')}>
              Payment History
            </Button>
            <Button variant="outlined" size="small" endIcon={<ArrowForwardOutlined sx={{ fontSize: 14 }} />} onClick={() => router.push('/customer/ledger')}>
              Account Ledger
            </Button>
            <Button variant="outlined" size="small" endIcon={<ArrowForwardOutlined sx={{ fontSize: 14 }} />} onClick={() => router.push('/customer/installments')}>
              Installments
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
