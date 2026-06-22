'use client';

import { AppShell } from '@/components/layout/AppShell';
import { useAuth } from '@/hooks/useAuth';

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  // Initialize auth - don't block rendering
  useAuth();

  return <AppShell>{children}</AppShell>;
}
