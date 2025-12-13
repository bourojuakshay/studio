
'use client';

import { useState, useEffect } from 'react';
import { useFirestore } from '@/firebase';
import { getUserSongPreferences, type UserSongPreference } from '@/firebase/firestore';

export function useUserPreferences(userId?: string) {
  const [preferences, setPreferences] = useState<UserSongPreference[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const firestore = useFirestore();

  useEffect(() => {
    if (!firestore || !userId) {
      setPreferences([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = getUserSongPreferences(
      firestore,
      userId,
      (newPreferences) => {
        setPreferences(newPreferences);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [firestore, userId]);

  return { preferences, loading, error };
}
