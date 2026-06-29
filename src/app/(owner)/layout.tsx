'use client';

import { AppShell } from '@/components/layout/AppShell';
import { useAuth } from '@/hooks/useAuth';
import { ErrorBoundary } from '@/components/providers/ErrorBoundary';
import { ToastProvider } from '@/components/providers/ToastProvider';
import { ConfirmProvider } from '@/components/feedback/ConfirmDialog';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  useAuth();

  return (
    <ErrorBoundary>
      <ToastProvider>
        <ConfirmProvider>
          <AppShell>
            <Breadcrumbs />
            {children}
          </AppShell>
        </ConfirmProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}
