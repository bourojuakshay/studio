
import type {Metadata} from 'next';
import './globals.css';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { Toaster } from '@/components/ui/toaster';
import { AppProvider, AudioPlayer } from '@/context/AppContext';
import { FloatingPlayerWrapper } from '@/components/FloatingPlayer';

export const metadata: Metadata = {
  title: 'MoodyO',
  description: 'An AI-powered, mood-based audio player experience.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>
        <FirebaseClientProvider>
          <AppProvider>
            {children}
            <FloatingPlayerWrapper />
            <AudioPlayer />
          </AppProvider>
        </FirebaseClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
