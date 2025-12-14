
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import type { MoodDefinition } from '@/app/lib/mood-definitions';
import { MoodHero } from './MoodHero';
import { PlaylistView } from './PlaylistView';
import type { Song } from '@/firebase/firestore';
import { usePlaybackState } from '@/context/AppContext';

type MoodPageProps = {
  mood: string;
  definition?: MoodDefinition;
  tracks: Song[];
  handleLike: (e: React.MouseEvent, songId: string) => void;
  isLiked: (songId: string) => boolean;
  openPlayer: (songId: string, contextMood: string) => void;
};

export function MoodPage({
  mood,
  definition,
  tracks,
  handleLike,
  isLiked,
  openPlayer,
}: MoodPageProps) {

  const { currentTrack } = usePlaybackState();

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
          tracks={tracks}
          mood={mood}
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
