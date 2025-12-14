
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
    
    // The wrapper will now always render the player structure.
    // The FloatingPlayer component inside will handle conditional content.
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
    track: Song | null; // Track can be null
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
    
    const playerVariants = {
        hidden: { opacity: 0, y: 100 },
        visible: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: 100 },
    };
    
    const hasTrack = !!track;
    
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
                    {hasTrack && track.cover ? (
                        <Image src={track.cover} alt={track.title} layout="fill" objectFit="cover" unoptimized={track.cover.startsWith('data:')}/>
                    ) : (
                        <svg viewBox="0 0 16 16" className="note bi bi-music-note" fill="currentColor" height="18" width="18" xmlns="http://www.w3.org/2000/svg" >
                            <path d="M9 13c0 1.105-1.12 2-2.5 2S4 14.105 4 13s1.12-2 2.5-2 2.5.895 2.5 2z"></path>
                            <path d="M9 3v10H8V3h1z" fillRule="evenodd"></path>
                            <path d="M8 2.82a1 1 0 0 1 .804-.98l3-.6A1 1 0 0 1 13 2.22V4L8 5V2.82z" ></path>
                        </svg>
                    )}
                </div>
                <span className="name">{track?.title || 'MoodyO Player'}</span>
                <span className="name1">{track?.artist || 'Select a song to play'}</span>
                
                <div className="bar">
                    <button onClick={handlePrev} disabled={!hasTrack}>
                        <SkipBack className="color" size={18} />
                    </button>
                    <button onClick={handlePlayPause} disabled={!hasTrack}>
                        {isPlaying && hasTrack ? <Pause className="color" size={18} /> : <Play className="color" size={18} />}
                    </button>
                    <button onClick={handleNext} disabled={!hasTrack}>
                        <SkipForward className="color" size={18} />
                    </button>
                </div>

                <div className="bar">
                     <button>
                        <Shuffle className="color1" size={14} />
                    </button>
                     <button>
                        <ListMusic className="color1" size={14} />
                    </button>
                    <button onClick={(e) => hasTrack && handleLike(e, track.id!)} disabled={!hasTrack} className={cn({ 'text-red-500': hasTrack && isLiked(track.id!) })}>
                       <Heart className="color1" size={14} fill={hasTrack && isLiked(track.id!) ? 'rgba(29, 28, 28, 0.829)' : 'none'}/>
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
