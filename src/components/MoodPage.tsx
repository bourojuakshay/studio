
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import type { MoodDefinition } from '@/app/lib/mood-definitions';
import { MoodHero } from './MoodHero';
import { PlaylistView } from './PlaylistView';
import type { Song } from '@/firebase/firestore';

type MoodPageProps = {
  mood: string;
  definition?: MoodDefinition;
  tracks: Song[];
  nowPlayingId: string | null;
  isPlaying: boolean;
  currentTrack: Song | null;
  handlePlayPause: () => void;
  handleNext: () => void;
  handlePrev: () => void;
  handleLike: (e: React.MouseEvent, songId: string) => void;
  isLiked: (songId: string) => boolean;
  openPlayer: (songId: string, contextMood: string) => void;
  progress: { currentTime: number; duration: number; };
  handleSeek: (time: number) => void;
};

export function MoodPage({
  mood,
  definition,
  tracks,
  nowPlayingId,
  isPlaying,
  currentTrack,
  handlePlayPause,
  handleNext,
  handlePrev,
  handleLike,
  isLiked,
  openPlayer,
  progress,
  handleSeek,
}: MoodPageProps) {

  // Guard against rendering if the mood definition is missing.
  if (!definition) {
    return null;
  }

  const pageVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.1,
      } 
    },
    exit: { opacity: 0 }
  };

  return (
    <motion.section
      key={mood}
      id={mood}
      className="page active"
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <div className="mood-page-layout">
        <MoodHero
          definition={definition}
          nowPlayingId={nowPlayingId}
          isPlaying={isPlaying}
          currentTrack={currentTrack}
          tracks={tracks}
          mood={mood}
          handlePlayPause={handlePlayPause}
          handleNext={handleNext}
          handlePrev={handlePrev}
          handleLike={handleLike}
          isLiked={isLiked}
          progress={progress}
          handleSeek={handleSeek}
        />
        <PlaylistView
          tracks={tracks}
          currentTrack={currentTrack}
          mood={mood}
          handleLike={handleLike}
          isLiked={isLiked}
          openPlayer={openPlayer}
        />
      </div>
    </motion.section>
  );
}
