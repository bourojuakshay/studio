
'use client';

import React, { useState } from 'react';
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
    isLiked
}: MoodHeroProps) {
    const [isVolumeOpen, setIsVolumeOpen] = useState(false);
    const trackPlaying = nowPlaying?.mood === mood ? currentTrack : null;
    const displayTrack = trackPlaying || tracks?.[0];

    const heroVariants = {
      hidden: { opacity: 0, x: -50 },
      visible: { opacity: 1, x: 0, transition: { duration: 0.5, ease: 'easeOut' } }
    };
    
    return (
        <motion.div className="mood-hero" variants={heroVariants}>
            <div className="emoji">{definition.emoji}</div>
            <div>
                <h2>{definition.title}</h2>
                <p>{definition.subtitle}</p>
            </div>
            {displayTrack ? (
                <div className="now-playing-card">
                     <Image className="player-cover" src={displayTrack.cover} alt={displayTrack.title} width={150} height={150} data-ai-hint="song cover" unoptimized={displayTrack.cover.startsWith('data:')} />
                    <div className="player-details">
                        <div className="player-info">
                            {(isPlaying && nowPlaying?.mood === mood) && (
                                <div className="sound-wave">
                                    <span /><span /><span />
                                </div>
                            )}
                            <div>
                                <h3>{displayTrack.title}</h3>
                                <p>{displayTrack.artist}</p>
                            </div>
                        </div>
                        <div className="player-controls">
                            <button onClick={handlePrev}><SkipBack size={20} /></button>
                            <button onClick={handlePlayPause} className="play-main-btn">
                                {(isPlaying && nowPlaying?.mood === mood) ? <Pause size={24} /> : <Play size={24} />}
                            </button>
                            <button onClick={handleNext}><SkipForward size={20}/></button>
                             <button onClick={(e) => handleLike(e, { ...displayTrack, mood: mood, index: nowPlaying?.index ?? 0 })} className={cn('like-btn', { 'liked': isLiked(displayTrack) })}>
                                <Heart size={20} />
                            </button>
                            <div className="volume-control">
                                <button onClick={() => setIsVolumeOpen(!isVolumeOpen)} className="volume-btn">
                                    {volume > 0.5 ? <Volume2 size={20} /> : <Volume1 size={20} />}
                                </button>
                                {isVolumeOpen && (
                                    <input type="range" min="0" max="1" step="0.01" value={volume} onChange={(e) => setVolume(parseFloat(e.target.value))} className="volume-slider" />
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            ) : <div />}
        </motion.div>
    );
}
