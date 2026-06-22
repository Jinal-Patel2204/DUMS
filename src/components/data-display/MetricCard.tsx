'use client';

import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import type { SvgIconComponent } from '@mui/icons-material';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactElement;
  color?: string;
  subtitle?: string;
}

export function MetricCard({ title, value, icon, color = 'primary.main', subtitle }: MetricCardProps) {
  return (
    <Card>
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box sx={{ p: 1, borderRadius: 2, bgcolor: `${color}15`, color }}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
