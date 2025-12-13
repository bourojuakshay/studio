'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';

// This is a client-side component that will listen for permission errors
// and throw them as an uncaught exception. This is so that the Next.js
// development overlay can catch them and display them.
// NOTE: This should be disabled in production builds.
export function FirebaseErrorListener() {
  useEffect(() => {
    const handler = (error: Error) => {
      // In a production app, you'd want to log this to a service like Sentry
      // or Cloud Logging, rather than just throwing it.
      // For the purposes of this demo, we'll throw it to the dev overlay.
      if (process.env.NODE_ENV === 'development') {
        setTimeout(() => {
          throw error;
        }, 0);
      } else {
        console.error("Firestore Permission Error:", error.message);
      }
    };

    errorEmitter.on('permission-error', handler);

    return () => {
      errorEmitter.removeListener('permission-error', handler);
    };
  }, []);

  return null;
}
