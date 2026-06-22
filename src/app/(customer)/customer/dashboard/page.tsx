'use client';

import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Skeleton from '@mui/material/Skeleton';
import Alert from '@mui/material/Alert';
import AccountBalanceWalletOutlined from '@mui/icons-material/AccountBalanceWalletOutlined';
import CheckCircleOutlined from '@mui/icons-material/CheckCircleOutlined';
import CalendarMonthOutlined from '@mui/icons-material/CalendarMonthOutlined';
import EventOutlined from '@mui/icons-material/EventOutlined';
import ScheduleOutlined from '@mui/icons-material/ScheduleOutlined';
import { MetricCard } from '@/components/data-display/MetricCard';
import { useCustomerAuth } from '@/hooks/useCustomerAuth';
import { createClient } from '@/lib/supabase/client';
import { format } from 'date-fns';

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

  useEffect(() => {
    if (authLoading || !customer) return;
    const fetch = async () => {
      const supabase = createClient();
      try {
        // Outstanding = current_balance from customer record
        const { data: custData } = await supabase
          .from('customers').select('current_balance').eq('id', customer.customerId).single();
        const totalOutstanding = Number(custData?.current_balance || 0);

        // Total paid (verified payments)
        const { data: payments } = await supabase
          .from('payments').select('amount').eq('customer_id', customer.customerId).eq('status', 'verified');
        const totalPaid = payments?.reduce((s, p) => s + Number(p.amount), 0) ?? 0;

        // Active installments
        const { count: activeInstallments } = await supabase
          .from('installment_plans').select('*', { count: 'exact', head: true })
          .eq('customer_id', customer.customerId).eq('status', 'active').eq('is_deleted', false);

        // Upcoming due (next pending schedule entry)
        const { data: nextDue } = await supabase
          .from('payment_schedule')
          .select('due_date, amount_due, plan_id')
          .in('status', ['pending', 'overdue'])
          .order('due_date')
          .limit(10);

        // Filter to only this customer's plans
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

        // Also check bills due
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
        <Typography variant="h5" sx={{ mb: 3 }}>Dashboard</Typography>
        <Grid container spacing={2}>{[...Array(5)].map((_, i) => <Grid key={i} size={{ xs: 12, sm: 6, md: 4 }}><Skeleton variant="rounded" height={100} /></Grid>)}</Grid>
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
      <Typography variant="h5" sx={{ mb: 1 }}>Welcome, {customer.name}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>Your account overview</Typography>

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <MetricCard title="Total Outstanding" value={formatCurrency(metrics?.totalOutstanding ?? 0)} icon={<AccountBalanceWalletOutlined />} color="#d32f2f" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <MetricCard title="Total Paid" value={formatCurrency(metrics?.totalPaid ?? 0)} icon={<CheckCircleOutlined />} color="#2e7d32" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <MetricCard title="Active Installments" value={metrics?.activeInstallments ?? 0} icon={<CalendarMonthOutlined />} color="#1976d2" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <MetricCard title="Upcoming Due Amount" value={formatCurrency(metrics?.upcomingDueAmount ?? 0)} icon={<ScheduleOutlined />} color="#ed6c02" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <MetricCard title="Upcoming Due Date" value={metrics?.upcomingDueDate ? format(new Date(metrics.upcomingDueDate), 'dd MMM yyyy') : 'No dues'} icon={<EventOutlined />} color="#7b1fa2" />
        </Grid>
      </Grid>
    </Box>
  );
}
