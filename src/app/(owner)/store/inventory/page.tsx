'use client';

import WarehouseOutlined from '@mui/icons-material/WarehouseOutlined';
import { PageShell } from '@/components/layout/PageShell';

export default function InventoryPage() {
  return (
    <PageShell
      title="Inventory"
      subtitle="Track stock levels, movements, and alerts"
      isEmpty={true}
      emptyIcon={<WarehouseOutlined />}
      emptyTitle="Coming Soon"
      emptyDescription="Inventory tracking and management will be available soon."
    />
  );
}
