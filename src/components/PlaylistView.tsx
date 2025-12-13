
'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Track } from '@/app/lib/mood-definitions';
import { ScrollArea } from '@/components/ui/scroll-area';

type PlaylistViewProps = {
    tracks: Track[];
    currentTrack: Track | null;
    mood: string;
    handleLike: (e: React.MouseEvent, track: Track) => void;
    isLiked: (track: Track) => boolean;
    openPlayer: (mood: string, index: number) => void;
};

export function PlaylistView({ tracks, currentTrack, mood, handleLike, isLiked, openPlayer }: PlaylistViewProps) {
    
    const playlistVariants = {
        hidden: { opacity: 0, x: 50 },
        visible: { 
            opacity: 1, 
            x: 0, 
            transition: { 
                duration: 0.5, 
                ease: 'easeOut',
                staggerChildren: 0.05
            } 
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    if (!tracks || tracks.length === 0) {
        return (
            <motion.div className="playlist-view" variants={playlistVariants}>
                <div className="playlist-header">
                    <h3>Playlist</h3>
                </div>
                <div className="flex items-center justify-center h-full text-muted-foreground">
                    <p>No songs available for this mood yet.</p>
                </div>
            </motion.div>
        )
    }

    return (
        <div className="playlist-view">
            <motion.div className="playlist-header" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h3>Playlist</h3>
            </motion.div>
            <ScrollArea className="playlist-scroll-area">
                <motion.div 
                    className="playlist-list"
                    variants={playlistVariants}
                    initial="hidden"
                    animate="visible"
                >
                    {tracks.map((track, index) => (
                        <motion.div key={index} variants={itemVariants}>
                            <div className={cn('playlist-list-item', { active: currentTrack?.src === track.src })} onClick={() => openPlayer(mood, index)}>
                                <Image className="playlist-list-item-cover" src={track.cover} alt={`${track.title} cover`} width={48} height={48} data-ai-hint="song cover" unoptimized={track.cover.startsWith('data:')} />
                                <div className="playlist-list-item-info">
                                    <div className="title">{track.title}</div>
                                    <div className="artist">{track.artist}</div>
                                </div>
                                <button onClick={(e) => handleLike(e, { ...track, mood: mood, index: index })} className={cn('like-btn', { 'liked': isLiked(track) })}>
                                    <Heart size={18} />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            </ScrollArea>
        </div>
    );
}
