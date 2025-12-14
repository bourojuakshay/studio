
'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Heart, SkipBack, Play, Pause, SkipForward, X, Maximize, Minimize } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppContext, usePlaybackState } from '@/context/AppContext';
import { Slider } from './ui/slider';
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
        <FloatingPlayer
            track={currentTrack}
            handleLike={handleLike}
            isLiked={isLiked}
        />
    );
}

type FloatingPlayerProps = {
    track: Song;
    handleLike: (e: React.MouseEvent, songId: string) => void;
    isLiked: (songId: string) => boolean;
};

const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export function FloatingPlayer({ 
    track, 
    handleLike, 
    isLiked, 
}: FloatingPlayerProps) {
    const { 
        isPlaying, 
        progress, 
        handlePlayPause, 
        handleNext, 
        handlePrev,
        handleSeek,
        setNowPlayingId
    } = usePlaybackState();
    
    const [isExpanded, setIsExpanded] = useState(false);

    if (!track) return null;

    const onProgressBarChange = (value: number[]) => {
      if (!progress.duration) return;
      handleSeek(value[0]);
    };

    const playerVariants = {
        hidden: { opacity: 0, y: 100 },
        visible: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: 100 },
    };
    
    return (
        <motion.div 
            className="floating-player"
            data-expanded={isExpanded}
            variants={playerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ type: 'spring', damping: 20, stiffness: 100 }}
            layout
        >
            <div className="floating-player-top-controls">
                <button onClick={() => setIsExpanded(!isExpanded)} className="control-btn">
                    {isExpanded ? <Minimize size={20} /> : <Maximize size={20} />}
                </button>
                <button onClick={() => setNowPlayingId(null)} className="control-btn">
                    <X size={20} />
                </button>
            </div>

            <motion.div className="floating-player-content" layout="position">
                <motion.div className="floating-player-cover" layout="position">
                    <Image src={track.cover} alt={track.title} layout="fill" unoptimized={track.cover.startsWith('data:')}/>
                </motion.div>
                
                <motion.div className="floating-player-details" layout="position">
                    <div className="floating-player-info">
                        <div className="title">{track.title}</div>
                        <div className="artist">{track.artist}</div>
                    </div>

                    <div className="floating-player-controls-wrapper">
                        <div className="floating-player-progress">
                            <span className="time-display">{formatTime(progress.currentTime)}</span>
                            <Slider
                              value={[progress.currentTime]}
                              max={progress.duration || 100}
                              onValueChange={onProgressBarChange}
                              className="w-full"
                            />
                            <span className="time-display">{formatTime(progress.duration)}</span>
                        </div>
                        <div className="floating-player-controls">
                            <button onClick={(e) => handleLike(e, track.id!)} className={cn('like-btn control-btn', { 'liked': isLiked(track.id!) })}>
                                <Heart />
                            </button>
                            <button onClick={handlePrev} className="control-btn"><SkipBack /></button>
                            <button onClick={handlePlayPause} className="play-main-btn control-btn">
                                {isPlaying ? <Pause /> : <Play />}
                            </button>
                            <button onClick={handleNext} className="control-btn"><SkipForward /></button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </motion.div>
    );
}
