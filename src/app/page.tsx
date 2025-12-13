
'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { gsap } from 'gsap';
import { motion, AnimatePresence } from 'framer-motion';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SkipBack, SkipForward, Play, Pause, X, Heart, Menu, Wand2, Loader, Smile, Music, Volume1, Volume2, Home as HomeIcon, Github } from 'lucide-react';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { generateMood, GenerateMoodInput, GenerateMoodOutput } from '@/ai/flows/mood-generator';
import { generateImage } from '@/ai/flows/image-generator';
import { ThemeProvider } from '@/components/theme-provider';

export const dynamic = 'force-dynamic';

// --- Data Definitions ---
type MoodDefinition = {
  title: string;
  subtitle: string;
  accent: string;
  bg: string;
  emoji: string;
  themeClass: string;
};

const MOOD_DEFS: { [key: string]: MoodDefinition } = {
  happy: {
    title: 'Happy — Vibrant Beats',
    subtitle: 'Feel-good tracks with a deep groove',
    accent: '#FFB347',
    bg: 'linear-gradient(43deg, rgb(65, 88, 208) 0%, rgb(200, 80, 192) 46%, rgb(255, 204, 112) 100%)',
    emoji: '😄',
    themeClass: 'happy-active',
  },
  joyful: {
    title: 'Joyful — Energetic Beats',
    subtitle: 'High-energy songs — perfect for smiles and movement',
    accent: '#FF4081',
    bg: 'linear-gradient(43deg, rgb(65, 88, 208) 0%, rgb(200, 80, 192) 46%, rgb(255, 204, 112) 100%)',
    emoji: '🥳',
    themeClass: 'joyful-active',
  },
  sad: {
    title: 'Sad — Melancholy',
    subtitle: 'Slow, emotional tracks to reflect',
    accent: '#2196F3',
    bg: 'linear-gradient(43deg, rgb(65, 88, 208) 0%, rgb(200, 80, 192) 46%, rgb(255, 204, 112) 100%)',
    emoji: '😢',
    themeClass: 'sad-active',
  },
  depression: {
    title: 'Depression — Ambient & Soothing',
    subtitle: 'Ambient textures and slow soundscapes',
    accent: '#5E3370',
    bg: 'linear-gradient(43deg, rgb(65, 88, 208) 0%, rgb(200, 80, 192) 46%, rgb(255, 204, 112) 100%)',
    emoji: '😔',
    themeClass: 'depression-active',
  }
};

type Track = {
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

const AnimatedText = ({ text, el: Wrapper = 'h1', className }) => {
  return (
    <Wrapper className={className}>
      {text.split("").map((char, index) => (
        <motion.span
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: index * 0.05,
            duration: 0.5,
            ease: "easeOut"
          }}
        >
          {char === " " ? "\u00A0" : char}
        </motion.span>
      ))}
    </Wrapper>
  );
};

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
  const [isVolumeOpen, setIsVolumeOpen] = useState(false);
  const [appVisible, setAppVisible] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);
  const cursorDotRef = useRef<HTMLDivElement>(null);
  const cursorRingRef = useRef<HTMLDivElement>(null);
  const homePageRef = useRef<HTMLElement>(null);
  const mainAppRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
    gsap.registerPlugin(ScrollTrigger);
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

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (currentTrack) {
      if (audio.src !== window.location.origin + currentTrack.src) {
        audio.src = currentTrack.src;
        audio.load();
      }
      if (isPlaying) {
        audio.play().catch(e => console.error("Audio play error:", e));
      } else {
        audio.pause();
      }
    } else {
      audio.pause();
      audio.src = '';
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
      const firstTrack = tracks[currentMood as keyof typeof tracks]?.[0];
      if (firstTrack) {
        setNowPlaying({ mood: currentMood, index: 0 });
        setIsPlaying(true);
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

  const closePlayer = () => {
    setIsPlaying(false);
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
    if(nowPlaying && nowPlaying.mood !== id) {
      setIsPlaying(false);
    }
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
          title: `${result.title} — AI Generated`,
          subtitle: result.subtitle,
          accent: result.theme.accent,
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
            onClick={() => setAppVisible(true)}
          >
            <div className="intro-bg-elements">
                <motion.div 
                    className="intro-bg-element" 
                    style={{ top: '10%', left: '15%', width: '150px', height: '150px', '--orb-color': 'rgb(65, 88, 208)' } as React.CSSProperties}
                    animate={{ y: [0, -20, 0], scale: [1, 1.05, 1] }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div 
                    className="intro-bg-element" 
                    style={{ top: '60%', left: '5%', width: '80px', height: '80px', '--orb-color': 'rgb(200, 80, 192)' } as React.CSSProperties}
                    animate={{ y: [0, 15, 0], x: [0, 10, 0] }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                />
                <motion.div 
                    className="intro-bg-element" 
                    style={{ top: '25%', left: '80%', width: '120px', height: '120px', '--orb-color': 'rgb(255, 204, 112)' } as React.CSSProperties}
                    animate={{ y: [0, -10, 0], x: [0, -15, 0] }}
                    transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
                />
            </div>
            <div className="intro-content">
                <AnimatedText text="MoodyO" el={motion.h1} className="intro-title" />
                <motion.p
                  className="intro-subtitle"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0, transition: { duration: 0.8, delay: 0.8 } }}
                >
                  AI-Generated Soundscapes
                </motion.p>
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
                          title={title.split('—')[0]}
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
                const playlist = tracks[mood];
                const trackPlaying = nowPlaying?.mood === mood ? currentTrack : null;
                const displayTrack = trackPlaying || playlist?.[0];

                return (
                <section key={mood} id={mood} className={cn('page', { active: activePage === mood })}>
                  <div className="glass">
                    <div className="mood-page-layout">
                      <div className="mood-hero">
                        {displayTrack ? (
                          <div className="now-playing-card">
                            <Image className="player-cover" src={displayTrack.cover} alt={displayTrack.title} width={400} height={400} data-ai-hint="song cover" unoptimized={displayTrack.cover.startsWith('data:')} />
                            <div className="player-info">
                                <h3>{displayTrack.title}</h3>
                                <p>{displayTrack.artist}</p>
                            </div>
                            <div className="player-controls">
                                <button onClick={handlePrev}><SkipBack /></button>
                                <button onClick={handlePlayPause} className="play-main-btn">
                                    {(isPlaying && nowPlaying?.mood === mood) ? <Pause size={32} /> : <Play size={32} />}
                                </button>
                                <button onClick={handleNext}><SkipForward /></button>
                            </div>
                            <div className="player-actions">
                                <button onClick={(e) => handleLike(e, { ...displayTrack, mood: mood, index: nowPlaying?.index ?? 0 })} className={cn('like-btn', { 'liked': isLiked(displayTrack) })}>
                                    <Heart size={24} />
                                </button>
                                 <div className="volume-control">
                                   <button onClick={() => setIsVolumeOpen(!isVolumeOpen)} className="volume-btn">
                                    {volume > 0.5 ? <Volume2 size={24} /> : <Volume1 size={24}/>}
                                   </button>
                                  {isVolumeOpen && (
                                    <input type="range" min="0" max="1" step="0.01" value={volume} onChange={(e) => setVolume(parseFloat(e.target.value))} className="volume-slider" />
                                  )}
                                 </div>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="emoji">{def.emoji}</div>
                            <h2>{def.title}</h2>
                            <p>{def.subtitle}</p>
                          </>
                        )}
                      </div>
                      <div className="playlist-view">
                        <div className="playlist-header">
                          <h3>Playlist</h3>
                        </div>
                        <ScrollArea className="playlist-scroll-area">
                          <div className="playlist-list">
                            {playlist && playlist.map((track, index) => (
                              <div key={index} className={cn('playlist-list-item', { active: trackPlaying?.src === track.src })} onClick={() => openPlayer(mood, index)}>
                                 <Image className="playlist-list-item-cover" src={track.cover} alt={`${track.title} cover`} width={48} height={48} data-ai-hint="song cover" unoptimized={track.cover.startsWith('data:')} />
                                <div className="playlist-list-item-info">
                                  <div className="title">{track.title}</div>
                                  <div className="artist">{track.artist}</div>
                                </div>
                                <button onClick={(e) => handleLike(e, { ...track, mood: mood, index: index })} className={cn('like-btn', { 'liked': isLiked(track) })}>
                                  <Heart size={18} />
                                </button>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>
                    </div>
                  </div>
                </section>
              )})}
            </main>
            
            <footer>
              <small>Made with ❤️ by Bouroju Akshay • <a href="mailto:23eg106b12@anurag.edu.in">23eg106b12@anurag.edu.in</a> • MoodyO Demo</small>
            </footer>

            {nowPlaying && currentTrack && (
              <div className="player-dialog-overlay" style={{display:'none'}}>
                  <div className="player-dialog glass">
                      <button onClick={closePlayer} className="player-close-btn"><X size={24} /></button>
                      <Image className="player-cover" src={currentTrack.cover} alt={currentTrack.title} width={400} height={400} data-ai-hint="song cover" unoptimized={currentTrack.cover.startsWith('data:')} />
                      <div className="player-info">
                          <h3>{currentTrack.title}</h3>
                          <p>{currentTrack.artist}</p>
                      </div>
                        <div className="player-controls">
                          <button onClick={handlePrev}><SkipBack /></button>
                          <button onClick={handlePlayPause} className="play-main-btn">
                              {isPlaying ? <Pause size={32} /> : <Play size={32} />}
                          </button>
                          <button onClick={handleNext}><SkipForward /></button>
                      </div>
                        <div className="player-actions">
                          <button onClick={(e) => handleLike(e, { ...currentTrack, mood: nowPlaying.mood, index: nowPlaying.index })} className={cn('like-btn', { 'liked': isLiked(currentTrack) })}>
                              <Heart size={24} />
                          </button>
                           <div className="volume-control">
                             <button onClick={() => setIsVolumeOpen(!isVolumeOpen)} className="volume-btn">
                               {volume > 0.5 ? <Volume2 size={24} /> : <Volume1 size={24} />}
                             </button>
                             {isVolumeOpen && (
                               <input type="range" min="0" max="1" step="0.01" value={volume} onChange={(e) => setVolume(parseFloat(e.target.value))} className="volume-slider"/>
                             )}
                           </div>
                      </div>
                  </div>
              </div>
            )}
            <audio ref={audioRef} onEnded={handleSongEnd} />

            <Dialog open={isCustomMoodDialogOpen} onOpenChange={setIsCustomMoodDialogOpen}>
              <DialogContent className="sheet-content glass">
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
