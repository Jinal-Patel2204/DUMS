'use client';

import BarChartOutlined from '@mui/icons-material/BarChartOutlined';
import { PageShell } from '@/components/layout/PageShell';

export default function ReportsPage() {
  return (
    <PageShell
      title="Reports"
      subtitle="Business analytics and performance insights"
      isEmpty={true}
      emptyIcon={<BarChartOutlined />}
      emptyTitle="Coming Soon"
      emptyDescription="Reports and analytics will be available soon."
    />
  );
}
