
'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { SkipBack, SkipForward, Play, Pause, Heart, Volume1, Volume2, Plus } from 'lucide-react';
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
                    <div className="card__shine"></div>
                    <div className="card__glow"></div>
                    <div className="card__content">
                        <div className="card__badge">NOW PLAYING</div>
                        <div className="card__image">
                            <Image src={displayTrack.cover} alt={displayTrack.title} layout="fill" objectFit="cover" unoptimized={displayTrack.cover.startsWith('data:')} />
                        </div>
                        <div className="card__text">
                            <h3 className="card__title">{displayTrack.title}</h3>
                            <p className="card__description">{displayTrack.artist}</p>
                        </div>
                        <div className="player-controls">
                            <button onClick={handlePrev} className="control-btn"><SkipBack size={20} /></button>
                            <button onClick={handlePlayPause} className="play-main-btn">
                                {(isPlaying && nowPlaying?.mood === mood) ? <Pause size={24} /> : <Play size={24} />}
                            </button>
                            <button onClick={handleNext} className="control-btn"><SkipForward size={20}/></button>
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
            ) : <div />}
        </motion.div>
    );
}
