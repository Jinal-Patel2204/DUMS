'use client';

import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import TrendingUpOutlined from '@mui/icons-material/TrendingUpOutlined';
import TrendingDownOutlined from '@mui/icons-material/TrendingDownOutlined';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactElement;
  color?: string;
  subtitle?: string;
  trend?: { value: number; label?: string };
}

export function MetricCard({ title, value, icon, color = '#6366F1', subtitle, trend }: MetricCardProps) {
  const bgColor = `${color}10`;

  return (
    <Card sx={{ 
      height: '100%',
      '&:hover': { 
        borderColor: `${color}40`,
        boxShadow: `0 4px 12px ${color}15`,
      },
    }}>
      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
          <Typography 
            variant="body2" 
            sx={{ 
              color: 'text.secondary', 
              fontWeight: 500, 
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.03em',
            }}
          >
            {title}
          </Typography>
          <Box sx={{ 
            p: 0.75, 
            borderRadius: '8px', 
            bgcolor: bgColor, 
            color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {icon}
          </Box>
        </Box>

        <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary', mb: 0.5, fontSize: '1.5rem' }}>
          {value}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {trend && (
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 0.25,
              color: trend.value >= 0 ? 'success.main' : 'error.main',
            }}>
              {trend.value >= 0 ? (
                <TrendingUpOutlined sx={{ fontSize: 14 }} />
              ) : (
                <TrendingDownOutlined sx={{ fontSize: 14 }} />
              )}
              <Typography sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
                {trend.value > 0 ? '+' : ''}{trend.value}%
              </Typography>
            </Box>
          )}
          {subtitle && (
            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.6875rem' }}>
              {subtitle}
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
