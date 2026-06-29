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
import Alert from '@mui/material/Alert';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CheckCircleOutlined from '@mui/icons-material/CheckCircleOutlined';
import CancelOutlined from '@mui/icons-material/CancelOutlined';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/providers/ToastProvider';
import { useConfirm } from '@/components/feedback/ConfirmDialog';
import { PageLoading } from '@/components/feedback/PageLoading';
import { format } from 'date-fns';

const formatCurrency = (n: number) => `₹${n.toLocaleString('en-IN')}`;

const statusColor: Record<string, 'warning' | 'success' | 'error' | 'info' | 'default'> = {
  pending: 'warning', verified: 'success', rejected: 'error', disputed: 'info',
};

export default function PaymentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const { confirm } = useConfirm();
  const [payment, setPayment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

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
    if (!payment) return;

    const confirmed = await confirm({
      title: 'Verify Payment',
      message: `Are you sure you want to verify this payment of ${formatCurrency(Number(payment.amount))} from ${payment.customers?.name || 'customer'}? This will update the customer's balance and cannot be undone.`,
      confirmLabel: 'Verify Payment',
      severity: 'warning',
    });

    if (!confirmed) return;

    setActionLoading(true);
    try {
      const res = await fetch(`/api/payments/${id}/verify`, { method: 'POST' });
      const data = await res.json();

      if (!res.ok) {
        showError(data.error || 'Failed to verify payment');
        setActionLoading(false);
        return;
      }

      showSuccess(`Payment of ${formatCurrency(Number(payment.amount))} verified successfully`);
      fetchPayment();
    } catch {
      showError('Network error. Please try again.');
    }
    setActionLoading(false);
  };

  const handleReject = async () => {
    if (!rejectionReason || rejectionReason.length < 3) {
      showError('Please provide a rejection reason (minimum 3 characters)');
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch(`/api/payments/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rejection_reason: rejectionReason }),
      });
      const data = await res.json();

      if (!res.ok) {
        showError(data.error || 'Failed to reject payment');
        setActionLoading(false);
        return;
      }

      showSuccess('Payment rejected');
      setRejectDialogOpen(false);
      setRejectionReason('');
      fetchPayment();
    } catch {
      showError('Network error. Please try again.');
    }
    setActionLoading(false);
  };

  if (loading) return <PageLoading variant="detail" />;

  if (error || !payment) {
    return (
      <Box>
        <Alert severity="error">{error || 'Payment not found'}</Alert>
      </Box>
    );
  }

  const customer = payment.customers;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
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
                {payment.rejection_reason && (
                  <Alert severity="error" sx={{ mt: 1 }}>
                    Rejection Reason: {payment.rejection_reason}
                  </Alert>
                )}
                {payment.notes && <Typography variant="body2">Notes: {payment.notes}</Typography>}
                {payment.proof_url && (
                  <Typography variant="body2">
                    Proof: <a href={payment.proof_url} target="_blank" rel="noopener noreferrer">View Attachment</a>
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
            <Alert severity="info" sx={{ mb: 2 }}>
              Verifying will deduct {formatCurrency(Number(payment.amount))} from the customer&apos;s outstanding balance. Rejecting will notify the customer with your reason.
            </Alert>
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
                onClick={() => setRejectDialogOpen(true)}
                disabled={actionLoading}
              >
                Reject
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Reject Payment</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Please provide a reason for rejecting this payment of {formatCurrency(Number(payment?.amount || 0))}. The customer will be notified.
          </Typography>
          <TextField
            fullWidth
            label="Rejection Reason *"
            multiline
            rows={3}
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="e.g., Invalid reference number, payment not received, duplicate submission..."
            error={rejectionReason.length > 0 && rejectionReason.length < 3}
            helperText={rejectionReason.length > 0 && rejectionReason.length < 3 ? 'Minimum 3 characters' : ''}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleReject}
            disabled={actionLoading || rejectionReason.length < 3}
          >
            {actionLoading ? 'Rejecting...' : 'Reject Payment'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
