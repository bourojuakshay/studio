
'use client';

import { useEffect } from 'react';
import type { MoodDefinition } from '@/app/lib/mood-definitions';
import { useAppContext } from '@/context/AppContext';
import type { Song } from '@/firebase/firestore';

type ThemeProviderProps = {
    activePage: string;
    customMoods: Record<string, MoodDefinition>;
    tracks: Record<string, Song[]>;
    nowPlayingId: string | null;
    allMoods: Record<string, MoodDefinition>;
};

export function ThemeProvider({ activePage, customMoods, tracks, nowPlayingId, allMoods }: ThemeProviderProps) {
  const { playlist } = useAppContext();

  useEffect(() => {
    const moodDef = allMoods[activePage as keyof typeof allMoods];

    // Reset classes and styles on body
    document.body.className = 'dark';
    document.body.style.background = '';
    document.documentElement.style.setProperty('--page-accent', 'hsl(var(--primary))');
    
    // Reset background image on all pages
    const pages = document.querySelectorAll('.page');
    pages.forEach(p => {
      const pageEl = p as HTMLElement;
      pageEl.style.setProperty('--bg-image', 'none');
    });

    if (activePage === 'home') {
        document.body.classList.add('home-active');
    } else if (moodDef) {
        document.body.style.background = moodDef.bg;
        document.documentElement.style.setProperty('--page-accent', moodDef.accent);
        
        const activePageElement = document.getElementById(activePage);
        const activePlaylist = tracks[activePage as keyof typeof tracks];
        if (activePageElement && activePlaylist && activePlaylist.length > 0) {
            const currentTrack = nowPlayingId ? playlist.find(t => t.id === nowPlayingId) : activePlaylist[0];
            if (currentTrack) {
              activePageElement.style.setProperty('--bg-image', `url(${currentTrack.cover})`);
            }
        }

        let classes = `${activePage}-active `;
        classes += moodDef.themeClass || 'custom-theme-active ';
        classes += 'theme-active ';
        
        document.body.className = document.body.className + ' ' + classes.trim();
    }
  }, [activePage, customMoods, tracks, nowPlayingId, allMoods, playlist]);

  return null; // This component does not render anything
}
