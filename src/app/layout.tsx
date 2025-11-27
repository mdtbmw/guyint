
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/theme-provider';
import { cn } from '@/lib/utils';
import { Inter, Space_Grotesk as SpaceGrotesk, JetBrains_Mono as JetBrainsMono } from 'next/font/google';
import MainLayout from '@/components/layout/main-layout';
import Head from 'next/head';
import { Web3Provider } from '@/components/web3-provider';
import { Provider as JotaiProvider } from 'jotai';
import { NotificationsProvider } from '@/lib/state/notifications';
import { SettingsProvider } from '@/lib/state/settings';
import { HeaderStateProvider } from '@/lib/state/header';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const spaceGrotesk = SpaceGrotesk({ subsets: ['latin'], variable: '--font-space-grotesk' });
const jetbrainsMono = JetBrainsMono({ subsets: ['latin'], variable: '--font-jetbrains-mono' });

export const metadata: Metadata = {
  title: 'INTUITION BETs — The Signal in the Noise',
  description: 'A premium prediction arena. High stakes, pure signal, verified outcomes.',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </Head>
      <body className={cn("h-[100dvh] overflow-y-auto bg-background font-sans", inter.variable, spaceGrotesk.variable, jetbrainsMono.variable)} suppressHydrationWarning>
        <div className="fixed inset-0 pointer-events-none z-50 opacity-[0.04] bg-noise"></div>
        
        <JotaiProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem={false}
            disableTransitionOnChange
          >
            <Web3Provider>
              <SettingsProvider>
                <NotificationsProvider>
                  <HeaderStateProvider>
                    <MainLayout>
                      {children}
                    </MainLayout>
                  </HeaderStateProvider>
                </NotificationsProvider>
              </SettingsProvider>
            </Web3Provider>
            <Toaster />
          </ThemeProvider>
        </JotaiProvider>
      </body>
    </html>
  );
}
