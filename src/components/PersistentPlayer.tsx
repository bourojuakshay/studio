
'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ListMusic, Heart } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { Track } from '@/app/page';

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
};

export function PersistentPlayer({ track, isPlaying, playlist, handlePlayPause, handleNext, handlePrev, handleLike, isLiked, openPlayer, nowPlaying }: PersistentPlayerProps) {
    const [isPlaylistOpen, setIsPlaylistOpen] = useState(false);

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
                                {playlist.map((item, index) => (
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
                    <span className="name">{track.title}</span>
                    <span className="name1">{track.artist}</span>
                    <div className="bar">
                        <button onClick={handlePrev}>
                            <svg viewBox="0 0 16 16" className="color bi bi-fast-forward-fill" fill="currentColor" height="16" width="16" xmlns="http://www.w3.org/2000/svg" style={{ transform: 'rotate(180deg)' }}>
                                <path d="M7.596 7.304a.802.802 0 0 1 0 1.392l-6.363 3.692C.713 12.69 0 12.345 0 11.692V4.308c0-.653.713-.998 1.233-.696l6.363 3.692Z"></path>
                                <path d="M15.596 7.304a.802.802 0 0 1 0 1.392l-6.363 3.692C8.713 12.69 8 12.345 8 11.692V4.308c0-.653.713-.998 1.233-.696l6.363 3.692Z"></path>
                            </svg>
                        </button>
                        <button onClick={handlePlayPause}>
                            <svg viewBox="0 0 16 16" className="color bi bi-caret-right-fill" fill="currentColor" height="18" width="18" xmlns="http://www.w3.org/2000/svg">
                                {isPlaying ? (
                                    <path d="M5.5 3.5A1.5 1.5 0 0 1 7 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5zm5 0A1.5 1.5 0 0 1 12 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5z"/>
                                ) : (
                                    <path d="m12.14 8.753-5.482 4.796c-.646.566-1.658.106-1.658-.753V3.204a1 1 0 0 1 1.659-.753l5.48 4.796a1 1 0 0 1 0 1.506z"></path>
                                )}
                            </svg>
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
                            <svg viewBox="0 0 16 16" className="color1 bi bi-shuffle" fill="currentColor" height="14" width="14" xmlns="http://www.w3.org/2000/svg">
                                <path d="M0 3.5A.5.5 0 0 1 .5 3H1c2.202 0 3.827 1.24 4.874 2.418.49.552.865 1.102 1.126 1.532.26-.43.636-.98 1.126-1.532C9.173 4.24 10.798 3 13 3v1c-1.798 0-3.173 1.01-4.126 2.082A9.624 9.624 0 0 0 7.556 8a9.624 9.624 0 0 0 1.317 1.918C9.828 10.99 11.204 12 13 12v1c-2.202 0-3.827-1.24-4.874-2.418A10.595 10.595 0 0 1 7 9.05c-.26.43-.636.98-1.126 1.532C4.827 11.76 3.202 13 1 13H.5a.5.5 0 0 1 0-1H1c1.798 0 3.173-1.01 4.126-2.082A9.624 9.624 0 0 0 6.444 8a9.624 9.624 0 0 0-1.317-1.918C4.172 5.01 2.796 4 1 4H.5a.5.5 0 0 1-.5-.5z" fillRule="evenodd"></path>
                                <path d="M13 5.466V1.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384l-2.36 1.966a.25.25 0 0 1-.41-.192zm0 9v-3.932a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384l-2.36 1.966a.25.25 0 0 1-.41-.192z"></path>
                            </svg>
                        </button>
                         <button onClick={() => setIsPlaylistOpen(!isPlaylistOpen)}>
                            <ListMusic size={14} className="color1" />
                        </button>
                        <button onClick={(e) => handleLike(e, track)}>
                            <Heart size={14} className={cn('color1', {'text-red-500 fill-current': isLiked(track)})} />
                        </button>
                        <button onClick={() => { setIsPlaylistOpen(false); setNowPlaying(null); }}>
                             <X size={14} className="color1" />
                        </button>
                    </div>
                </div>
                <div className="two"></div>
                <div className="three"></div>
            </div>
        </motion.div>
    );
}

