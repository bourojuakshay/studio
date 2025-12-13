
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { MoodDefinition, Track } from '@/app/page';
import { MoodHero } from './MoodHero';
import { PlaylistView } from './PlaylistView';

type MoodPageProps = {
  mood: string;
  definition: MoodDefinition;
  tracks: Track[];
  nowPlaying: { mood: string; index: number } | null;
  isPlaying: boolean;
  currentTrack: Track | null;
  volume: number;
  setVolume: (volume: number) => void;
  handlePlayPause: () => void;
  handleNext: () => void;
  handlePrev: () => void;
  handleLike: (e: React.MouseEvent, track: Track) => void;
  isLiked: (track: Track) => boolean;
  openPlayer: (mood: string, index: number) => void;
};

export function MoodPage({
  mood,
  definition,
  tracks,
  nowPlaying,
  isPlaying,
  currentTrack,
  volume,
  setVolume,
  handlePlayPause,
  handleNext,
  handlePrev,
  handleLike,
  isLiked,
  openPlayer,
}: MoodPageProps) {

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
          nowPlaying={nowPlaying}
          isPlaying={isPlaying}
          currentTrack={currentTrack}
          tracks={tracks}
          mood={mood}
          volume={volume}
          setVolume={setVolume}
          handlePlayPause={handlePlayPause}
          handleNext={handleNext}
          handlePrev={handlePrev}
          handleLike={handleLike}
          isLiked={isLiked}
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
