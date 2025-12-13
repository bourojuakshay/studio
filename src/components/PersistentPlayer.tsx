
'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ListMusic, Heart, SkipBack, Play, Pause, SkipForward } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { Track } from '@/app/lib/mood-definitions';

type PersistentPlayerProps = {
    track: Track;
    isPlaying: boolean;
    playlist: Track[];
    handlePlayPause: () => void;
    handleNext: () => void;
    handlePrev: () => void;
    handleLike: (e: React.MouseEvent, track: Track) => void;
    isLiked: (track: Track) => boolean;
    openPlayer: (mood: string, index: number) => void;
    nowPlaying: { mood: string, index: number };
    setNowPlaying: (nowPlaying: { mood: string, index: number } | null) => void;
};

export function PersistentPlayer({ track, isPlaying, playlist, handlePlayPause, handleNext, handlePrev, handleLike, isLiked, openPlayer, nowPlaying, setNowPlaying }: PersistentPlayerProps) {
    const [isPlaylistOpen, setIsPlaylistOpen] = useState(false);

    if (!track) return null;

    return (
        <motion.div 
            className="persistent-player-wrapper"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ type: 'spring', stiffness: 100 }}
        >
            <AnimatePresence>
                {isPlaylistOpen && (
                    <motion.div
                        className="persistent-playlist-bar"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                    >
                        <div className="persistent-playlist-header">
                            <h4>Up Next</h4>
                            <button onClick={() => setIsPlaylistOpen(false)}><X size={18} /></button>
                        </div>
                        <ScrollArea className="playlist-scroll-area">
                            <div className="playlist-list">
                                {playlist && playlist.map((item, index) => (
                                    <div 
                                        key={index}
                                        className={cn('playlist-list-item', { active: track.src === item.src })}
                                        onClick={() => openPlayer(nowPlaying.mood, index)}
                                    >
                                        <Image src={item.cover} alt={item.title} width={32} height={32} className="playlist-list-item-cover" unoptimized={item.cover.startsWith('data:')}/>
                                        <div className="playlist-list-item-info">
                                            <div className="title">{item.title}</div>
                                            <div className="artist">{item.artist}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="persistent-player-card">
                <div className="one">
                    <span className="title">Now Playing</span>
                    <div className="music">
                        <Image src={track.cover} alt={track.title} width={80} height={80} unoptimized={track.cover.startsWith('data:')} />
                    </div>
                    <div className="info-controls-wrapper">
                        <span className="name">{track.title}</span>
                        <span className="name1">{track.artist}</span>
                        <div className="bar">
                            <button onClick={handlePrev}>
                                <SkipBack size={18} className="color" />
                            </button>
                            <button onClick={handlePlayPause}>
                                {isPlaying ? (
                                    <Pause size={22} className="color1" />
                                ) : (
                                    <Play size={22} className="color1" />
                                )}
                            </button>
                            <button onClick={handleNext}>
                                <SkipForward size={18} className="color" />
                            </button>
                        </div>
                    </div>
                     <div className="bar">
                        <button onClick={() => setIsPlaylistOpen(!isPlaylistOpen)}>
                            <ListMusic size={16} className="color1" />
                        </button>
                        <button onClick={(e) => handleLike(e, track)}>
                            <Heart size={16} className={cn('color1', {'text-red-500 fill-current': isLiked(track)})} />
                        </button>
                        <button onClick={() => { setIsPlaylistOpen(false); setNowPlaying(null); }}>
                             <X size={16} className="color1" />
                        </button>
                    </div>
                </div>
                <div className="two"></div>
                <div className="three"></div>
            </div>
        </motion.div>
    );
}

    