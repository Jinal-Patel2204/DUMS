'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import ConstructionOutlined from '@mui/icons-material/ConstructionOutlined';

export default function SmtpSettingsPage() {
  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>SMTP Settings</Typography>
      <Card>
        <CardContent sx={{ py: 8, textAlign: 'center' }}>
          <ConstructionOutlined sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">Coming Soon</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            This feature is under development and will be available soon.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
