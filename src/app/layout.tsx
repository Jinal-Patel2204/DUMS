import type { Metadata } from 'next';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { StoreProvider } from '@/store/StoreProvider';

export const metadata: Metadata = {
  title: 'DUMS - Digital Udhar Management System',
  description: 'Manage customer credit, billing, products, and payments',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <StoreProvider>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
