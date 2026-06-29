'use client';

import { CustomerShell } from '@/components/layout/CustomerShell';
import { ErrorBoundary } from '@/components/providers/ErrorBoundary';
import { ToastProvider } from '@/components/providers/ToastProvider';
import { ConfirmProvider } from '@/components/feedback/ConfirmDialog';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <ConfirmProvider>
          <CustomerShell>
            <Breadcrumbs />
            {children}
          </CustomerShell>
        </ConfirmProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}
