
'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Heart,
    SkipBack,
    Play,
    Pause,
    SkipForward,
    Music,
    Shuffle,
    ListMusic,
    X,
    Maximize2,
    Minimize2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePlaybackState, useAppContext } from '@/context/AppContext';
import type { Song } from '@/firebase/firestore';
import { useUserPreferences } from '@/hooks/use-user-preferences';
import { useUser, useFirestore } from '@/firebase';
import { setUserSongPreference } from '@/firebase/firestore';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Slider } from '@/components/ui/slider';


export function FloatingPlayerWrapper() {
    const { currentTrack } = useAppContext();
    const { user } = useUser();
    const firestore = useFirestore();
    const router = useRouter();
    const { toast } = useToast();
    const { likedSongIds } = useUserPreferences(user?.uid);
    const [isVisible, setIsVisible] = useState(true);

    const isLiked = (songId: string) => {
        if (!songId) return false;
        return likedSongIds.includes(songId);
    };

    const handleLike = (e: React.MouseEvent, songId: string) => {
        e.stopPropagation();
        if (!user) {
            router.push('/login');
            toast({
                title: 'Please sign in',
                description: 'You need to be signed in to like songs.',
            });
            return;
        }
        if (!songId) return;

        const currentlyLiked = isLiked(songId);
        setUserSongPreference(firestore, user.uid, songId, !currentlyLiked);
    };
    
    if (!isVisible) { 
        return null;
    }

    return (
        <FloatingPlayer
            track={currentTrack}
            handleLike={handleLike}
            isLiked={isLiked}
            onClose={() => setIsVisible(false)}
        />
    );
}

type FloatingPlayerProps = {
    track: Song | null;
    handleLike: (e: React.MouseEvent, songId: string) => void;
    isLiked: (songId: string) => boolean;
    onClose: () => void;
};


export function FloatingPlayer({ 
    track, 
    handleLike, 
    isLiked,
    onClose
}: FloatingPlayerProps) {
    const { isPlaying, handlePlayPause, handleNext, handlePrev } = usePlaybackState();

    const [isExpanded, setIsExpanded] = useState(false);
    
    const hasTrack = !!track;

    return (
        <div className="card">
            <div className="one">
                <span className="title">Music</span>
                <div className="music">
                    {hasTrack && track.cover ? (
                        <Image src={track.cover} alt={track.title} layout="fill" objectFit="cover" unoptimized={track.cover.startsWith('data:')}/>
                    ) : (
                        <Music className="text-gray-500" />
                    )}
                </div>
                <span className="name">{track?.title || 'MoodyO Player'}</span>
                <span className="name1">{track?.artist || 'Select a song'}</span>
                <div className="bar">
                     <button onClick={handlePrev} disabled={!hasTrack} className="player-control-button">
                        <SkipBack size={18} className="color" />
                    </button>
                    <button onClick={handlePlayPause} disabled={!hasTrack} className="player-control-button">
                        {isPlaying && hasTrack ? <Pause size={20} className="color" /> : <Play size={20} className="color" />}
                    </button>
                    <button onClick={handleNext} disabled={!hasTrack} className="player-control-button">
                        <SkipForward size={18} className="color" />
                    </button>
                </div>
                <div className="bar">
                    <button className="player-control-button"><Shuffle size={14} className="color1" /></button>
                    <button className="player-control-button"><ListMusic size={14} className="color1" /></button>
                    <button onClick={(e) => hasTrack && handleLike(e, track.id!)} disabled={!hasTrack} className={cn('player-control-button like-btn', { 'liked': hasTrack && isLiked(track.id!) })}>
                       <Heart size={14} className="color1" fill={hasTrack && isLiked(track.id!) ? 'currentColor' : 'none'}/>
                    </button>
                     <button onClick={onClose} className="player-control-button">
                        <X size={16} className="color1" />
                    </button>
                </div>
            </div>
            <div className="two"></div>
            <div className="three"></div>
        </div>
    );
}
