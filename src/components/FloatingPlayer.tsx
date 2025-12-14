
'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Heart, SkipBack, Play, Pause, SkipForward, Music, Shuffle, ListMusic, ArrowRight, Maximize2, Minimize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePlaybackState } from '@/context/AppContext';
import type { Song } from '@/firebase/firestore';
import { useUserPreferences } from '@/hooks/use-user-preferences';
import { useUser, useFirestore } from '@/firebase';
import { setUserSongPreference } from '@/firebase/firestore';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

export function FloatingPlayerWrapper() {
    const { currentTrack } = usePlaybackState();
    const { user } = useUser();
    const firestore = useFirestore();
    const router = useRouter();
    const { toast } = useToast();
    const { likedSongIds } = useUserPreferences(user?.uid);

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

    if (!currentTrack) return null;

    return (
        <div className="floating-player-wrapper">
            <FloatingPlayer
                track={currentTrack}
                handleLike={handleLike}
                isLiked={isLiked}
            />
        </div>
    );
}


type FloatingPlayerProps = {
    track: Song;
    handleLike: (e: React.MouseEvent, songId: string) => void;
    isLiked: (songId: string) => boolean;
};


export function FloatingPlayer({ 
    track, 
    handleLike, 
    isLiked, 
}: FloatingPlayerProps) {
    const { 
        isPlaying, 
        handlePlayPause, 
        handleNext, 
        handlePrev,
    } = usePlaybackState();
    
    if (!track) return null;

    const playerVariants = {
        hidden: { opacity: 0, y: 100 },
        visible: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: 100 },
    };
    
    return (
        <motion.div 
            className="card"
            variants={playerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ type: 'spring', damping: 20, stiffness: 100 }}
        >
            <div className="one">
                <span className="title">Music</span>
                <div className="music">
                    {track.cover ? (
                        <Image src={track.cover} alt={track.title} layout="fill" objectFit="cover" unoptimized={track.cover.startsWith('data:')}/>
                    ) : (
                        <Music width="18" height="18" />
                    )}
                </div>
                <span className="name">{track.title}</span>
                <span className="name1">{track.artist}</span>
                
                <div className="bar">
                    <button onClick={handlePrev}>
                        <svg viewBox="0 0 16 16" className="color bi bi-fast-forward-fill" fill="currentColor" height="16" width="16" xmlns="http://www.w3.org/2000/svg" style={{transform: 'rotate(180deg)'}}>
                            <path d="M7.596 7.304a.802.802 0 0 1 0 1.392l-6.363 3.692C.713 12.69 0 12.345 0 11.692V4.308c0-.653.713-.998 1.233-.696l6.363 3.692Z"></path>
                            <path d="M15.596 7.304a.802.802 0 0 1 0 1.392l-6.363 3.692C8.713 12.69 8 12.345 8 11.692V4.308c0-.653.713-.998 1.233-.696l6.363 3.692Z"></path>
                        </svg>
                    </button>
                    <button onClick={handlePlayPause}>
                        {isPlaying ? <Pause className="color" size={18} /> : <Play className="color" size={18} />}
                    </button>
                    <button onClick={handleNext}>
                        <svg viewBox="0 0 16 16" className="color bi bi-fast-forward-fill" fill="currentColor" height="16" width="16" xmlns="http://www.w3.org/2000/svg">
                            <path d="M7.596 7.304a.802.802 0 0 1 0 1.392l-6.363 3.692C.713 12.69 0 12.345 0 11.692V4.308c0-.653.713-.998 1.233-.696l6.363 3.692Z"></path>
                            <path d="M15.596 7.304a.802.802 0 0 1 0 1.392l-6.363 3.692C8.713 12.69 8 12.345 8 11.692V4.308c0-.653.713-.998 1.233-.696l6.363 3.692Z"></path>
                        </svg>
                    </button>
                </div>

                <div className="bar">
                     <button>
                        <Shuffle className="color1" size={14} />
                    </button>
                     <button>
                        <ListMusic className="color1" size={14} />
                    </button>
                    <button onClick={(e) => handleLike(e, track.id!)} className={cn({ 'text-red-500': isLiked(track.id!) })}>
                       <Heart className="color1" size={14} fill={isLiked(track.id!) ? 'rgba(29, 28, 28, 0.829)' : 'none'}/>
                    </button>
                     <button>
                        <ArrowRight className="color1" size={14} />
                    </button>
                </div>
            </div>
            <div className="two"></div>
            <div className="three"></div>
        </motion.div>
    );
}
