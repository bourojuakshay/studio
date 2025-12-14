
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
    nowPlayingId: string | null;
    currentTrack: Song | null;
}

export const useAppContext = create<AppState>((set, get) => ({
    activePage: 'home',
    setActivePage: (page) => set({ activePage: page }),
    playlist: [],
    setPlaylist: (playlist) => set({ playlist }),
    audioRef: React.createRef<HTMLAudioElement>(),
    volume: 0.75,
    setVolume: (volume) => {
        set({ volume });
        const audio = get().audioRef.current;
        if (audio) {
            audio.volume = volume;
        }
    },
    nowPlayingId: null,
    currentTrack: null,
}));


// --- State for high-frequency updates (playback control) ---
interface PlaybackState {
    isPlaying: boolean;
    progress: { currentTime: number; duration: number };
    
    // Actions - These can be called directly without subscribing to the component
    setNowPlayingId: (songId: string | null) => void;
    setProgress: (progress: { currentTime: number; duration: number }) => void;
    handlePlayPause: () => void;
    handleNext: () => void;
    handlePrev: () => void;
    handleSeek: (time: number) => void;
}

export const usePlaybackState = create<PlaybackState>((set, get) => ({
    isPlaying: false,
    progress: { currentTime: 0, duration: 0 },

    setNowPlayingId: (songId) => {
        const { playlist, audioRef } = useAppContext.getState();
        const track = playlist.find(t => t.id === songId) || null;
        
        // Update both low-frequency and high-frequency stores
        useAppContext.setState({ nowPlayingId: songId, currentTrack: track });

        const audio = audioRef.current;
        if (audio) {
            if (track) {
                if (audio.src !== track.src) {
                    audio.src = track.src;
                    audio.load();
                }
            } else {
                audio.pause();
                set({ isPlaying: false });
                audio.src = '';
            }
        }
    },
    setProgress: (progress) => set({ progress }),
    
    handlePlayPause: () => {
        const { currentTrack } = useAppContext.getState();
        if (currentTrack) {
            const audio = useAppContext.getState().audioRef.current;
            if (!audio) return;
            
            const { isPlaying } = get();
            if (!isPlaying) {
                audio.play().catch(e => console.error("Audio play error:", e));
            } else {
                audio.pause();
            }
            set({ isPlaying: !isPlaying });
        }
    },
    handleNext: () => {
        const { playlist, nowPlayingId } = useAppContext.getState();
        if (!nowPlayingId || playlist.length === 0) return;
        const currentIndex = playlist.findIndex(t => t.id === nowPlayingId);
        if (currentIndex === -1) return;
        const nextIndex = (currentIndex + 1) % playlist.length;
        get().setNowPlayingId(playlist[nextIndex].id!);
        // After setting the new track, ensure it plays
        const audio = useAppContext.getState().audioRef.current;
        if (audio) {
          audio.play().catch(e => console.error("Audio play error:", e));
          set({ isPlaying: true });
        }
    },
    handlePrev: () => {
        const { playlist, nowPlayingId } = useAppContext.getState();
        if (!nowPlayingId || playlist.length === 0) return;
        const currentIndex = playlist.findIndex(t => t.id === nowPlayingId);
        if (currentIndex === -1) return;
        const prevIndex = (currentIndex - 1 + playlist.length) % playlist.length;
        get().setNowPlayingId(playlist[prevIndex].id!);
        // After setting the new track, ensure it plays
        const audio = useAppContext.getState().audioRef.current;
        if (audio) {
          audio.play().catch(e => console.error("Audio play error:", e));
          set({ isPlaying: true });
        }
    },
    handleSeek: (time: number) => {
        const { audioRef } = useAppContext.getState();
        if (audioRef.current) {
            audioRef.current.currentTime = time;
        }
    },
}));

export const AudioPlayer = () => {
    const audioRef = useAppContext((state) => state.audioRef);
    const { setProgress, handleNext } = usePlaybackState.getState();
    const setIsPlaying = (playing: boolean) => usePlaybackState.setState({ isPlaying: playing });

    return (
        <audio 
            ref={audioRef} 
            onEnded={handleNext}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onTimeUpdate={() => {
                const audio = audioRef.current;
                if(audio) setProgress({ currentTime: audio.currentTime, duration: audio.duration });
            }}
            onLoadedData={() => {
                const audio = audioRef.current;
                if(audio) setProgress({ currentTime: audio.currentTime, duration: audio.duration });
            }}
            crossOrigin="anonymous"
        />
    )
}


// --- Provider Component ---
export function AppProvider({ children }: { children: ReactNode }) {
    const audioRef = useAppContext.getState().audioRef;
    
    // This effect runs once to set up the initial volume
    useEffect(() => {
        const { volume } = useAppContext.getState();
        if (audioRef.current) {
            audioRef.current.volume = volume;
        }
    }, [audioRef]);
    
    return <>{children}</>;
}
