
'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, SkipBack, Play, Pause, SkipForward, Volume1, Volume2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Track } from '@/app/lib/mood-definitions';
import { useAppContext } from '@/context/AppContext';
import { Slider } from './ui/slider';

type PersistentPlayerProps = {
    track: Track;
    isPlaying: boolean;
    handlePlayPause: () => void;
    handleNext: () => void;
    handlePrev: () => void;
    handleLike: (e: React.MouseEvent, track: Track) => void;
    isLiked: (track: Track) => boolean;
    setNowPlaying: (nowPlaying: { mood: string, index: number } | null) => void;
    progress: { currentTime: number; duration: number };
    handleSeek: (time: number) => void;
    volume: number;
    setVolume: (volume: number) => void;
};

const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export function PersistentPlayer({ 
    track, 
    isPlaying, 
    handlePlayPause, 
    handleNext, 
    handlePrev, 
    handleLike, 
    isLiked, 
    setNowPlaying,
    progress,
    handleSeek,
    volume,
    setVolume
}: PersistentPlayerProps) {
    
    if (!track) return null;

    const onProgressBarChange = (value: number[]) => {
      if (!progress.duration) return;
      handleSeek(value[0]);
    };

    return (
        <motion.div 
            className="footer-player"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: 'tween', ease: 'easeOut', duration: 0.3 }}
        >
            <div className="footer-player-info">
                <Image src={track.cover} alt={track.title} width={56} height={56} unoptimized={track.cover.startsWith('data:')}/>
                <div className="footer-player-info-text">
                    <div className="title">{track.title}</div>
                    <div className="artist">{track.artist}</div>
                </div>
                 <button onClick={(e) => handleLike(e, track)} className={cn('like-btn control-btn', { 'liked': isLiked(track) })}>
                    <Heart size={18} />
                </button>
            </div>
            
            <div className="footer-player-center">
                 <div className="footer-player-controls">
                    <button onClick={handlePrev} className="control-btn"><SkipBack /></button>
                    <button onClick={handlePlayPause} className="play-main-btn control-btn">
                        {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                    </button>
                    <button onClick={handleNext} className="control-btn"><SkipForward /></button>
                </div>
                <div className="footer-player-progress">
                    <span className="time-display">{formatTime(progress.currentTime)}</span>
                    <Slider
                      value={[progress.currentTime]}
                      max={progress.duration || 100}
                      onValueChange={onProgressBarChange}
                      className="w-full"
                    />
                    <span className="time-display">{formatTime(progress.duration)}</span>
                </div>
            </div>

            <div className="footer-player-right">
                <div className="volume-control">
                    <button className="control-btn">
                         {volume > 0.5 ? <Volume2 size={20} /> : <Volume1 size={20} />}
                    </button>
                    <Slider 
                        defaultValue={[volume]} 
                        max={1} 
                        step={0.01} 
                        onValueChange={(value) => setVolume(value[0])}
                        className="volume-slider" 
                    />
                </div>
                <button onClick={() => setNowPlaying(null)} className="control-btn close-btn">
                    <X size={20} />
                </button>
            </div>
        </motion.div>
    );
}
