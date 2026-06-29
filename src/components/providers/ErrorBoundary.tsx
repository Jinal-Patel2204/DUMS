'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import ErrorOutlineOutlined from '@mui/icons-material/ErrorOutlineOutlined';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    // In production, send to error tracking service (Sentry, etc.)
    if (process.env.NODE_ENV === 'production') {
      console.error('[ErrorBoundary] Uncaught error:', error.message);
    } else {
      console.error('[ErrorBoundary]', error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', p: 3 }}>
          <Card sx={{ maxWidth: 500, width: '100%' }}>
            <CardContent sx={{ textAlign: 'center', p: 4 }}>
              <ErrorOutlineOutlined sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
              <Typography variant="h5" gutterBottom>Something went wrong</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                An unexpected error occurred. Please try again or contact support if the issue persists.
              </Typography>
              {process.env.NODE_ENV !== 'production' && this.state.error && (
                <Alert severity="error" sx={{ mb: 2, textAlign: 'left' }}>
                  <Typography variant="caption" component="pre" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {this.state.error.message}
                  </Typography>
                </Alert>
              )}
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                <Button variant="contained" onClick={this.handleReload}>Reload Page</Button>
                <Button variant="outlined" onClick={this.handleReset}>Try Again</Button>
              </Box>
            </CardContent>
          </Card>
        </Box>
      );
    }

    return this.props.children;
  }
}
