
'use client';

import React, { createContext, useContext, useState, useRef, useEffect, ReactNode } from 'react';
import { Track } from '@/app/lib/mood-definitions';
import { useSongs } from '@/hooks/use-songs';
import { create } from 'zustand';

interface AppState {
    activePage: string;
    setActivePage: (page: string) => void;
    nowPlaying: { mood: string; index: number } | null;
    setNowPlaying: (playing: { mood: string; index: number } | null) => void;
    isPlaying: boolean;
    setIsPlaying: (playing: boolean) => void;
    volume: number;
    setVolume: (volume: number) => void;
    progress: { currentTime: number; duration: number };
    setProgress: (progress: { currentTime: number; duration: number }) => void;
    audioRef: React.RefObject<HTMLAudioElement>;
}

export const useAppContext = create<AppState>((set) => ({
    activePage: 'home',
    setActivePage: (page) => set({ activePage: page }),
    nowPlaying: null,
    setNowPlaying: (playing) => set({ nowPlaying: playing }),
    isPlaying: false,
    setIsPlaying: (playing) => set({ isPlaying: playing }),
    volume: 0.75,
    setVolume: (volume) => set({ volume }),
    progress: { currentTime: 0, duration: 0 },
    setProgress: (progress) => set({ progress }),
    audioRef: React.createRef<HTMLAudioElement>(),
}));

export function AppProvider({ children }: { children: ReactNode }) {
    const { isPlaying, setProgress, volume, nowPlaying } = useAppContext();
    const { songs } = useSongs();
    const audioRef = useAppContext((state) => state.audioRef);
    const currentTrack = nowPlaying ? songs.find(s => s.id === (songs.find(s => s.index === nowPlaying.index)?.id)) : null;

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        if (currentTrack?.src) {
            if (audio.src !== currentTrack.src) {
                audio.src = currentTrack.src;
                audio.load();
            }
            if (isPlaying) {
                audio.play().catch(e => console.error("Audio play error:", e));
            } else {
                audio.pause();
            }
        }
    }, [currentTrack, isPlaying, audioRef]);

    useEffect(() => {
        const audio = audioRef.current;
        if (audio) {
            audio.volume = volume;
        }
    }, [volume, audioRef]);
    
    return <>{children}</>;
}
