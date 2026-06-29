import type { Metadata } from 'next';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { StoreProvider } from '@/store/StoreProvider';

export const metadata: Metadata = {
  title: 'DUMS - Digital Udhar Management System',
  description: 'Enterprise credit management, billing, inventory, and payment system',
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
      </head>
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
