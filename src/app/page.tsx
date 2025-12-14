
'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { gsap } from 'gsap';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { Menu, Wand2, Loader, Home as HomeIcon, Github, User, LogOut, Plus } from 'lucide-react';
import Link from 'next/link';
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
import { useSongs } from '@/hooks/use-songs';
import { useUserPreferences } from '@/hooks/use-user-preferences';
import { setUserSongPreference, type Song } from '@/firebase/firestore';
import { useAuth, useFirestore, useUser } from '@/firebase';
import { initiateAnonymousSignIn, initiateEmailSignIn, initiateEmailSignUp } from '@/firebase/non-blocking-login';
import { MOOD_DEFS, type MoodDefinition, type Track } from '@/app/lib/mood-definitions';
import { useToast } from '@/hooks/use-toast';


export const dynamic = 'force-dynamic';

const MoodyOLoader = ({ onExit }: { onExit: () => void }) => {
  const [exitState, setExitState] = useState<'enter' | 'exit'>('enter');

  const handleExit = () => {
    setExitState('exit');
    setTimeout(onExit, 1500); // Wait for exit animation to complete
  };
  
  // Auto-exit after a delay
  useEffect(() => {
    const timer = setTimeout(() => {
      if (exitState === 'enter') {
        handleExit();
      }
    }, 4000);
    return () => clearTimeout(timer);
  }, [exitState]);

  const containerVariants = {
    enter: { 
      transition: { 
        staggerChildren: 0.06,
      } 
    },
    exit: { 
      transition: { 
        staggerChildren: 0.06, 
        staggerDirection: -1 
      } 
    },
  };
  
  const letterVariants = {
    initial: { opacity: 0, y: 20, rotate: -5, scale: 0.95 },
    enter: { 
      opacity: 1, 
      y: 0, 
      rotate: 0,
      scale: 1,
      transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } 
    },
    exit: { 
      opacity: 0, 
      y: 20, 
      rotate: 5,
      scale: 0.95,
      transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] }
    },
  };

  const taglineContainerVariants = {
    enter: {
      transition: {
        delayChildren: 0.4, // Delay for tagline after logo
        staggerChildren: 0.08,
      },
    },
    exit: {
      transition: {
        staggerChildren: 0.06,
        staggerDirection: -1,
      },
    },
  };

  const taglineWordVariants = {
    initial: { opacity: 0, y: 10 },
    enter: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
    exit: { opacity: 0, y: 10, transition: { duration: 0.3, ease: 'easeIn' } },
  };

  const logoText = "MoodyO";
  const taglineText = "MOOD-DRIVEN AUDIO EXPERIENCE".split(' ');

  return (
    <motion.div 
      className="intro-screen-v2"
      data-state={exitState}
      onClick={handleExit}
      initial="initial"
      animate="enter"
      exit="exit"
      variants={{}} // Parent variant for AnimatePresence
    >
      <motion.div
        className="intro-logo-text"
        variants={containerVariants}
      >
        {logoText.split('').map((char, index) => (
          <motion.span key={index} variants={letterVariants}>
            {char}
          </motion.span>
        ))}
      </motion.div>
      <motion.div 
        className="intro-tagline"
        variants={taglineContainerVariants}
      >
        {taglineText.map((word, index) => (
          <motion.span key={index} variants={taglineWordVariants}>
            {word}
          </motion.span>
        ))}
      </motion.div>
    </motion.div>
  );
};


const InteractiveCard = ({ moodKey, emoji, title, onClick }: { moodKey: string, emoji: React.ReactNode, title: string, onClick: () => void }) => {
  const cardRef = useRef<HTMLDivElement>(null);

  const cardClasses = cn(
    'interactive-card',
    { 'create-card': moodKey === 'create' }
  );

  return (
    <div 
      ref={cardRef} 
      className={cardClasses}
      onClick={onClick}
      title={title}
    >
        <motion.div 
          className="card-content"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          {emoji}
        </motion.div>
    </div>
  );
};


export default function Home() {
  const [isMounted, setIsMounted] = useState(false);
  const [activePage, setActivePage] = useState('home');
  const [nowPlaying, setNowPlaying] = useState<{ mood: string; index: number } | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMenuSheetOpen, setIsMenuSheetOpen] = useState(false);
  const [isAuthSheetOpen, setIsAuthSheetOpen] = useState(false);
  
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const auth = useAuth();
  const { toast } = useToast();
  
  const { preferences: likedSongPrefs } = useUserPreferences(user?.uid);
  const { songs: firestoreSongs } = useSongs();
  
  const [tracks, setTracks] = useState<Record<string, Track[]>>({});
  
  const [isCustomMoodDialogOpen, setIsCustomMoodDialogOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [customMoods, setCustomMoods] = useState<Record<string, MoodDefinition>>({});
  const [customMoodFormData, setCustomMoodFormData] = useState({ name: '', emoji: '', description: '' });
  const [volume, setVolume] = useState(0.75);
  const [showIntro, setShowIntro] = useState(true);
  const [progress, setProgress] = useState({ currentTime: 0, duration: 0 });
  const [authForm, setAuthForm] = useState({ email: '', password: '', mode: 'signin' });

  const audioRef = useRef<HTMLAudioElement>(null);
  const cursorDotRef = useRef<HTMLDivElement>(null);
  const cursorRingRef = useRef<HTMLDivElement>(null);
  const homePageRef = useRef<HTMLElement>(null);

  const handleExitIntro = () => {
    setShowIntro(false);
  };

  useEffect(() => {
    if (firestoreSongs) {
      setTracks(prevTracks => {
        const newTracks: Record<string, Track[]> = {};
  
        // Group firestore songs by mood
        const firestoreSongsByMood: Record<string, Song[]> = {};
        firestoreSongs.forEach(song => {
          if (!firestoreSongsByMood[song.mood]) {
            firestoreSongsByMood[song.mood] = [];
          }
          firestoreSongsByMood[song.mood].push(song);
        });
  
        // Create playlists for all defined moods
        Object.keys(MOOD_DEFS).forEach(moodKey => {
          const firestoreSongsForMood = firestoreSongsByMood[moodKey] || [];
          newTracks[moodKey] = firestoreSongsForMood;
        });
  
        return newTracks;
      });
    }
  }, [firestoreSongs]);


  useEffect(() => {
    setIsMounted(true);
    if (!isUserLoading && !user) {
      initiateAnonymousSignIn(auth);
    }
  }, [isUserLoading, user, auth]);

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

  const currentTrack = nowPlaying ? tracks[nowPlaying.mood as keyof typeof tracks]?.[nowPlaying.index] : null;

  // Effect for loading the track
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
  
    if (currentTrack?.src) {
        audio.src = currentTrack.src;
        audio.load();
        if (isPlaying) {
          audio.play().catch(e => console.error("Audio play error:", e));
        }
    }
  }, [currentTrack]);
  
  // Effect for playing/pausing
  useEffect(() => {
      const audio = audioRef.current;
      if (!audio) return;
      if (isPlaying) {
          audio.play().catch(e => console.error("Audio play error:", e));
      } else {
          audio.pause();
      }
  }, [isPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = volume;
    }
  }, [volume]);
  
  const handlePlayPause = () => {
    if (nowPlaying) {
      setIsPlaying(!isPlaying);
    } else {
      const currentMood = activePage;
      if (currentMood !== 'home' && tracks[currentMood as keyof typeof tracks]?.length > 0) {
        setNowPlaying({ mood: currentMood, index: 0 });
        setIsPlaying(true);
      }
    }
  };
  
  const handleTimeUpdate = () => {
    const audio = audioRef.current;
    if (audio) {
      setProgress({
        currentTime: audio.currentTime,
        duration: audio.duration,
      });
    }
  };

  const handleSongEnd = () => {
    handleNext();
  };

  const handleNext = () => {
    if (!nowPlaying) return;
    const { mood, index } = nowPlaying;
    const playlist = tracks[mood as keyof typeof tracks];
    if (!playlist) return;
    const nextIndex = (index + 1) % playlist.length;
    setNowPlaying({ mood, index: nextIndex });
    setIsPlaying(true);
  };

  const handlePrev = () => {
    if (!nowPlaying) return;
    const { mood, index } = nowPlaying;
    const playlist = tracks[mood as keyof typeof tracks];
    if (!playlist) return;
    const prevIndex = (index - 1 + playlist.length) % playlist.length;
    setNowPlaying({ mood, index: prevIndex });
    setIsPlaying(true);
  };

  const handleSeek = (newTime: number) => {
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = newTime;
      setProgress(prev => ({...prev, currentTime: newTime}));
    }
  };
  
  const openPlayer = (mood: string, index: number) => {
    setNowPlaying({ mood, index });
    setIsPlaying(true);
  };

  const isLiked = (track: Track) => {
    if (!track.id) return false;
    return likedSongPrefs.some(pref => pref.songId === track.id && pref.liked);
  }

  const handleLike = (e: React.MouseEvent | PanInfo, track: Track) => {
    e.stopPropagation();
    if (!user) {
        setIsAuthSheetOpen(true);
        toast({
            title: 'Please sign in',
            description: 'You need to be signed in to like songs.',
        });
        return;
    }
    if (!track.id) return;

    if ('currentTarget' in e) {
      gsap.fromTo(e.currentTarget, { scale: 1 }, { scale: 1.3, duration: 0.2, ease: 'back.out(1.7)', yoyo: true, repeat: 1 });
    }
    
    const currentlyLiked = isLiked(track);
    setUserSongPreference(firestore, user.uid, track.id, !currentlyLiked);
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
          accent: result.theme.accent,
          bg: `linear-gradient(135deg, ${result.theme.start} 0%, ${result.theme.end} 100%)`,
          emoji: input.emoji,
          themeClass: 'custom-theme-active'
        }
      }));

      const initialTracks: Track[] = result.playlist.map((song, index) => ({
        ...song,
        src: `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${(1 + index) % 16 + 1}.mp3`,
        cover: '/placeholder-cover.png',
        mood: moodId,
      }));
      
      setTracks(prev => ({ ...prev, [moodId]: initialTracks }));

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
        const updatedPlaylist = [...(prev[moodId] || [])];
        settledImages.forEach((settledResult) => {
            if (settledResult.status === 'fulfilled') {
                const { index, cover } = settledResult.value;
                if (updatedPlaylist[index]) {
                    updatedPlaylist[index] = { ...updatedPlaylist[index], cover: cover };
                }
            } else if (settledResult.status === 'rejected') {
                console.error(`Image generation failed:`, settledResult.reason);
            }
        });
        return { ...prev, [moodId]: updatedPlaylist };
      });

    } catch (error) {
      console.error("Failed to generate mood:", error);
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleAuthSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (authForm.mode === 'signin') {
        initiateEmailSignIn(auth, authForm.email, authForm.password);
    } else {
        initiateEmailSignUp(auth, authForm.email, authForm.password);
    }
    toast({
        title: 'Check your email',
        description: `An email has been sent to ${authForm.email}`,
    });
    setIsAuthSheetOpen(false);
};

  const allMoods = { ...MOOD_DEFS, ...customMoods };
  const likedSongs = firestoreSongs.filter(isLiked);

  const NavMenu = () => (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="item-1">
        <AccordionTrigger className="accordion-trigger">My Playlist</AccordionTrigger>
        <AccordionContent>
          {!user ? (
            <p className="px-1 text-sm opacity-80">Sign in to see your liked songs.</p>
          ) : likedSongs.length > 0 ? (
            <ul className="mobile-menu-items">
              {likedSongs.map((track, index) => (
                <li key={index}>
                  <a href="#" className="playlist-item" onClick={(e) => { e.preventDefault(); if (track.mood && track.id) openPlayer(track.mood, tracks[track.mood]?.findIndex(t => t.id === track.id) ?? 0) }}>
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
  
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <AnimatePresence>{showIntro && <MoodyOLoader onExit={handleExitIntro} />}</AnimatePresence>;
  }

  const isAuthFormValid = authForm.email && authForm.password;
  const isFormValid = customMoodFormData.name && customMoodFormData.emoji && customMoodFormData.description;

  return (
    <>
      <AnimatePresence>
        {showIntro && <MoodyOLoader onExit={handleExitIntro} />}
      </AnimatePresence>
      
      <ThemeProvider 
        activePage={activePage} 
        customMoods={customMoods}
        tracks={tracks}
        nowPlaying={nowPlaying}
        allMoods={allMoods}
      />
      <div id="cursor-dot" ref={cursorDotRef} />
      <div id="cursor-ring" ref={cursorRingRef} />
      
      <motion.div 
        className="app"
        initial={{ opacity: 0 }}
        animate={{ opacity: showIntro ? 0 : 1 }}
        transition={{ duration: 0.8, delay: showIntro ? 0 : 0.2 }}
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
                <button onClick={() => setIsAuthSheetOpen(true)} className="nav-btn">
                  <User size={20} />
                </button>
                {user && (
                  <Link href="/admin" className="nav-btn">
                    Admin
                  </Link>
                )}
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
                       <Link href="/admin" className="p-4 font-semibold">Admin</Link>
                    </div>
                     <div className="p-4 border-t border-glass-border">
                       <NavMenu />
                     </div>
                     {user && (
                      <div className="p-4 border-t border-glass-border">
                        <button onClick={() => auth.signOut()} className="w-full text-left flex items-center gap-2 font-semibold">
                          <LogOut size={16} />
                          Sign Out
                        </button>
                      </div>
                     )}
                  </SheetContent>
                </Sheet>
              </div>
          </div>
        </header>

        <main>
          <section id="home" className={cn('page', {active: activePage === 'home'})} ref={homePageRef}>
              <div className="home-section">
                  <h1 className="home-title">How are you feeling today?</h1>
                  <p className="home-subtitle">Each card has its own theme. Choose a vibe or create your own.</p>
              
                <div className="home-mood-selector">
                  {Object.entries(allMoods).map(([key, { emoji, title }]) => (
                    <InteractiveCard
                      key={key}
                      moodKey={key}
                      emoji={<span>{emoji}</span>}
                      title={title}
                      onClick={() => openPage(key)}
                    />
                  ))}
                  <InteractiveCard
                    moodKey="create"
                    emoji={<Plus size={48} />}
                    title="Create Your Own"
                    onClick={() => setIsCustomMoodDialogOpen(true)}
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
                      progress={progress}
                      handleSeek={handleSeek}
                   />
                )}
              </AnimatePresence>
          )})}
        </main>
        
        <footer>
          <small>Made with ❤️ by Bouroju Akshay • <a href="mailto:23eg106b12@anurag.edu.in">23eg106b12@anurag.edu.in</a> • MoodyO Demo</small>
        </footer>
        
        {isMounted && (
          <AnimatePresence>
              {nowPlaying && currentTrack && (
                  <PersistentPlayer
                      track={currentTrack}
                      isPlaying={isPlaying}
                      handlePlayPause={handlePlayPause}
                      handleNext={handleNext}
                      handlePrev={handlePrev}
                      handleLike={handleLike}
                      isLiked={isLiked}
                      setNowPlaying={setNowPlaying}
                      progress={progress}
                      handleSeek={handleSeek}
                      volume={volume}
                      setVolume={setVolume}
                  />
              )}
          </AnimatePresence>
        )}


        <audio 
          ref={audioRef} 
          onEnded={handleSongEnd} 
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleTimeUpdate}
          crossOrigin="anonymous"
        />

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

         <Sheet open={isAuthSheetOpen} onOpenChange={setIsAuthSheetOpen}>
            <SheetContent side="right" className="main-menu-sheet sheet-content">
                <SheetHeader>
                    <SheetTitle className="text-2xl">
                      {user ? `Welcome, ${user.displayName || user.email}`: 'Sign In or Sign Up'}
                    </SheetTitle>
                </SheetHeader>
                {isUserLoading ? (
                    <div className="flex justify-center items-center p-8">
                        <Loader className="animate-spin" />
                    </div>
                ) : user ? (
                    <div className="p-4 flex flex-col gap-4">
                        <p>You are signed in as {user.email}.</p>
                        <Link href="/admin" passHref>
                           <Button variant="outline" onClick={() => setIsAuthSheetOpen(false)}>Go to Admin</Button>
                        </Link>
                        <Button onClick={() => auth.signOut()}>
                            <LogOut className="mr-2" />
                            Sign Out
                        </Button>
                    </div>
                ) : (
                    <div className="p-4">
                        <form onSubmit={handleAuthSubmit} className="flex flex-col gap-4">
                            <div className="flex justify-center gap-2">
                                <Button type="button" variant={authForm.mode === 'signin' ? 'default' : 'outline'} onClick={() => setAuthForm({...authForm, mode: 'signin'})}>Sign In</Button>
                                <Button type="button" variant={authForm.mode === 'signup' ? 'default' : 'outline'} onClick={() => setAuthForm({...authForm, mode: 'signup'})}>Sign Up</Button>
                            </div>
                            <Input 
                                type="email" 
                                name="email" 
                                placeholder="Email" 
                                required
                                value={authForm.email}
                                onChange={(e) => setAuthForm({...authForm, email: e.target.value})} 
                            />
                            <Input 
                                type="password" 
                                name="password" 
                                placeholder="Password" 
                                required 
                                value={authForm.password}
                                onChange={(e) => setAuthForm({...authForm, password: e.target.value})}
                            />
                            <Button type="submit" disabled={!isAuthFormValid}>
                                {authForm.mode === 'signin' ? 'Sign In' : 'Sign Up'}
                            </Button>
                        </form>
                    </div>
                )}
            </SheetContent>
        </Sheet>

      </motion.div>
    </>
  );
}

    