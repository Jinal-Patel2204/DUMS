'use client';

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import CheckOutlined from '@mui/icons-material/CheckOutlined';
import CloseOutlined from '@mui/icons-material/CloseOutlined';
import PersonOutlined from '@mui/icons-material/PersonOutlined';
import { useGetPaymentQuery, useUpdatePaymentStatusMutation } from '@/store/api/paymentsApi';
import { useGetCustomersQuery } from '@/store/api/customersApi';
import { useAppSelector } from '@/store/hooks';
import { DetailShell } from '@/components/layout/DetailShell';
import { format } from 'date-fns';
import Typography from '@mui/material/Typography';

const fmt = (n: number) => `₹ ${Number(n).toLocaleString('en-IN')}`;

const statusConfig: Record<string, { color: 'warning' | 'success' | 'error' | 'default'; label: string }> = {
  pending: { color: 'warning', label: 'Pending' },
  verified: { color: 'success', label: 'Verified' },
  rejected: { color: 'error', label: 'Rejected' },
};

export default function PaymentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const currentStore = useAppSelector((s) => s.auth.currentStore);
  const { data: payment, isLoading, error } = useGetPaymentQuery({ id }, { skip: !id });
  const [updateStatus, { isLoading: updating }] = useUpdatePaymentStatusMutation();

  const { data: customersData } = useGetCustomersQuery(
    { storeId: currentStore?.id ?? '' },
    { skip: !currentStore?.id }
  );

  const customerName = useMemo(() => {
    if (!payment || !customersData?.data) return 'Unknown';
    return customersData.data.find(c => c.id === payment.customerId)?.name || 'Unknown';
  }, [payment, customersData]);

  const refId = payment?.referenceId || `PYM-${(payment?.id || '').slice(0, 8).toUpperCase()}`;
  const status = statusConfig[payment?.status || ''] || { color: 'default' as const, label: payment?.status || '' };

  return (
    <DetailShell
      pageTitle="Payment Details"
      heading={`Payment Review: #${refId}`}
      isLoading={isLoading}
      error={error ? 'Payment not found' : null}
      status={status}
      actions={payment?.status === 'pending' ? [
        { label: 'Verify Payment', icon: <CheckOutlined sx={{ fontSize: 16 }} />, onClick: () => updateStatus({ id, status: 'verified' }), color: 'success', disabled: updating },
        { label: 'Reject Payment', icon: <CloseOutlined sx={{ fontSize: 16 }} />, onClick: () => updateStatus({ id, status: 'rejected' }), color: 'error', variant: 'outlined', disabled: updating },
      ] : []}
      leftFields={payment ? [
        { label: 'Amount', value: fmt(payment.amount), large: true },
        { label: 'Method', value: payment.method.replace('_', ' ').toUpperCase() },
        { label: 'Payer', value: customerName, icon: <PersonOutlined sx={{ fontSize: 18, color: 'text.secondary' }} /> },
      ] : []}
      rightFields={payment ? [
        { label: 'Payment Date', value: payment.createdAt ? format(new Date(payment.createdAt), 'dd MMM yyyy, hh:mm a') : '—' },
        { label: 'Transaction ID', value: refId, mono: true },
        { label: 'App-ID', value: 'DUMS-WEB-1.2', mono: true },
      ] : []}
      extraSections={payment && (payment.notes || payment.rejectionReason || payment.verifiedAt) ? [{
        fields: [
          ...(payment.verifiedAt ? [{ label: 'Verified At', value: format(new Date(payment.verifiedAt), 'dd MMM yyyy, hh:mm a') }] : []),
          ...(payment.rejectionReason ? [{ label: 'Rejection Reason', value: <Typography variant="body2" color="error.main" sx={{ fontWeight: 500 }}>{payment.rejectionReason}</Typography> }] : []),
          ...(payment.notes ? [{ label: 'Notes', value: payment.notes }] : []),
        ],
      }] : []}
    />
  );
}
