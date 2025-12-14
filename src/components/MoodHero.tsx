
'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { SkipBack, SkipForward, Play, Pause, Heart, Volume1, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MoodDefinition, Track } from '@/app/lib/mood-definitions';

type MoodHeroProps = {
    definition: MoodDefinition;
    nowPlaying: { mood: string; index: number } | null;
    isPlaying: boolean;
    currentTrack: Track | null;
    tracks: Track[];
    mood: string;
    volume: number;
    setVolume: (volume: number) => void;
    handlePlayPause: () => void;
    handleNext: () => void;
    handlePrev: () => void;
    handleLike: (e: React.MouseEvent, track: Track) => void;
    isLiked: (track: Track) => boolean;
    progress: { currentTime: number; duration: number; };
    handleSeek: (time: number) => void;
};

const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export function MoodHero({
    definition,
    nowPlaying,
    isPlaying,
    currentTrack,
    tracks,
    mood,
    volume,
    setVolume,
    handlePlayPause,
    handleNext,
    handlePrev,
    handleLike,
    isLiked,
    progress,
    handleSeek,
}: MoodHeroProps) {
    const [isVolumeOpen, setIsVolumeOpen] = useState(false);
    const trackPlaying = nowPlaying?.mood === mood ? currentTrack : null;
    const displayTrack = trackPlaying || tracks?.[0];

    const heroVariants = {
      hidden: { opacity: 0, x: -50 },
      visible: { opacity: 1, x: 0, transition: { duration: 0.5, ease: 'easeOut' } }
    };

    const onProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const { clientX, currentTarget } = e;
        const { left, width } = currentTarget.getBoundingClientRect();
        const clickPosition = clientX - left;
        const seekRatio = clickPosition / width;
        const seekTime = progress.duration * seekRatio;
        handleSeek(seekTime);
    };

    const progressPercentage = progress.duration > 0 ? (progress.currentTime / progress.duration) * 100 : 0;
    
    return (
        <motion.div className="mood-hero" variants={heroVariants}>
            <div>
                <h2>{definition.title}</h2>
                <p>{definition.subtitle}</p>
            </div>
            {displayTrack ? (
                <div 
                    className={cn("now-playing-card", { "is-playing": isPlaying && nowPlaying?.mood === mood })}
                >
                    <div className="card__content">
                        <div className="card__badge">NOW PLAYING</div>
                        <div className="card__image">
                            <Image src={displayTrack.cover} alt={displayTrack.title} layout="fill" objectFit="cover" unoptimized={displayTrack.cover.startsWith('data:')} />
                        </div>
                        <div className="card__text">
                            <h3 className="card__title">{displayTrack.title}</h3>
                            <p className="card__description">{displayTrack.artist}</p>
                        </div>
                        <div className="card__footer">
                            <div className="progress-bar-container" onClick={onProgressBarClick}>
                                <div className="progress-bar" style={{ width: `${progressPercentage}%` }}></div>
                            </div>
                            <div className="time-display">
                                <span>{formatTime(progress.currentTime)}</span>
                                <span>{formatTime(progress.duration)}</span>
                            </div>
                            <div className="player-controls">
                                <div className="main-controls">
                                    <button onClick={handlePrev} className="control-btn"><SkipBack size={20} /></button>
                                    <button onClick={handlePlayPause} className="play-main-btn">
                                        {(isPlaying && nowPlaying?.mood === mood) ? <Pause size={24} /> : <Play size={24} />}
                                    </button>
                                    <button onClick={handleNext} className="control-btn"><SkipForward size={20}/></button>
                                </div>
                                <div className="secondary-controls">
                                    <button onClick={(e) => handleLike(e, { ...displayTrack, mood: mood, index: nowPlaying?.index ?? 0 })} className={cn('like-btn control-btn', { 'liked': isLiked(displayTrack) })}>
                                        <Heart size={20} />
                                    </button>
                                    <div className="volume-control">
                                        <button onClick={() => setIsVolumeOpen(!isVolumeOpen)} className="volume-btn control-btn">
                                            {volume > 0.5 ? <Volume2 size={20} /> : <Volume1 size={20} />}
                                        </button>
                                        {isVolumeOpen && (
                                            <input type="range" min="0" max="1" step="0.01" value={volume} onChange={(e) => setVolume(parseFloat(e.target.value))} className="volume-slider" />
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : <div />}
        </motion.div>
    );
}

    
