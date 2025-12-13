
'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { gsap } from 'gsap';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, Wand2, Loader, Home as HomeIcon, Github } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { generateMood, GenerateMoodInput } from '@/ai/flows/mood-generator';
import { generateImage } from '@/ai/flows/image-generator';
import { ThemeProvider } from '@/components/theme-provider';
import { PersistentPlayer } from '@/components/PersistentPlayer';
import { MoodPage } from '@/components/MoodPage';


export const dynamic = 'force-dynamic';

// --- Data Definitions ---
export type MoodDefinition = {
  title: string;
  subtitle: string;
  accent: string;
  bg: string;
  emoji: string;
  themeClass: string;
};

const MOOD_DEFS: { [key: string]: MoodDefinition } = {
  happy: {
    title: 'Happy',
    subtitle: 'Feel-good tracks with a deep groove',
    accent: 'hsl(var(--primary))',
    bg: 'linear-gradient(43deg, hsl(var(--primary)) 0%, #4c1d95 100%)',
    emoji: '😄',
    themeClass: 'happy-active',
  },
  joyful: {
    title: 'Joyful',
    subtitle: 'High-energy songs — perfect for smiles and movement',
    accent: 'hsl(var(--primary))',
    bg: 'linear-gradient(43deg, hsl(var(--primary)) 0%, #4c1d95 100%)',
    emoji: '🥳',
    themeClass: 'joyful-active',
  },
  sad: {
    title: 'Sad',
    subtitle: 'Slow, emotional tracks to reflect',
    accent: 'hsl(var(--primary))',
    bg: 'linear-gradient(43deg, hsl(var(--primary)) 0%, #4c1d95 100%)',
    emoji: '😢',
    themeClass: 'sad-active',
  },
  depression: {
    title: 'Depression',
    subtitle: 'Ambient textures and slow soundscapes',
    accent: 'hsl(var(--primary))',
    bg: 'linear-gradient(43deg, hsl(var(--primary)) 0%, #4c1d95 100%)',
    emoji: '😔',
    themeClass: 'depression-active',
  }
};

export type Track = {
  title: string;
  artist: string;
  src: string;
  cover: string;
  mood?: string;
  index?: number;
};


const SAMPLE_TRACKS = (baseIdx = 1): Track[] => Array.from({ length: 10 }, (_, i) => ({
  title: ['Sunny Days', 'Golden Hour', 'Sparkle', 'Warm Breeze', 'Lemonade', 'Candy Skies', 'Bloom', 'Brightside', 'Hummingbird', 'Radiant'][i],
  artist: ['MoodyO Mix', 'Acoustic', 'Indie Pop', 'Lo-Fi', 'Electro Pop', 'Indie', 'Bedroom Pop', 'Folk', 'Chillhop', 'Dance'][i],
  src: `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${(baseIdx + i) % 16 + 1}.mp3`,
  cover: `https://picsum.photos/seed/h${baseIdx + i}/600/600`
}));

const happyTracks = SAMPLE_TRACKS(0);
happyTracks[0] = {
  title: 'Suvvi Suvvi',
  artist: 'Local Artist',
  src: '/audio/suvvi-suvvi.mp3',
  cover: `https://picsum.photos/seed/h-local/600/600`
};

const STATIC_TRACKS = {
  happy: happyTracks,
  joyful: SAMPLE_TRACKS(4),
  sad: SAMPLE_TRACKS(8),
  depression: SAMPLE_TRACKS(12)
};

const MoodyOLoader = () => (
    <div className="moody-loader-container">
      <div className="loader items-end">
        <svg height="0" width="0" viewBox="0 0 64 64" className="absolute">
          <defs className="s-xJBuHA073rTt" xmlns="http://www.w3.org/2000/svg">
            <linearGradient className="s-xJBuHA073rTt" gradientUnits="userSpaceOnUse" y2="2" x2="0" y1="62" x1="0" id="b">
              <stop className="s-xJBuHA073rTt" stopColor="#973BED"></stop>
              <stop className="s-xJBuHA073rTt" stopColor="#007CFF" offset="1"></stop>
            </linearGradient>
            <linearGradient className="s-xJBuHA073rTt" gradientUnits="userSpaceOnUse" y2="0" x2="0" y1="64" x1="0" id="c">
              <stop className="s-xJBuHA073rTt" stopColor="#FFC800"></stop>
              <stop className="s-xJBuHA073rTt" stopColor="#F0F" offset="1"></stop>
              <animateTransform repeatCount="indefinite" keySplines=".42,0,.58,1;.42,0,.58,1;.42,0,.58,1;.42,0,.58,1;.42,0,.58,1;.42,0,.58,1;.42,0,.58,1;.42,0,.58,1" keyTimes="0; 0.125; 0.25; 0.375; 0.5; 0.625; 0.75; 0.875; 1" dur="8s" values="0 32 32;-270 32 32;-270 32 32;-540 32 32;-540 32 32;-810 32 32;-810 32 32;-1080 32 32;-1080 32 32" type="rotate" attributeName="gradientTransform"></animateTransform>
            </linearGradient>
            <linearGradient className="s-xJBuHA073rTt" gradientUnits="userSpaceOnUse" y2="2" x2="0" y1="62" x1="0" id="d">
              <stop className="s-xJBuHA073rTt" stopColor="#00E0ED"></stop>
              <stop className="s-xJBuHA073rTt" stopColor="#00DA72" offset="1"></stop>
            </linearGradient>
          </defs>
        </svg>
        {/* M */}
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 64 64" height="64" width="64" className="inline-block">
          <path strokeLinejoin="round" strokeLinecap="round" strokeWidth="8" stroke="url(#b)" d="M 8 60 V 4 L 32 32 L 56 4 V 60" className="spin" pathLength="360"></path>
        </svg>
        {/* O */}
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 64 64" height="48" width="48" className="inline-block">
          <path strokeLinejoin="round" strokeLinecap="round" strokeWidth="8" stroke="url(#c)" d="M 32, 60 C 17,60 10,48 10,32 C 10,16 17,4 32,4 C 47,4 54,16 54,32 C 54,48 47,60 32,60 z" className="spin" pathLength="360"></path>
        </svg>
        {/* O */}
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 64 64" height="48" width="48" className="inline-block">
          <path strokeLinejoin="round" strokeLinecap="round" strokeWidth="8" stroke="url(#c)" d="M 32, 60 C 17,60 10,48 10,32 C 10,16 17,4 32,4 C 47,4 54,16 54,32 C 54,48 47,60 32,60 z" className="spin" pathLength="360"></path>
        </svg>
        {/* d */}
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 64 64" height="48" width="48" className="inline-block">
            <path strokeLinejoin="round" strokeLinecap="round" strokeWidth="8" stroke="url(#d)" d="M 50 60 V 4 M 50 32 C 50 48 38 60 24 60 C 10 60 4 48 4 32 C 4 16 10 4 24 4 C 38 4 50 16 50 32 Z" className="spin" pathLength="360"></path>
        </svg>
        {/* Y */}
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 64 64" height="48" width="48" className="inline-block">
          <path strokeLinejoin="round" strokeLinecap="round" strokeWidth="8" stroke="url(#b)" d="M 12 4 L 32 32 L 52 4 M 32 32 V 60" className="spin" pathLength="360"></path>
        </svg>
        {/* O */}
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" style={{'--rotation-duration': '0ms', '--rotation-direction': 'normal'} as React.CSSProperties} viewBox="0 0 64 64" height="64" width="64" className="inline-block">
            <path strokeLinejoin="round" strokeLinecap="round" strokeWidth="10" stroke="url(#c)" d="M 32 32 m 0 -27 a 27 27 0 1 1 0 54 a 27 27 0 1 1 0 -54" className="spin" id="o" pathLength="360"></path>
        </svg>
      </div>
      <motion.p
        className="intro-subtitle"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0, transition: { duration: 0.8, delay: 0.8 } }}
      >
        AI-Generated Soundscapes
      </motion.p>
    </div>
  );
  

const InteractiveCard = ({ moodKey, emoji, title, onClick, style = {} }) => {
  return (
    <div className="interactive-card-container noselect" onClick={onClick}>
      <div className="canvas">
        {Array.from({ length: 25 }, (_, i) => (
          <div key={i} className={`tracker tr-${i + 1}`}></div>
        ))}
        <div id="card" className="interactive-card" style={style}>
          <div className="card-emoji">{emoji}</div>
          <div className="card-title">{title}</div>
        </div>
      </div>
    </div>
  );
};


export default function Home() {
  const [isMounted, setIsMounted] = useState(false);
  const [activePage, setActivePage] = useState('home');
  const [nowPlaying, setNowPlaying] = useState<{ mood: string; index: number } | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMenuSheetOpen, setIsMenuSheetOpen] = useState(false);
  const [likedSongs, setLikedSongs] = useState<Track[]>([]);
  const [isCustomMoodDialogOpen, setIsCustomMoodDialogOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [customMoods, setCustomMoods] = useState<Record<string, MoodDefinition>>({});
  const [tracks, setTracks] = useState<Record<string, Track[]>>(STATIC_TRACKS);
  const [customMoodFormData, setCustomMoodFormData] = useState({ name: '', emoji: '', description: '' });
  const [volume, setVolume] = useState(0.75);
  const [appVisible, setAppVisible] = useState(false);
  const [spinKey, setSpinKey] = useState(0);

  const audioRef = useRef<HTMLAudioElement>(null);
  const cursorDotRef = useRef<HTMLDivElement>(null);
  const cursorRingRef = useRef<HTMLDivElement>(null);
  const homePageRef = useRef<HTMLElement>(null);
  const mainAppRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Custom Cursor Animation
  useEffect(() => {
    if (!isMounted) return;
    const onMouseMove = (e: MouseEvent) => {
      gsap.to(cursorDotRef.current, {
        x: e.clientX,
        y: e.clientY,
        duration: 0.3,
        ease: 'power3.out',
      });
      gsap.to(cursorRingRef.current, {
        x: e.clientX,
        y: e.clientY,
        duration: 0.5,
        ease: 'power3.out',
      });
    };
    window.addEventListener('mousemove', onMouseMove);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, [isMounted]);

  const currentTrack = nowPlaying ? tracks[nowPlaying.mood as keyof typeof tracks][nowPlaying.index] : null;

  // Effect for loading the track
  useEffect(() => {
      const audio = audioRef.current;
      if (!audio) return;
      if (currentTrack) {
          if (audio.src !== window.location.origin + currentTrack.src) {
              audio.src = currentTrack.src;
              audio.load();
          }
      }
  }, [currentTrack]);
  
  // Effect for playing/pausing
  useEffect(() => {
      const audio = audioRef.current;
      if (!audio) return;
      if (isPlaying && currentTrack) {
          audio.play().catch(e => console.error("Audio play error:", e));
      } else {
          audio.pause();
      }
  }, [isPlaying, currentTrack]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = volume;
    }
  }, [volume]);
  
  const handlePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;
  
    if (nowPlaying) {
      setIsPlaying(!isPlaying);
    } else {
      const currentMood = activePage;
      if (currentMood !== 'home') {
        const firstTrack = tracks[currentMood as keyof typeof tracks]?.[0];
        if (firstTrack) {
          setNowPlaying({ mood: currentMood, index: 0 });
          setIsPlaying(true);
        }
      }
    }
  };
  
  const handleSongEnd = () => {
    handleNext();
  };

  const handleNext = () => {
    if (!nowPlaying) return;
    const { mood, index } = nowPlaying;
    const playlist = tracks[mood as keyof typeof tracks];
    const nextIndex = (index + 1) % playlist.length;
    setNowPlaying({ mood, index: nextIndex });
    setIsPlaying(true);
  };

  const handlePrev = () => {
    if (!nowPlaying) return;
    const { mood, index } = nowPlaying;
    const playlist = tracks[mood as keyof typeof tracks];
    const prevIndex = (index - 1 + playlist.length) % playlist.length;
    setNowPlaying({ mood, index: prevIndex });
    setIsPlaying(true);
  };
  
  const openPlayer = (mood: string, index: number) => {
    setNowPlaying({ mood, index });
    setIsPlaying(true);
  };

  const isLiked = (track: Track) => {
    return likedSongs.some(likedTrack => likedTrack.src === track.src);
  }

  const handleLike = (e: React.MouseEvent, track: Track) => {
    e.stopPropagation();
    const target = e.currentTarget;
    gsap.fromTo(target, { scale: 1 }, { scale: 1.3, duration: 0.2, ease: 'back.out(1.7)', yoyo: true, repeat: 1 });

    setLikedSongs(prev => {
      if (isLiked(track)) {
        return prev.filter(likedTrack => likedTrack.src !== track.src);
      } else {
        const trackWithContext = { ...track, mood: track.mood || nowPlaying?.mood, index: track.index ?? nowPlaying?.index };
        return [...prev, trackWithContext];
      }
    });
  }

  const openPage = (id: string) => {
    setActivePage(id);
    setIsMenuSheetOpen(false);
  };

  const handleGenerateMood = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!customMoodFormData.name || !customMoodFormData.emoji || !customMoodFormData.description) return;
    
    setIsGenerating(true);
    setIsCustomMoodDialogOpen(false);

    const input: GenerateMoodInput = customMoodFormData;

    try {
      const result = await generateMood(input);
      const moodId = input.name.toLowerCase().replace(/[^a-z0-9]/g, '-');

      setCustomMoods(prev => ({
        ...prev,
        [moodId]: {
          title: result.title,
          subtitle: result.subtitle,
          accent: 'hsl(var(--primary))',
          bg: `linear-gradient(135deg, ${result.theme.start} 0%, ${result.theme.end} 100%)`,
          emoji: input.emoji,
          themeClass: 'custom-theme-active'
        }
      }));

      const initialTracks = result.playlist.map((song, index) => ({
        ...song,
        src: `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${(1 + index) % 16 + 1}.mp3`,
        cover: '/placeholder-cover.png',
      }));

      setTracks(prev => ({
        ...prev,
        [moodId]: initialTracks,
      }));
      
      openPage(moodId);
      setCustomMoodFormData({ name: '', emoji: '', description: '' });

      const imagePromises = result.playlist.map((song, index) => 
        generateImage({ prompt: `${song.title} by ${song.artist}, ${input.description}` })
          .then(imageResult => ({
            index,
            cover: imageResult.imageUrl || `https://picsum.photos/seed/${moodId}${index}/600/600`
          }))
      );
      
      const settledImages = await Promise.allSettled(imagePromises);

      setTracks(prev => {
        const newTracks = [...(prev[moodId] || [])];
        settledImages.forEach((settledResult, index) => {
            if (settledResult.status === 'fulfilled' && newTracks[settledResult.value.index]) {
                newTracks[settledResult.value.index] = { ...newTracks[settledResult.value.index], cover: settledResult.value.cover };
            } else if (settledResult.status === 'rejected') {
                console.error(`Image generation failed for track ${index}:`, settledResult.reason);
                if (newTracks[index]) {
                    newTracks[index] = { ...newTracks[index], cover: `https://picsum.photos/seed/${moodId}${index}/600/600` };
                }
            }
        });
        return { ...prev, [moodId]: newTracks };
      });

    } catch (error) {
      console.error("Failed to generate mood:", error);
    } finally {
      setIsGenerating(false);
    }
  };
  
  const allMoods = { ...MOOD_DEFS, ...customMoods };
  const isFormValid = customMoodFormData.name && customMoodFormData.emoji && customMoodFormData.description;

  const NavMenu = () => (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="item-1">
        <AccordionTrigger className="accordion-trigger">My Playlist</AccordionTrigger>
        <AccordionContent>
          {likedSongs.length > 0 ? (
            <ul className="mobile-menu-items">
              {likedSongs.map((track, index) => (
                <li key={index}>
                  <a href="#" className="playlist-item" onClick={(e) => { e.preventDefault(); openPlayer(track.mood!, track.index!) }}>
                    <Image src={track.cover} alt={track.title} width={40} height={40} className="playlist-item-cover" data-ai-hint="song cover" />
                    <span>{track.title}</span>
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-1 text-sm opacity-80">Your liked songs will appear here.</p>
          )}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );

  if (!isMounted) {
    return null;
  }
  
  const handleIntroClick = () => {
    if (appVisible) return;
    setAppVisible(true);
  };

  return (
    <>
      <ThemeProvider 
        activePage={activePage} 
        customMoods={customMoods}
        tracks={tracks}
        nowPlaying={nowPlaying}
        allMoods={allMoods}
      />
      <div id="cursor-dot" ref={cursorDotRef} />
      <div id="cursor-ring" ref={cursorRingRef} />
      
      <AnimatePresence>
        {!appVisible && (
          <motion.div
            className="intro-screen"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.8, ease: 'easeOut' } }}
            onClick={handleIntroClick}
          >
             <div key={spinKey}>
                <MoodyOLoader />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {appVisible && (
          <motion.div 
            className="app" 
            ref={mainAppRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.8 } }}
          >
            <header>
              <div className="header-inner">
                  <a href="#" onClick={(e) => { e.preventDefault(); openPage('home'); }} className="logo">
                    MoodyO
                  </a>
                  <nav className="hidden md:flex">
                    <a href="#" onClick={(e) => { e.preventDefault(); openPage('home'); }} className="nav-btn">
                      <HomeIcon size={20} />
                    </a>
                    <a href="https://github.com/bourojuakshay/studio" target="_blank" rel="noopener noreferrer" className="nav-btn">
                      <Github size={20} />
                    </a>
                  </nav>
                  <div className="md:hidden">
                    <Sheet open={isMenuSheetOpen} onOpenChange={setIsMenuSheetOpen}>
                      <SheetTrigger asChild>
                         <button className="nav-btn">
                          <Menu size={20} />
                        </button>
                      </SheetTrigger>
                      <SheetContent side="left" className="main-menu-sheet sheet-content">
                        <SheetHeader>
                           <SheetTitle className="sr-only">Main Menu</SheetTitle>
                          <a href="#" onClick={(e) => { e.preventDefault(); openPage('home'); }} className="logo">MoodyO</a>
                        </SheetHeader>
                        <div className="flex flex-col py-4">
                           <a href="#" onClick={(e) => { e.preventDefault(); openPage('home'); }}>Home</a>
                          {Object.keys(allMoods).map(mood => (
                            <a key={mood} href="#" onClick={(e) => { e.preventDefault(); openPage(mood); }}>
                              {allMoods[mood].title.split('—')[0]}
                            </a>
                          ))}
                        </div>
                         <div className="p-4 border-t border-glass-border">
                           <NavMenu />
                         </div>
                      </SheetContent>
                    </Sheet>
                  </div>
              </div>
            </header>

            <main>
              <section id="home" className={cn('page', {active: activePage === 'home'})} ref={homePageRef}>
                  <div className="home-section">
                      <h1 className="home-title">How are you feeling today?</h1>
                      <p className="home-subtitle">Hover over a card to see the magic. Each page has its own theme ✨</p>
                  
                    <div className="home-mood-selector">
                      {Object.entries(allMoods).map(([key, { emoji, title, bg }]) => (
                        <InteractiveCard
                          key={key}
                          moodKey={key}
                          emoji={emoji}
                          title={title}
                          onClick={() => openPage(key)}
                          style={{ background: bg }}
                        />
                      ))}
                      <InteractiveCard
                        moodKey="create"
                        emoji={<Wand2 size={64} />}
                        title="Create Your Own"
                        onClick={() => setIsCustomMoodDialogOpen(true)}
                        style={{ background: 'var(--glass-bg)', border: '1px dashed var(--glass-border)' }}
                      />
                    </div>
                  </div>
              </section>

              {Object.entries(allMoods).map(([mood, def]) => {
                return (
                  <AnimatePresence key={mood}>
                    {activePage === mood && (
                       <MoodPage
                          mood={mood}
                          definition={def}
                          tracks={tracks[mood]}
                          nowPlaying={nowPlaying}
                          isPlaying={isPlaying}
                          currentTrack={currentTrack}
                          volume={volume}
                          setVolume={setVolume}
                          handlePlayPause={handlePlayPause}
                          handleNext={handleNext}
                          handlePrev={handlePrev}
                          handleLike={handleLike}
                          isLiked={isLiked}
                          openPlayer={openPlayer}
                       />
                    )}
                  </AnimatePresence>
              )})}
            </main>
            
            <footer>
              <small>Made with ❤️ by Bouroju Akshay • <a href="mailto:23eg106b12@anurag.edu.in">23eg106b12@anurag.edu.in</a> • MoodyO Demo</small>
            </footer>
            
            <AnimatePresence>
                {nowPlaying && currentTrack && (
                    <PersistentPlayer
                        track={currentTrack}
                        isPlaying={isPlaying}
                        playlist={tracks[nowPlaying.mood]}
                        handlePlayPause={handlePlayPause}
                        handleNext={handleNext}
                        handlePrev={handlePrev}
                        handleLike={handleLike}
                        isLiked={isLiked}
                        openPlayer={openPlayer}
                        nowPlaying={nowPlaying}
                        setNowPlaying={setNowPlaying}
                    />
                )}
            </AnimatePresence>


            <audio ref={audioRef} onEnded={handleSongEnd} />

            <Dialog open={isCustomMoodDialogOpen} onOpenChange={setIsCustomMoodDialogOpen}>
              <DialogContent className="sheet-content">
                <DialogHeader>
                  <DialogTitle>Create a Custom Mood</DialogTitle>
                  <DialogDescription>
                    Describe the vibe, and AI will generate a unique mood page for you.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleGenerateMood} className="flex flex-col gap-4">
                  <Input 
                    name="name" 
                    placeholder="Mood Name (e.g., Cosmic Jazz)" 
                    required 
                    value={customMoodFormData.name}
                    onChange={(e) => setCustomMoodFormData({...customMoodFormData, name: e.target.value })}
                  />
                    <div>
                    <div className="emoji-picker">
                      {['🎷', '📚', '🌧️', '🌲', '🚀', '👾'].map(emoji => (
                        <span 
                          key={emoji}
                          className={cn('emoji-option', { selected: customMoodFormData.emoji === emoji })}
                          onClick={() => setCustomMoodFormData({...customMoodFormData, emoji })}
                        >
                          {emoji}
                        </span>
                      ))}
                    </div>
                    <Input 
                      name="emoji" 
                      placeholder="Select an emoji from above or type one" 
                      required 
                      maxLength={2} 
                      value={customMoodFormData.emoji}
                      onChange={(e) => setCustomMoodFormData({...customMoodFormData, emoji: e.target.value })}
                    />
                  </div>
                  <Input 
                    name="description" 
                    placeholder="Description (e.g., Late night jazz in a space lounge)" 
                    required
                    value={customMoodFormData.description}
                    onChange={(e) => setCustomMoodFormData({...customMoodFormData, description: e.target.value })}
                  />
                  <Button type="submit" disabled={isGenerating || !isFormValid}>
                    {isGenerating ? <><Loader className="animate-spin mr-2" size={16}/> Generating...</> : "Generate Mood"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

    
