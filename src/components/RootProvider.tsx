'use client';

import React from 'react';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { AppProvider, AudioPlayer } from '@/context/AppContext';
import { FloatingPlayerWrapper } from '@/components/FloatingPlayer';

export function RootProvider({ children }: { children: React.ReactNode }) {
  return (
    <FirebaseClientProvider>
      <AppProvider>
        {children}
        <FloatingPlayerWrapper />
        <AudioPlayer />
      </AppProvider>
    </FirebaseClientProvider>
  );
}
