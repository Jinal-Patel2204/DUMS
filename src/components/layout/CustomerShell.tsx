'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import { CustomerSidebar } from './CustomerSidebar';
import { TopBar } from './TopBar';

const DRAWER_WIDTH = 260;

export function CustomerShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <CustomerSidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', width: { md: `calc(100% - ${DRAWER_WIDTH}px)` } }}>
        <TopBar onMenuClick={() => setMobileOpen(true)} />
        <Box component="main" sx={{ flex: 1, p: 3, bgcolor: 'background.default' }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}
