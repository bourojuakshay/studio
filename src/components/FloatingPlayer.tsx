
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
import { Button } from '@/components/ui/button';

const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const PlayerProgress = () => {
    const { progress, handleSeek } = usePlaybackState(state => ({ progress: state.progress, handleSeek: state.handleSeek }));

    const onSliderChange = (value: number[]) => {
      if (progress.duration) {
        handleSeek(value[0]);
      }
    };

    return (
        <div className="player-progress-wrapper">
            <span className="time-label">{formatTime(progress.currentTime)}</span>
            <Slider
                className="slider"
                value={[progress.currentTime]}
                max={progress.duration || 100}
                onValueChange={onSliderChange}
            />
            <span className="time-label">{formatTime(progress.duration)}</span>
        </div>
    );
};


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
    
    if (!currentTrack || !isVisible) { 
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
    
    useEffect(() => {
        if (isExpanded) {
            document.documentElement.classList.add('no-scroll');
        } else {
            document.documentElement.classList.remove('no-scroll');
        }
        return () => document.documentElement.classList.remove('no-scroll');
    }, [isExpanded]);


    return (
        <>
            <motion.div
                layout
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 50, scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className={cn('player-card', { 'is-expanded-mode': isExpanded })}
            >
                {hasTrack && (
                    <div className="player-card-background">
                         <Image src={track.cover} alt="" layout="fill" />
                    </div>
                )}
                <div className="player-card-content">
                    <header className="player-card-header">
                        <div className="player-card-cover">
                            {hasTrack ? (
                                <Image src={track.cover} alt={track.title} layout="fill" unoptimized={track.cover.startsWith('data:')} />
                            ) : (
                                <div className="music-icon"><Music /></div>
                            )}
                        </div>
                        <div className="player-card-info">
                            <h4>{track?.title || 'MoodyO Player'}</h4>
                            <p>{track?.artist || 'Select a song'}</p>
                        </div>
                        <Button variant="ghost" size="icon" className="player-card-close-btn" onClick={() => setIsExpanded(true)}>
                            <Maximize2 size={16}/>
                        </Button>
                         <Button variant="ghost" size="icon" className="player-card-close-btn" onClick={onClose}>
                            <X size={16}/>
                        </Button>
                    </header>
                    
                    <main>
                         <div className="player-card-controls">
                            <button onClick={(e) => hasTrack && handleLike(e, track.id!)} disabled={!hasTrack} className={cn('player-control-button like-btn', { 'liked': hasTrack && isLiked(track.id!) })}>
                                <Heart size={18} />
                            </button>
                            <div className="flex items-center gap-2">
                                <button onClick={handlePrev} disabled={!hasTrack} className="player-control-button">
                                    <SkipBack size={18} />
                                </button>
                                <button onClick={handlePlayPause} disabled={!hasTrack} className="player-control-button text-foreground">
                                    {isPlaying ? <Pause size={22} /> : <Play size={22} />}
                                </button>
                                <button onClick={handleNext} disabled={!hasTrack} className="player-control-button">
                                    <SkipForward size={18} />
                                </button>
                            </div>
                            <button className="player-control-button"><ListMusic size={18} /></button>
                        </div>
                        <PlayerProgress />
                    </main>
                </div>
            </motion.div>

            <AnimatePresence>
                {isExpanded && hasTrack && (
                    <motion.div 
                        className="player-card-expanded"
                        initial={{ opacity: 0, y: '100%' }}
                        animate={{ opacity: 1, y: '0%' }}
                        exit={{ opacity: 0, y: '100%' }}
                        transition={{ duration: 0.5, ease: 'easeInOut' }}
                    >
                         <div className="player-card-expanded-bg">
                            <Image src={track.cover} alt="" layout="fill" />
                        </div>
                        
                        <div className="expanded-secondary-controls">
                             <Button variant="ghost" size="icon" onClick={() => setIsExpanded(false)}>
                                <Minimize2 />
                            </Button>
                        </div>

                        <motion.div layoutId="player-cover" className="expanded-cover">
                            <Image src={track.cover} alt={track.title} layout="fill" unoptimized={track.cover.startsWith('data:')}/>
                        </motion.div>

                        <div className="expanded-info">
                            <h2>{track.title}</h2>
                            <p>{track.artist}</p>
                        </div>
                        
                        <div className="expanded-controls-wrapper">
                            <div className="expanded-progress">
                                <PlayerProgress />
                            </div>
                            <div className="expanded-main-controls">
                                <button className="player-control-button"><Shuffle/></button>
                                <button onClick={handlePrev} className="player-control-button"><SkipBack /></button>
                                <button onClick={handlePlayPause} className="play-pause-btn">
                                    {isPlaying ? <Pause /> : <Play />}
                                </button>
                                <button onClick={handleNext} className="player-control-button"><SkipForward /></button>
                                <button onClick={(e) => handleLike(e, track.id!)} className={cn('player-control-button like-btn', { 'liked': isLiked(track.id!) })}>
                                    <Heart />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
