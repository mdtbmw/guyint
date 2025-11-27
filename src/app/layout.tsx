
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/theme-provider';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { cn } from '@/lib/utils';
import { Inter } from 'next/font/google';
import MainLayout from '@/components/layout/main-layout';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Intuition BETs',
  description: 'A decentralized betting platform for your intuition.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn("min-h-screen bg-neutral-950 text-white antialiased selection:bg-indigo-500/30 selection:text-indigo-100", inter.className)} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <FirebaseClientProvider>
             <div className="relative min-h-screen flex flex-col">
                  {/* Ambient background */}
                  <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
                    <div className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-fuchsia-500/15 blur-3xl"></div>
                    <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl"></div>
                    <div className="absolute top-1/2 left-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/10 blur-3xl"></div>
                  </div>
              <MainLayout>{children}</MainLayout>
            </div>
          </FirebaseClientProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
