
'use client';

import React, { useState } from 'react';
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
import { usePlaybackState } from '@/context/AppContext';
import type { Song } from '@/firebase/firestore';
import { useUserPreferences } from '@/hooks/use-user-preferences';
import { useUser, useFirestore } from '@/firebase';
import { setUserSongPreference } from '@/firebase/firestore';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Slider } from '@/components/ui/slider';


export function FloatingPlayerWrapper() {
    const { currentTrack } = usePlaybackState();
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
        <div className="floating-player-wrapper">
            <FloatingPlayer
                track={currentTrack}
                handleLike={handleLike}
                isLiked={isLiked}
                onClose={() => setIsVisible(false)}
            />
        </div>
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
    const { 
        isPlaying,
        progress,
        handlePlayPause, 
        handleNext, 
        handlePrev,
        handleSeek,
    } = usePlaybackState();
    const [isExpanded, setIsExpanded] = useState(false);
    
    const hasTrack = !!track;

    const formatTime = (seconds: number) => {
        if (isNaN(seconds) || seconds < 0) return '0:00';
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const onProgressBarChange = (value: number[]) => {
        if (!progress.duration) return;
        handleSeek(value[0]);
    };

    return (
        <motion.div
            className="player-card"
            whileHover={{ scale: hasTrack ? 1.05 : 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            layout
        >
            <div className="player-card-background">
                <div className="blob one"></div>
                <div className="blob two"></div>
            </div>
            
            <motion.div
                className={cn('player-card-content', isExpanded ? 'expanded' : 'compact')}
                layout
            >
                <div className="player-header">
                    <span>{isExpanded ? "NOW PLAYING" : "MUSIC"}</span>
                     <div className="flex items-center gap-2">
                        <button onClick={() => setIsExpanded(!isExpanded)} className="player-control-button">
                            {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                        </button>
                        <button onClick={onClose} className="player-control-button">
                            <X size={18} />
                        </button>
                    </div>
                </div>

                <motion.div className="album-art" layout="position">
                    {hasTrack && track.cover ? (
                        <Image src={track.cover} alt={track.title} layout="fill" objectFit="cover" unoptimized={track.cover.startsWith('data:')}/>
                    ) : (
                        <div className="icon-placeholder">
                            <Music />
                        </div>
                    )}
                </motion.div>
                
                <motion.div className="track-info" layout="position">
                    <div className="title">{track?.title || 'MoodyO Player'}</div>
                    <div className="artist">{track?.artist || 'Select a song'}</div>
                </motion.div>

                <AnimatePresence>
                {isExpanded && hasTrack && (
                    <motion.div 
                      className="progress-container w-full"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto', transition: { delay: 0.2 } }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                        <Slider 
                            value={[progress.currentTime]} 
                            max={progress.duration || 100}
                            onValueChange={onProgressBarChange}
                            id="player-progress-bar"
                        />
                        <div className="time-display">
                            <span>{formatTime(progress.currentTime)}</span>
                            <span>{formatTime(progress.duration)}</span>
                        </div>
                    </motion.div>
                )}
                </AnimatePresence>
                
                <motion.div className="main-controls" layout="position">
                    <button onClick={handlePrev} disabled={!hasTrack} className="player-control-button">
                        <SkipBack size={isExpanded ? 22 : 20} />
                    </button>
                    <button onClick={handlePlayPause} disabled={!hasTrack} className="player-control-button play-pause-btn">
                        {isPlaying && hasTrack ? <Pause size={isExpanded ? 24: 22} /> : <Play size={isExpanded ? 24: 22} />}
                    </button>
                    <button onClick={handleNext} disabled={!hasTrack} className="player-control-button">
                        <SkipForward size={isExpanded ? 22 : 20} />
                    </button>
                </motion.div>
                
                <AnimatePresence>
                {isExpanded && (
                    <motion.div 
                        className="secondary-controls"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1, transition: { delay: 0.2 } }}
                        exit={{ opacity: 0 }}
                    >
                        <button className="player-control-button"><Shuffle size={18} /></button>
                        <button onClick={(e) => hasTrack && handleLike(e, track.id!)} disabled={!hasTrack} className={cn('player-control-button like-btn', { 'liked': hasTrack && isLiked(track.id!) })}>
                           <Heart size={18} fill={hasTrack && isLiked(track.id!) ? 'currentColor' : 'none'}/>
                        </button>
                        <button className="player-control-button"><ListMusic size={18} /></button>
                    </motion.div>
                )}
                </AnimatePresence>
            </motion.div>
        </motion.div>
    );
}
