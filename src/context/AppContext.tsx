
'use client';

import React, { ReactNode, useEffect, useRef } from 'react';
import { create } from 'zustand';
import type { Song } from '@/firebase/firestore';

// --- State for low-frequency updates (UI, layout) ---
interface AppState {
    activePage: string;
    setActivePage: (page: string) => void;
    playlist: Song[];
    setPlaylist: (playlist: Song[]) => void;
    audioRef: React.RefObject<HTMLAudioElement>;
    volume: number;
    setVolume: (volume: number) => void;
    setIsPlaying: (playing: boolean) => void; // Keep for audio element callbacks
}

export const useAppContext = create<AppState>((set) => ({
    activePage: 'home',
    setActivePage: (page) => set({ activePage: page }),
    playlist: [],
    setPlaylist: (playlist) => set({ playlist }),
    audioRef: React.createRef<HTMLAudioElement>(),
    volume: 0.75,
    setVolume: (volume) => set({ volume }),
    setIsPlaying: (playing) => set(state => usePlaybackState.setState({ isPlaying: playing })),
}));


// --- State for high-frequency updates (playback control) ---
interface PlaybackState {
    nowPlayingId: string | null;
    currentTrack: Song | null;
    isPlaying: boolean;
    progress: { currentTime: number; duration: number };
    
    setNowPlayingId: (songId: string | null) => void;
    setCurrentTrack: (track: Song | null) => void;
    setProgress: (progress: { currentTime: number; duration: number }) => void;
    
    // Actions
    handlePlayPause: () => void;
    handleNext: () => void;
    handlePrev: () => void;
    handleSeek: (time: number) => void;
}

export const usePlaybackState = create<PlaybackState>((set, get) => ({
    nowPlayingId: null,
    currentTrack: null,
    isPlaying: false,
    progress: { currentTime: 0, duration: 0 },

    setNowPlayingId: (songId) => set({ nowPlayingId: songId }),
    setCurrentTrack: (track) => set({ currentTrack: track }),
    setProgress: (progress) => set({ progress }),
    
    handlePlayPause: () => {
        const { isPlaying, currentTrack } = get();
        if (currentTrack) {
            useAppContext.getState().setIsPlaying(!isPlaying);
            set({ isPlaying: !isPlaying });
        }
    },
    handleNext: () => {
        const { playlist } = useAppContext.getState();
        const { nowPlayingId } = get();
        if (!nowPlayingId || playlist.length === 0) return;
        const currentIndex = playlist.findIndex(t => t.id === nowPlayingId);
        if (currentIndex === -1) return;
        const nextIndex = (currentIndex + 1) % playlist.length;
        set({ nowPlayingId: playlist[nextIndex].id });
        useAppContext.getState().setIsPlaying(true);
        set({ isPlaying: true });
    },
    handlePrev: () => {
        const { playlist } = useAppContext.getState();
        const { nowPlayingId } = get();
        if (!nowPlayingId || playlist.length === 0) return;
        const currentIndex = playlist.findIndex(t => t.id === nowPlayingId);
        if (currentIndex === -1) return;
        const prevIndex = (currentIndex - 1 + playlist.length) % playlist.length;
        set({ nowPlayingId: playlist[prevIndex].id });
        useAppContext.getState().setIsPlaying(true);
        set({ isPlaying: true });
    },
    handleSeek: (time: number) => {
        const { audioRef } = useAppContext.getState();
        if (audioRef.current) {
            audioRef.current.currentTime = time;
        }
    },
}));


// --- Provider Component ---
export function AppProvider({ children }: { children: ReactNode }) {
    // Correctly subscribe to the stores to get their state for effects.
    const { volume, audioRef, playlist } = useAppContext.getState();
    const { nowPlayingId, setCurrentTrack, isPlaying } = usePlaybackState.getState();
    
    // Using useEffect to listen to state changes from the store
    useEffect(() => {
        return usePlaybackState.subscribe(
            (state) => {
                const audio = audioRef.current;
                if (!audio || !state.currentTrack) return;
                
                if (state.isPlaying) {
                    audio.play().catch(e => console.error("Audio play error:", e));
                } else {
                    audio.pause();
                }
            },
            (state) => state.isPlaying
        );
    }, [audioRef]);

    useEffect(() => {
        return useAppContext.subscribe(
            (state) => {
                 const audio = audioRef.current;
                if (audio) {
                    audio.volume = state.volume;
                }
            },
            (state) => state.volume
        )
    }, [audioRef]);
    
    // Effect to find and set the current track object when ID changes
    useEffect(() => {
      const unsubscribe = usePlaybackState.subscribe(
        (state) => {
          const track = useAppContext.getState().playlist.find(t => t.id === state.nowPlayingId) || null;
          setCurrentTrack(track);
        },
        (state) => state.nowPlayingId
      );
      return unsubscribe;
    }, [setCurrentTrack]);
    
    return <>{children}</>;
}
