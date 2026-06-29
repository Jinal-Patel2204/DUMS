'use client';

import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Chip from '@mui/material/Chip';
import Skeleton from '@mui/material/Skeleton';
import Alert from '@mui/material/Alert';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreOutlined from '@mui/icons-material/ExpandMoreOutlined';
import LinearProgress from '@mui/material/LinearProgress';
import { useCustomerAuth } from '@/hooks/useCustomerAuth';
import { createClient } from '@/lib/supabase/client';
import { format } from 'date-fns';

const formatCurrency = (n: number) => `₹${n.toLocaleString('en-IN')}`;
const planStatusColor: Record<string, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
  active: 'info', completed: 'success', overdue: 'error', defaulted: 'error', cancelled: 'default',
};

export default function CustomerInstallmentsPage() {
  const { customer, loading: authLoading } = useCustomerAuth();
  const [plans, setPlans] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !customer) return;
    const fetch = async () => {
      const supabase = createClient();
      const { data: planData } = await supabase
        .from('installment_plans').select('*')
        .eq('customer_id', customer.customerId).eq('is_deleted', false)
        .order('created_at', { ascending: false });
      setPlans(planData || []);

      // Fetch schedules for all plans
      if (planData && planData.length > 0) {
        const { data: scheduleData } = await supabase
          .from('payment_schedule').select('*')
          .in('plan_id', planData.map(p => p.id))
          .order('due_date');
        const grouped: Record<string, any[]> = {};
        scheduleData?.forEach(s => {
          if (!grouped[s.plan_id]) grouped[s.plan_id] = [];
          grouped[s.plan_id].push(s);
        });
        setSchedules(grouped);
      }
      setLoading(false);
    };
    fetch();
  }, [authLoading, customer]);

  if (authLoading || loading) return <Box><Typography variant="h5" sx={{ mb: 3 }}>My Installments</Typography>{[1,2].map(i => <Skeleton key={i} variant="rounded" height={80} sx={{ mb: 1 }} />)}</Box>;
  if (!customer) return <Alert severity="warning">No customer account linked.</Alert>;

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>My Installments ({plans.length})</Typography>

      {plans.length === 0 ? (
        <Card><CardContent><Typography color="text.secondary" sx={{ textAlign: 'center' }}>No installment plans.</Typography></CardContent></Card>
      ) : (
        plans.map(plan => {
          const progress = plan.total_amount > 0 ? (Number(plan.total_paid) / Number(plan.total_amount)) * 100 : 0;
          const schedule = schedules[plan.id] || [];

          return (
            <Accordion key={plan.id} sx={{ mb: 1 }}>
              <AccordionSummary expandIcon={<ExpandMoreOutlined />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%', pr: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {formatCurrency(Number(plan.total_amount))} — {plan.number_of_installments} installments ({plan.frequency})
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {format(new Date(plan.start_date), 'dd MMM yyyy')} → {format(new Date(plan.end_date), 'dd MMM yyyy')}
                    </Typography>
                  </Box>
                  <Chip label={plan.status} size="small" color={planStatusColor[plan.status] || 'default'} variant="outlined" />
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2">Paid: {formatCurrency(Number(plan.total_paid))}</Typography>
                    <Typography variant="body2">Remaining: {formatCurrency(Number(plan.remaining_amount))}</Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={progress} sx={{ height: 8, borderRadius: 4 }} />
                </Box>

                {schedule.length > 0 && (
                  <TableContainer>
                    <Table size="small">
                      <TableHead><TableRow><TableCell>#</TableCell><TableCell>Due Date</TableCell><TableCell align="right">Amount</TableCell><TableCell align="right">Paid</TableCell><TableCell>Status</TableCell></TableRow></TableHead>
                      <TableBody>
                        {schedule.map((s: any) => (
                          <TableRow key={s.id}>
                            <TableCell>{s.installment_number}</TableCell>
                            <TableCell>{format(new Date(s.due_date), 'dd MMM yyyy')}</TableCell>
                            <TableCell align="right">{formatCurrency(Number(s.amount_due))}</TableCell>
                            <TableCell align="right">{formatCurrency(Number(s.amount_paid))}</TableCell>
                            <TableCell><Chip label={s.status} size="small" color={s.status === 'paid' ? 'success' : s.status === 'overdue' ? 'error' : 'default'} variant="outlined" /></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </AccordionDetails>
            </Accordion>
          );
        })
      )}
    </Box>
  );
}
