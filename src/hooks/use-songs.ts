
'use client';

import { useState, useEffect } from 'react';
import { useFirestore } from '@/firebase';
import { getSongs, type Song } from '@/firebase/firestore';

export function useSongs() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const firestore = useFirestore();

  useEffect(() => {
    if (!firestore) return;

    setLoading(true);
    const unsubscribe = getSongs(
      firestore,
      (newSongs) => {
        setSongs(newSongs);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [firestore]);

  return { songs, loading, error };
}
