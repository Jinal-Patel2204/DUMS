'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import ConstructionOutlined from '@mui/icons-material/ConstructionOutlined';

export default function ResetPasswordPage() {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <Card sx={{ maxWidth: 440, width: '100%' }}>
        <CardContent sx={{ py: 8, textAlign: 'center' }}>
          <ConstructionOutlined sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">Coming Soon</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Password reset is under development and will be available soon.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
