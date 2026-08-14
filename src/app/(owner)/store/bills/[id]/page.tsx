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
import { useGetBillQuery, useUpdateBillStatusMutation } from '@/store/api/billsApi';

const formatCurrency = (n: number) => `₹${n.toLocaleString('en-IN')}`;

const statusColors: Record<string, 'default' | 'info' | 'success' | 'warning' | 'error'> = {
  draft: 'default',
  finalized: 'info',
  partially_paid: 'warning',
  paid: 'success',
  overdue: 'error',
  cancelled: 'default',
};

export default function BillDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: bill, isLoading, error } = useGetBillQuery({ id }, { skip: !id });
  const [updateStatus, { isLoading: updating }] = useUpdateBillStatusMutation();

  if (isLoading) {
    return (
      <Box>
        <Skeleton variant="rounded" height={40} sx={{ mb: 2, width: 200 }} />
        <Skeleton variant="rounded" height={200} sx={{ mb: 2 }} />
        <Skeleton variant="rounded" height={200} />
      </Box>
    );
  }

  if (error || !bill) {
    return (
      <Box>
        <Alert severity="error">{'Failed to load bill details'}</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <Typography variant="h5">Bill {bill.billNumber}</Typography>
        <Chip
          label={bill.status.replace('_', ' ')}
          color={statusColors[bill.status] || 'default'}
          variant="outlined"
          sx={{ ml: 1 }}
        />
      </Box>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                Bill Information
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                <Typography variant="body2" color="text.secondary">Bill Number</Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>{bill.billNumber}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                <Typography variant="body2" color="text.secondary">Status</Typography>
                <Chip label={bill.status.replace('_', ' ')} size="small" color={statusColors[bill.status] || 'default'} />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                <Typography variant="body2" color="text.secondary">Created</Typography>
                <Typography variant="body2">{new Date(bill.createdAt).toLocaleDateString('en-IN')}</Typography>
              </Box>
              {bill.dueDate && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                  <Typography variant="body2" color="text.secondary">Due Date</Typography>
                  <Typography variant="body2">{new Date(bill.dueDate).toLocaleDateString('en-IN')}</Typography>
                </Box>
              )}
              {bill.finalizedAt && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                  <Typography variant="body2" color="text.secondary">Finalized</Typography>
                  <Typography variant="body2">{new Date(bill.finalizedAt).toLocaleDateString('en-IN')}</Typography>
                </Box>
              )}
              {bill.notes && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="body2" color="text.secondary">Notes</Typography>
                  <Typography variant="body2">{bill.notes}</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                Amount Details
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                <Typography variant="body2" color="text.secondary">Subtotal</Typography>
                <Typography variant="body2">{formatCurrency(bill.subtotal)}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                <Typography variant="body2" color="text.secondary">Discount</Typography>
                <Typography variant="body2" color="error.main">-{formatCurrency(bill.discountAmount)}</Typography>
              </Box>
              {bill.taxAmount > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                  <Typography variant="body2" color="text.secondary">Tax</Typography>
                  <Typography variant="body2">{formatCurrency(bill.taxAmount)}</Typography>
                </Box>
              )}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, mt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Total</Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{formatCurrency(bill.totalAmount)}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Status Update Actions */}
      {bill.status === 'draft' && (
        <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
          <Button variant="contained" color="primary" disabled={updating} onClick={() => updateStatus({ id, status: 'finalized' })}>
            Finalize Bill
          </Button>
          <Button variant="outlined" color="error" disabled={updating} onClick={() => updateStatus({ id, status: 'cancelled' })}>
            Cancel Bill
          </Button>
        </Box>
      )}
      {bill.status === 'finalized' && (
        <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
          <Button variant="contained" color="success" disabled={updating} onClick={() => updateStatus({ id, status: 'paid' })}>
            Mark as Paid
          </Button>
        </Box>
      )}
    </Box>
  );
}
