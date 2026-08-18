'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Divider from '@mui/material/Divider';
import EditOutlined from '@mui/icons-material/EditOutlined';
import CheckCircleOutlined from '@mui/icons-material/CheckCircleOutlined';
import CancelOutlined from '@mui/icons-material/CancelOutlined';
import PaidOutlined from '@mui/icons-material/PaidOutlined';
import ReceiptOutlined from '@mui/icons-material/ReceiptOutlined';
import { useGetBillQuery, useUpdateBillMutation, useUpdateBillStatusMutation } from '@/store/api/billsApi';
import { DetailShell } from '@/components/layout/DetailShell';
import { FormShell } from '@/components/layout/FormShell';
import { format } from 'date-fns';

const fmt = (n: number) => `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

const statusConfig: Record<string, { color: 'default' | 'info' | 'success' | 'warning' | 'error'; label: string }> = {
  draft: { color: 'default', label: 'Draft' },
  finalized: { color: 'info', label: 'Finalized' },
  partially_paid: { color: 'warning', label: 'Partially Paid' },
  paid: { color: 'success', label: 'Paid' },
  overdue: { color: 'error', label: 'Overdue' },
  cancelled: { color: 'default', label: 'Cancelled' },
};

export default function BillDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: bill, isLoading, error } = useGetBillQuery({ id }, { skip: !id });
  const [updateStatus, { isLoading: updatingStatus }] = useUpdateBillStatusMutation();
  const [updateBill, { isLoading: updatingBill }] = useUpdateBillMutation();

  const [editing, setEditing] = useState(false);
  const [editError, setEditError] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [editStatus, setEditStatus] = useState('');

  const startEdit = () => {
    if (!bill) return;
    setDueDate(bill.dueDate ? bill.dueDate.split('T')[0] : '');
    setNotes(bill.notes || '');
    setEditStatus(bill.status);
    setEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!bill) return;
    setEditError('');
    try {
      // Update bill data first (only works for draft bills)
      if (bill.status === 'draft') {
        await updateBill({
          id,
          data: {
            dueDate: dueDate || undefined,
            notes: notes || undefined,
          },
        }).unwrap();
      }
      // Then update status if changed
      if (editStatus !== bill.status) {
        await updateStatus({ id, status: editStatus }).unwrap();
      }
      setEditing(false);
    } catch (err: any) {
      setEditError(err?.data?.error || 'Failed to update bill');
    }
  };

  const status = statusConfig[bill?.status || ''] || { color: 'default' as const, label: bill?.status || '' };

  // ─── VIEW MODE ───────────────────────────────────────
  if (!editing) {
    // Build actions based on current status
    const actions = [];
    actions.push({ label: 'Edit', icon: <EditOutlined sx={{ fontSize: 16 }} />, onClick: startEdit, variant: 'outlined' as const });

    if (bill?.status === 'draft') {
      actions.push({ label: 'Finalize Bill', icon: <CheckCircleOutlined sx={{ fontSize: 16 }} />, onClick: () => updateStatus({ id, status: 'finalized' }), color: 'primary' as const, disabled: updatingStatus });
      actions.push({ label: 'Cancel Bill', icon: <CancelOutlined sx={{ fontSize: 16 }} />, onClick: () => updateStatus({ id, status: 'cancelled' }), color: 'error' as const, variant: 'outlined' as const, disabled: updatingStatus });
    }
    if (bill?.status === 'finalized') {
      actions.push({ label: 'Mark Paid', icon: <PaidOutlined sx={{ fontSize: 16 }} />, onClick: () => updateStatus({ id, status: 'paid' }), color: 'success' as const, disabled: updatingStatus });
    }

    return (
      <DetailShell
        pageTitle="Bill Details"
        heading={`Bill ${bill?.billNumber || ''}`}
        isLoading={isLoading}
        error={error ? 'Failed to load bill details' : null}
        status={bill ? status : undefined}
        accentColor="info.main"
        actions={actions}
        leftFields={bill ? [
          { label: 'Bill Number', value: bill.billNumber, mono: true },
          { label: 'Status', value: <Chip label={status.label} size="small" color={status.color} /> },
          { label: 'Created', value: bill.createdAt ? format(new Date(bill.createdAt), 'dd MMM yyyy') : '—' },
          ...(bill.dueDate ? [{ label: 'Due Date', value: format(new Date(bill.dueDate), 'dd MMM yyyy') }] : []),
          ...(bill.finalizedAt ? [{ label: 'Finalized', value: format(new Date(bill.finalizedAt), 'dd MMM yyyy') }] : []),
        ] : []}
        rightFields={bill ? [
          { label: 'Subtotal', value: fmt(bill.subtotal) },
          { label: 'Discount', value: `-${fmt(bill.discountAmount)}` },
          ...(bill.taxAmount > 0 ? [{ label: 'Tax', value: fmt(bill.taxAmount) }] : []),
          { label: 'Total Amount', value: fmt(bill.totalAmount), large: true },
        ] : []}
        extraSections={bill?.notes ? [{ fields: [{ label: 'Notes', value: bill.notes }] }] : []}
      />
    );
  }

  // ─── EDIT MODE ───────────────────────────────────────
  if (isLoading || !bill) return <DetailShell pageTitle="Bill Details" heading="Loading..." isLoading={true} />;

  return (
    <FormShell
      title="Edit Bill"
      subtitle={`Update bill ${bill.billNumber}`}
      error={editError}
      onSubmit={handleSaveEdit}
      onCancel={() => setEditing(false)}
      submitLabel="Save Changes"
      isSubmitting={updatingBill || updatingStatus}
      sections={[
        {
          title: 'Bill Status & Details',
          icon: <ReceiptOutlined />,
          content: (
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select value={editStatus} label="Status" onChange={(e) => setEditStatus(e.target.value)}>
                    <MenuItem value="draft">Draft</MenuItem>
                    <MenuItem value="finalized">Finalized</MenuItem>
                    <MenuItem value="partially_paid">Partially Paid</MenuItem>
                    <MenuItem value="paid">Paid</MenuItem>
                    <MenuItem value="overdue">Overdue</MenuItem>
                    <MenuItem value="cancelled">Cancelled</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Due Date"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Notes"
                  multiline
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any notes or terms"
                />
              </Grid>
            </Grid>
          ),
        },
      ]}
      preview={
        <>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <ReceiptOutlined sx={{ fontSize: 18, color: 'secondary.main' }} />
            <Typography sx={{ fontWeight: 700, fontSize: '1rem' }}>Bill Preview</Typography>
          </Box>
          <Divider sx={{ mb: 2, borderStyle: 'dashed' }} />
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary' }}>Bill Number</Typography>
              <Typography sx={{ fontSize: '0.8125rem', fontWeight: 500, fontFamily: 'monospace' }}>{bill.billNumber}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary' }}>Status</Typography>
              <Chip label={statusConfig[editStatus]?.label || editStatus} size="small" color={statusConfig[editStatus]?.color || 'default'} />
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary' }}>Due Date</Typography>
              <Typography sx={{ fontSize: '0.8125rem', fontWeight: 500 }}>{dueDate || '—'}</Typography>
            </Box>
          </Box>
          <Divider sx={{ my: 2, borderStyle: 'dashed' }} />
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary' }}>Subtotal</Typography>
              <Typography sx={{ fontSize: '0.8125rem', fontWeight: 500 }}>{fmt(bill.subtotal)}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography sx={{ fontSize: '0.8125rem', color: 'text.secondary' }}>Discount</Typography>
              <Typography sx={{ fontSize: '0.8125rem', fontWeight: 500, color: 'error.main' }}>-{fmt(bill.discountAmount)}</Typography>
            </Box>
            <Divider />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography sx={{ fontSize: '0.9375rem', fontWeight: 700 }}>Total</Typography>
              <Typography sx={{ fontSize: '0.9375rem', fontWeight: 700 }}>{fmt(bill.totalAmount)}</Typography>
            </Box>
          </Box>
        </>
      }
    />
  );
}
