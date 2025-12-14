
'use client';

import React, { ReactNode, useEffect } from 'react';
import { create } from 'zustand';
import { useSongs } from '@/hooks/use-songs';
import type { Song } from '@/firebase/firestore';

interface AppState {
    activePage: string;
    setActivePage: (page: string) => void;
    nowPlayingId: string | null;
    setNowPlayingId: (songId: string | null) => void;
    isPlaying: boolean;
    setIsPlaying: (playing: boolean) => void;
    volume: number;
    setVolume: (volume: number) => void;
    progress: { currentTime: number; duration: number };
    setProgress: (progress: { currentTime: number; duration: number }) => void;
    audioRef: React.RefObject<HTMLAudioElement>;
    playlist: Song[];
    setPlaylist: (playlist: Song[]) => void;
    currentTrack: Song | null;
    setCurrentTrack: (track: Song | null) => void;
}

export const useAppContext = create<AppState>((set) => ({
    activePage: 'home',
    setActivePage: (page) => set({ activePage: page }),
    nowPlayingId: null,
    setNowPlayingId: (songId) => set({ nowPlayingId: songId }),
    isPlaying: false,
    setIsPlaying: (playing) => set({ isPlaying: playing }),
    volume: 0.75,
    setVolume: (volume) => set({ volume }),
    progress: { currentTime: 0, duration: 0 },
    setProgress: (progress) => set({ progress }),
    audioRef: React.createRef<HTMLAudioElement>(),
    playlist: [],
    setPlaylist: (playlist) => set({ playlist }),
    currentTrack: null,
    setCurrentTrack: (track) => set({ currentTrack: track }),
}));

export function AppProvider({ children }: { children: ReactNode }) {
    const { 
        isPlaying, 
        volume, 
        nowPlayingId,
        setCurrentTrack,
        playlist,
    } = useAppContext();
    
    const audioRef = useAppContext((state) => state.audioRef);
    const currentTrack = useAppContext((state) => state.currentTrack);

    useEffect(() => {
        const track = playlist.find(t => t.id === nowPlayingId) || null;
        setCurrentTrack(track);
    }, [nowPlayingId, playlist, setCurrentTrack]);


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
        } else if (!currentTrack) {
             audio.pause();
             audio.src = '';
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
