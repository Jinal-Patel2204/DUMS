'use client';

import HistoryOutlined from '@mui/icons-material/HistoryOutlined';
import { PageShell } from '@/components/layout/PageShell';

export default function AuditLogsPage() {
  return (
    <PageShell
      title="Audit Logs"
      subtitle="Track all system activities and changes"
      isEmpty={true}
      emptyIcon={<HistoryOutlined />}
      emptyTitle="Coming Soon"
      emptyDescription="Audit logging and activity tracking will be available soon."
    />
  );
}
