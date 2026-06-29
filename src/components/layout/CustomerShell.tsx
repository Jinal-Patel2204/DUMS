'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import { CustomerSidebar } from './CustomerSidebar';
import { TopBar } from './TopBar';

const DRAWER_WIDTH = 260;

export function CustomerShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden', bgcolor: 'background.default' }}>
      <CustomerSidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', width: { md: `calc(100% - ${DRAWER_WIDTH}px)` }, minWidth: 0, height: '100vh', overflow: 'hidden' }}>
        <TopBar onMenuClick={() => setMobileOpen(true)} />
        <Box 
          component="main" 
          sx={{ 
            flex: 1, 
            overflowY: 'auto',
            px: { xs: 2, sm: 3, md: 4 }, 
            py: 3,
          }}
        >
          <Box sx={{ maxWidth: '1200px', width: '100%', mx: 'auto' }}>
            {children}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
