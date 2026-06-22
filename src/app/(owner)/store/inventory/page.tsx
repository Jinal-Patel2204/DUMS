'use client';

import { useState, useEffect, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAppSelector } from '@/store/hooks';
import { debugLog } from '@/lib/debug-logger';
import { MetricCard } from '@/components/data-display/MetricCard';
import InventoryOutlined from '@mui/icons-material/InventoryOutlined';
import WarningAmberOutlined from '@mui/icons-material/WarningAmberOutlined';
import RemoveShoppingCartOutlined from '@mui/icons-material/RemoveShoppingCartOutlined';
import AccountBalanceWalletOutlined from '@mui/icons-material/AccountBalanceWalletOutlined';

const fmt = (n: number) => `₹${Number(n).toLocaleString('en-IN')}`;

export default function InventoryPage() {
  const router = useRouter();
  const currentStore = useAppSelector((s) => s.auth.currentStore);
  const [metrics, setMetrics] = useState({ total: 0, stockValue: 0, lowStock: 0, outOfStock: 0 });
  const [loading, setLoading] = useState(true);

  const fetchMetrics = useCallback(async () => {
    if (!currentStore?.id) return;
    const supabase = createClient();

    const { data: products } = await supabase.from('products').select('stock_quantity, purchase_price, low_stock_threshold').eq('store_id', currentStore.id).eq('is_deleted', false).eq('is_active', true);

    if (products) {
      const total = products.length;
      const stockValue = products.reduce((s, p) => s + (Number(p.stock_quantity) * Number(p.purchase_price)), 0);
      const lowStock = products.filter(p => p.stock_quantity > 0 && p.stock_quantity <= p.low_stock_threshold).length;
      const outOfStock = products.filter(p => p.stock_quantity === 0).length;
      setMetrics({ total, stockValue, lowStock, outOfStock });
    }
    setLoading(false);
  }, [currentStore?.id]);

  useEffect(() => {
    fetchMetrics();

    // Re-fetch when tab becomes visible (user navigates back)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') fetchMetrics();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', fetchMetrics);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', fetchMetrics);
    };
  }, [fetchMetrics]);

  if (loading) return <Typography>Loading...</Typography>;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Inventory</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="contained" onClick={() => router.push('/store/inventory/purchases')}>Purchase Entry</Button>
          <Button variant="outlined" onClick={() => router.push('/store/inventory/movements')}>Stock Movements</Button>
        </Box>
      </Box>

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard title="Total Products" value={metrics.total} icon={<InventoryOutlined />} color="#1976d2" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard title="Stock Value" value={fmt(metrics.stockValue)} icon={<AccountBalanceWalletOutlined />} color="#2e7d32" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard title="Low Stock" value={metrics.lowStock} icon={<WarningAmberOutlined />} color="#ed6c02" subtitle="below threshold" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard title="Out of Stock" value={metrics.outOfStock} icon={<RemoveShoppingCartOutlined />} color="#d32f2f" subtitle="zero stock" />
        </Grid>
      </Grid>
    </Box>
  );
}
