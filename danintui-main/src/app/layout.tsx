
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

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const spaceGrotesk = SpaceGrotesk({ subsets: ['latin'], variable: '--font-space-grotesk' });
const jetbrainsMono = JetBrainsMono({ subsets: ['latin'], variable: '--font-jetbrains-mono' });

export const metadata: Metadata = {
  title: 'Intuition BETs — The Signal in the Noise',
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
      <body className={cn("h-dvh overflow-hidden", inter.variable, spaceGrotesk.variable, jetbrainsMono.variable)} suppressHydrationWarning>
        <div className="fixed inset-0 pointer-events-none z-50 opacity-[0.04]" style={{backgroundImage: "url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22 opacity=%221%22/%3E%3C/svg%3E')"}}></div>
        
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
                  <MainLayout>
                    <div className="p-4 sm:p-6 lg:p-8">
                      {children}
                    </div>
                  </MainLayout>
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
