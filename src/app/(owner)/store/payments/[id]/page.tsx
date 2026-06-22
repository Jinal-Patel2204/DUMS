'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Divider from '@mui/material/Divider';
import Skeleton from '@mui/material/Skeleton';
import Alert from '@mui/material/Alert';
import ArrowBackOutlined from '@mui/icons-material/ArrowBackOutlined';
import CheckCircleOutlined from '@mui/icons-material/CheckCircleOutlined';
import CancelOutlined from '@mui/icons-material/CancelOutlined';
import { createClient } from '@/lib/supabase/client';
import { useAppSelector } from '@/store/hooks';
import { format } from 'date-fns';

const formatCurrency = (n: number) => `₹${n.toLocaleString('en-IN')}`;

const statusColor: Record<string, 'warning' | 'success' | 'error' | 'info' | 'default'> = {
  pending: 'warning', verified: 'success', rejected: 'error', disputed: 'info',
};

export default function PaymentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const currentStore = useAppSelector((s) => s.auth.currentStore);
  const [payment, setPayment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchPayment = async () => {
    if (!id) return;
    const supabase = createClient();
    const { data, error: fetchError } = await supabase
      .from('payments')
      .select('*, customers(id, name, phone, current_balance)')
      .eq('id', id)
      .single();

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setPayment(data);
    }
    setLoading(false);
  };

  useEffect(() => { fetchPayment(); }, [id]);

  const handleVerify = async () => {
    if (!payment || !currentStore?.id) return;
    setActionLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Update payment status
    const { error: updateErr } = await supabase
      .from('payments')
      .update({ status: 'verified', verified_at: new Date().toISOString(), verified_by: user?.id })
      .eq('id', payment.id);

    if (updateErr) { setError(updateErr.message); setActionLoading(false); return; }

    // Create ledger entry (debit = customer paid, balance decreases)
    const customer = payment.customers;
    const balanceBefore = Number(customer?.current_balance || 0);
    const balanceAfter = balanceBefore - Number(payment.amount);

    await supabase.from('ledger_entries').insert({
      store_id: currentStore.id,
      customer_id: payment.customer_id,
      entry_type: 'debit',
      reference_type: 'payment',
      reference_id: payment.id,
      description: `Payment via ${payment.method}`,
      debit_amount: 0,
      credit_amount: Number(payment.amount),
      balance_before: balanceBefore,
      balance_after: balanceAfter,
      entry_date: new Date().toISOString().split('T')[0],
    });

    // Notify customer about approval
    if (customer?.id) {
      const { data: custData } = await supabase.from('customers').select('linked_user_id').eq('id', payment.customer_id).single();
      if (custData?.linked_user_id) {
        await supabase.from('notifications').insert({
          user_id: custData.linked_user_id,
          type: 'payment_received',
          channel: 'in_app',
          title: 'Payment Approved',
          body: `Your payment of ₹${Number(payment.amount).toLocaleString('en-IN')} has been verified.`,
          data: { amount: payment.amount },
        });
      }
    }

    setActionLoading(false);
    fetchPayment();
  };

  const handleReject = async () => {
    if (!payment) return;
    setActionLoading(true);
    const supabase = createClient();
    const { error: updateErr } = await supabase
      .from('payments')
      .update({ status: 'rejected' })
      .eq('id', payment.id);

    if (updateErr) { setError(updateErr.message); setActionLoading(false); return; }

    // Notify customer about rejection
    const { data: custData } = await supabase.from('customers').select('linked_user_id').eq('id', payment.customer_id).single();
    if (custData?.linked_user_id) {
      await supabase.from('notifications').insert({
        user_id: custData.linked_user_id,
        type: 'payment_received',
        channel: 'in_app',
        title: 'Payment Rejected',
        body: `Your payment of ₹${Number(payment.amount).toLocaleString('en-IN')} was rejected.`,
        data: { amount: payment.amount },
      });
    }
    setActionLoading(false);
    fetchPayment();
  };

  if (loading) {
    return (
      <Box>
        <Skeleton variant="rounded" height={40} sx={{ mb: 2, width: 200 }} />
        <Skeleton variant="rounded" height={300} />
      </Box>
    );
  }

  if (error || !payment) {
    return (
      <Box>
        <Button startIcon={<ArrowBackOutlined />} onClick={() => router.back()} sx={{ mb: 2 }}>Back</Button>
        <Alert severity="error">{error || 'Payment not found'}</Alert>
      </Box>
    );
  }

  const customer = payment.customers;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <Button startIcon={<ArrowBackOutlined />} onClick={() => router.back()}>Back</Button>
        <Typography variant="h5">Payment Details</Typography>
        <Chip label={payment.status} color={statusColor[payment.status] || 'default'} sx={{ ml: 1 }} />
      </Box>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>Payment Info</Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>{formatCurrency(Number(payment.amount))}</Typography>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography variant="body2">Method: <strong>{payment.method.replace('_', ' ')}</strong></Typography>
                <Typography variant="body2">Reference: <strong>{payment.reference_id || '—'}</strong></Typography>
                <Typography variant="body2">Created: <strong>{format(new Date(payment.created_at), 'dd MMM yyyy, hh:mm a')}</strong></Typography>
                {payment.verified_at && (
                  <Typography variant="body2">Verified: <strong>{format(new Date(payment.verified_at), 'dd MMM yyyy, hh:mm a')}</strong></Typography>
                )}
                {payment.notes && <Typography variant="body2">Notes: {payment.notes}</Typography>}
                {payment.proof_url && (
                  <Typography variant="body2">
                    Proof: <a href={payment.proof_url} target="_blank" rel="noopener noreferrer">View</a>
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>Customer</Typography>
              {customer ? (
                <>
                  <Typography variant="h6" sx={{ fontWeight: 500 }}>{customer.name}</Typography>
                  <Typography variant="body2" color="text.secondary">{customer.phone}</Typography>
                  <Box sx={{ mt: 2 }}>
                    <Chip
                      label={`Balance: ${formatCurrency(Number(customer.current_balance))}`}
                      size="small"
                      color={Number(customer.current_balance) > 0 ? 'error' : 'success'}
                      variant="outlined"
                    />
                  </Box>
                </>
              ) : (
                <Typography color="text.secondary">Customer info unavailable</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Actions for pending payments */}
      {payment.status === 'pending' && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>Actions</Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                color="success"
                startIcon={<CheckCircleOutlined />}
                onClick={handleVerify}
                disabled={actionLoading}
              >
                {actionLoading ? 'Processing...' : 'Verify Payment'}
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<CancelOutlined />}
                onClick={handleReject}
                disabled={actionLoading}
              >
                Reject
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
