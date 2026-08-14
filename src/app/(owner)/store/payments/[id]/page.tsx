'use client';

import { useParams } from 'next/navigation';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Skeleton from '@mui/material/Skeleton';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import { useGetPaymentQuery, useUpdatePaymentStatusMutation } from '@/store/api/paymentsApi';
import { format } from 'date-fns';

const fmt = (n: number) => `₹${Number(n).toLocaleString('en-IN')}`;
const statusColor: Record<string, 'warning' | 'success' | 'error' | 'default'> = {
  pending: 'warning', verified: 'success', rejected: 'error',
};

export default function PaymentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: payment, isLoading, error } = useGetPaymentQuery({ id }, { skip: !id });
  const [updateStatus, { isLoading: updating }] = useUpdatePaymentStatusMutation();

  if (isLoading) return <Box><Skeleton variant="rounded" height={40} sx={{ mb: 2, width: 200 }} /><Skeleton variant="rounded" height={250} /></Box>;
  if (error || !payment) return <Alert severity="error">Payment not found</Alert>;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Payment Details</Typography>
        <Chip label={payment.status} color={statusColor[payment.status] || 'default'} sx={{ textTransform: 'capitalize' }} />
      </Box>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>Payment Info</Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}><Typography variant="body2" color="text.secondary">Amount</Typography><Typography variant="h6" sx={{ fontWeight: 700 }}>{fmt(payment.amount)}</Typography></Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}><Typography variant="body2" color="text.secondary">Method</Typography><Typography variant="body2" sx={{ textTransform: 'capitalize' }}>{payment.method.replace('_', ' ')}</Typography></Box>
              {payment.referenceId && <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}><Typography variant="body2" color="text.secondary">Reference ID</Typography><Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{payment.referenceId}</Typography></Box>}
              {payment.notes && <Box sx={{ mt: 1 }}><Typography variant="body2" color="text.secondary">Notes</Typography><Typography variant="body2">{payment.notes}</Typography></Box>}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>Timeline</Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}><Typography variant="body2" color="text.secondary">Created</Typography><Typography variant="body2">{payment.createdAt ? format(new Date(payment.createdAt), 'dd MMM yyyy, hh:mm a') : '—'}</Typography></Box>
              {payment.verifiedAt && <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}><Typography variant="body2" color="text.secondary">Verified</Typography><Typography variant="body2">{format(new Date(payment.verifiedAt), 'dd MMM yyyy, hh:mm a')}</Typography></Box>}
              {payment.rejectionReason && <Box sx={{ mt: 1 }}><Typography variant="body2" color="text.secondary">Rejection Reason</Typography><Typography variant="body2" color="error.main">{payment.rejectionReason}</Typography></Box>}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {payment.status === 'pending' && (
        <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
          <Button variant="contained" color="success" disabled={updating} onClick={() => updateStatus({ id, status: 'verified' })}>
            Verify Payment
          </Button>
          <Button variant="outlined" color="error" disabled={updating} onClick={() => updateStatus({ id, status: 'rejected' })}>
            Reject Payment
          </Button>
        </Box>
      )}
    </Box>
  );
}
