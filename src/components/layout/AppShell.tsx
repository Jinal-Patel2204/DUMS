'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

const DRAWER_WIDTH = 260;

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden', bgcolor: 'background.default' }}>
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', width: { md: `calc(100% - ${DRAWER_WIDTH}px)` }, minWidth: 0, height: '100vh', overflow: 'hidden' }}>
        <TopBar onMenuClick={() => setMobileOpen(true)} />
        <Box 
          component="main" 
          sx={{ 
            flex: 1, 
            overflowY: 'auto',
            px: { xs: 1.5, sm: 2, md: 3 }, 
            py: 2,
          }}
        >
          <Box sx={{ width: '100%' }}>
            {children}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
