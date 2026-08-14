'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Alert from '@mui/material/Alert';
import InfoOutlined from '@mui/icons-material/InfoOutlined';

export default function ForgotPasswordPage() {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <Card sx={{ maxWidth: 440, width: '100%' }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" sx={{ mb: 1, textAlign: 'center' }}>Forgot Password</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
            Password reset functionality
          </Typography>
          <Alert icon={<InfoOutlined />} severity="info">
            This feature is coming soon. Please contact your store admin to reset your password.
          </Alert>
        </CardContent>
      </Card>
    </Box>
  );
}
