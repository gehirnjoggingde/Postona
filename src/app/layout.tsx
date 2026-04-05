import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Postona – LinkedIn-Posts im eigenen Stil, automatisch',
  description: 'Generiere und plane LinkedIn-Posts die klingen wie du – powered by KI. Wachse deine Personal Brand auf Autopilot.',
  keywords: 'LinkedIn, KI, Personal Brand, Content Creation, Social Media Automation',
  icons: {
    icon: '/logo.svg',
    shortcut: '/logo.svg',
    apple: '/logo.svg',
  },
  openGraph: {
    title: 'Postona – LinkedIn-Posts im eigenen Stil',
    description: 'KI generiert LinkedIn-Posts in deinem persönlichen Schreibstil.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <body className={inter.className}>
        {children}
        {/* Toast-Benachrichtigungen für die gesamte App */}
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1e293b',
              color: '#f1f5f9',
            },
          }}
        />
      </body>
    </html>
  );
}
