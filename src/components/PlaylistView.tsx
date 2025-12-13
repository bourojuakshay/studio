
'use client';

import React, { useRef } from 'react';
import Image from 'next/image';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { Heart, MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Track } from '@/app/lib/mood-definitions';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useVirtualizer } from '@/hooks/use-virtualizer';

type PlaylistViewProps = {
    tracks: Track[];
    currentTrack: Track | null;
    mood: string;
    handleLike: (e: React.MouseEvent | PanInfo, track: Track) => void;
    isLiked: (track: Track) => boolean;
    openPlayer: (mood: string, index: number) => void;
};

const PlaylistItem = ({ track, index, mood, currentTrack, openPlayer, handleLike, isLiked, style }: { track: Track; index: number; style: React.CSSProperties } & Omit<PlaylistViewProps, 'tracks' | 'virtualizer'>) => {
    const x = useMotionValue(0);
    
    const backgroundScaleX = useTransform(x, [0, 100], [0, 1]);
    const heartScale = useTransform(x, [0, 100], [0.5, 1.2]);
    const heartOpacity = useTransform(x, [0, 70], [0, 1]);

    const onDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        if (info.offset.x > 100) {
            handleLike(info, { ...track, mood, index });
        }
    };
    
    const trackWithContext = { ...track, mood, index };

    return (
        <motion.div 
            className="playlist-list-item-wrapper"
            style={style}
        >
            <motion.div 
                className="playlist-swipe-background"
                style={{ scaleX: backgroundScaleX, transformOrigin: 'left' }}
            >
                <motion.div style={{ scale: heartScale, opacity: heartOpacity }}>
                    <Heart size={24} />
                </motion.div>
            </motion.div>
            <motion.div
                className={cn('playlist-list-item', { active: currentTrack?.src === track.src })}
                onClick={() => openPlayer(mood, index)}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragSnapToOrigin={true}
                onDragEnd={onDragEnd}
                style={{ x }}
                layout
            >
                <Image className="playlist-list-item-cover" src={track.cover} alt={`${track.title} cover`} width={40} height={40} data-ai-hint="song cover" unoptimized={track.cover.startsWith('data:')} />
                <div className="playlist-list-item-info">
                    <div className="song-title-wrapper">
                        <div className="title">{track.title}</div>
                        <button onClick={(e) => handleLike(e, trackWithContext)} className={cn('like-btn control-btn !p-0 h-auto', { 'liked': isLiked(trackWithContext) })}>
                            <Heart size={16} />
                        </button>
                    </div>
                    <div className="artist">{track.artist}</div>
                </div>
                <div className="actions">
                    <button onClick={(e) => e.stopPropagation()} className="control-btn more-btn">
                        <MoreVertical size={18} />
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};


export function PlaylistView({ tracks, currentTrack, mood, handleLike, isLiked, openPlayer }: PlaylistViewProps) {
    
    const scrollRef = useRef<HTMLDivElement>(null);
    const { virtualItems, totalHeight } = useVirtualizer({
      count: tracks?.length ?? 0,
      getScrollElement: () => scrollRef.current,
      estimateSize: () => 64, // Estimate height of each item
      overscan: 5, // Render 5 extra items above and below the visible area
    });

    const playlistVariants = {
        hidden: { opacity: 0, x: 50 },
        visible: { 
            opacity: 1, 
            x: 0, 
            transition: { 
                duration: 0.5, 
                ease: 'easeOut',
            } 
        }
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
            <ScrollArea className="playlist-scroll-area" ref={scrollRef}>
                <motion.div 
                    className="playlist-list"
                    style={{ height: totalHeight }}
                    variants={playlistVariants}
                    initial="hidden"
                    animate="visible"
                >
                    {virtualItems.map((virtualItem) => {
                        const track = tracks[virtualItem.index];
                        return (
                           <PlaylistItem
                                key={virtualItem.key}
                                track={track}
                                index={virtualItem.index}
                                mood={mood}
                                currentTrack={currentTrack}
                                openPlayer={openPlayer}
                                handleLike={handleLike}
                                isLiked={isLiked}
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: `${virtualItem.size}px`,
                                    transform: `translateY(${virtualItem.start}px)`,
                                }}
                            />
                        )
                    })}
                </motion.div>
            </ScrollArea>
        </div>
    );
}

