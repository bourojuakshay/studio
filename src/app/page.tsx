
'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { gsap } from 'gsap';
import { AnimatePresence } from 'framer-motion';
import { Bell, Home as HomeIcon, Library, ListMusic, LogOut, LogIn, Mic2, Plus, Search, User, Heart, Play } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
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
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger,
  SidebarGroup,
  SidebarInset,
  SidebarFooter
} from '@/components/ui/sidebar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';


export const dynamic = 'force-dynamic';

const MoodyOLoader = ({ onExit }: { onExit: () => void }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const letters = gsap.utils.toArray('.intro-logo-gsap span');
      const tagline = gsap.utils.toArray('.intro-tagline');
      
      gsap.set(letters, {
        opacity: 0,
        y: 18,
        scale: 0.95,
        filter: 'blur(2px)',
      });
      gsap.set(tagline, { opacity: 0 });

      const tl = gsap.timeline({
        onComplete: () => {
          if (containerRef.current) {
            containerRef.current.style.cursor = 'pointer';
          }
        },
      });

      tl.to(letters, {
          opacity: 1,
          y: -5,
          scale: 1,
          filter: 'blur(0px)',
          duration: 0.35,
          ease: 'power3.out',
          stagger: 0.06,
      })
      .to(letters, {
          y: 0,
          duration: 0.15,
          ease: 'power2.in',
      }, "-=0.2")
      .to(tagline, {
        opacity: 1,
        duration: 0.8,
        ease: 'power2.out',
      }, '-=0.2');

    }, containerRef);
    
    return () => ctx.revert();
  }, []);

  const handleExit = () => {
    gsap.to(containerRef.current, {
      opacity: 0,
      duration: 0.5,
      ease: 'power2.inOut',
      onComplete: onExit,
    });
  };

  return (
    <div
      className="intro-screen-v2"
      onClick={handleExit}
      ref={containerRef}
    >
        <div className="intro-content-wrapper">
             <h1 className="intro-logo-gsap">
                {'MoodyO'.split('').map((char, index) => (
                    <span key={index}>{char}</span>
                ))}
            </h1>
            <div className="intro-tagline-container">
                <div className="intro-tagline">mood based audio</div>
            </div>
        </div>
    </div>
  );
};

const AlbumCard = ({ track, onClick }: { track: Track; onClick: () => void }) => (
    <div className="album-card" onClick={onClick}>
        <div className="album-card-image">
            <Image src={track.cover} alt={track.title} width={150} height={150} />
            <Button size="icon" className="play-button"><Play /></Button>
        </div>
        <div className="album-card-info">
            <p className="album-card-title">{track.title}</p>
            <p className="album-card-artist">{track.artist}</p>
        </div>
    </div>
);


export default function Home() {
  const [isMounted, setIsMounted] = useState(false);
  const [activePage, setActivePage] = useState('home');
  const [nowPlaying, setNowPlaying] = useState<{ mood: string; index: number } | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAuthSheetOpen, setIsAuthSheetOpen] = useState(false);
  
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const auth = useAuth();
  const { toast } = useToast();
  
  const { preferences: likedSongPrefs } = useUserPreferences(user?.uid);
  const { songs: firestoreSongs } = useSongs();
  
  const [tracks, setTracks] = useState<Record<string, Track[]>>({});
  const [filteredTracks, setFilteredTracks] = useState<Track[]>([]);
  const [selectedEmotion, setSelectedEmotion] = useState<string>('all');
  
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

  const handleExitIntro = () => {
    setShowIntro(false);
  };

  useEffect(() => {
    if (firestoreSongs) {
      const allFirestoreTracks = firestoreSongs.map((s, i) => ({ ...s, index: i }));
      setTracks({ all: allFirestoreTracks });

      const newTracksByMood: Record<string, Track[]> = {};
      firestoreSongs.forEach(song => {
        const moods = Array.isArray(song.emotions) ? song.emotions : [song.mood];
        moods.forEach(mood => {
            if (!newTracksByMood[mood]) {
                newTracksByMood[mood] = [];
            }
            newTracksByMood[mood].push(song);
        });
      });
      setTracks(prev => ({...prev, ...newTracksByMood}));
    }
  }, [firestoreSongs]);

  useEffect(() => {
    if (selectedEmotion === 'all') {
      setFilteredTracks(tracks.all || []);
    } else {
      setFilteredTracks(tracks[selectedEmotion] || []);
    }
  }, [selectedEmotion, tracks]);


  useEffect(() => {
    setIsMounted(true);
    if (!isUserLoading && !user) {
      initiateAnonymousSignIn(auth);
    }
  }, [isUserLoading, user, auth]);

  const currentTrack = nowPlaying ? tracks[nowPlaying.mood as keyof typeof tracks]?.[nowPlaying.index] : null;

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
      const currentMood = activePage === 'home' ? 'all' : activePage;
      if (tracks[currentMood as keyof typeof tracks]?.length > 0) {
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
    const playlist = tracks[mood as keyof typeof tracks] || [];
    const trackToPlay = playlist[index];
    if(!trackToPlay) return;

    // find the original index in the 'all' playlist if it exists
    const originalIndex = tracks.all?.findIndex(t => t.id === trackToPlay.id) ?? index;
    const originalMood = trackToPlay.mood || 'all';

    setNowPlaying({ mood: originalMood, index: originalIndex });
    setActivePage(originalMood);
    setIsPlaying(true);
  };

  const isLiked = (track: Track) => {
    if (!track?.id) return false;
    return likedSongPrefs.some(pref => pref.songId === track.id && pref.liked);
  }

  const handleLike = (e: React.MouseEvent, track: Track) => {
    e.stopPropagation();
    if (!user) {
        setIsAuthSheetOpen(true);
        toast({
            title: 'Please sign in',
            description: 'You need to be signed in to like songs.',
        });
        return;
    }
    if (!track?.id) return;
    
    const currentlyLiked = isLiked(track);
    setUserSongPreference(firestore, user.uid, track.id, !currentlyLiked);
  }

  const openPage = (id: string) => {
    setActivePage(id);
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

  if (!isMounted) {
    return <AnimatePresence>{showIntro && <MoodyOLoader onExit={handleExitIntro} />}</AnimatePresence>;
  }

  const isAuthFormValid = authForm.email && authForm.password;
  const isFormValid = customMoodFormData.name && customMoodFormData.emoji && customMoodFormData.description;

  const MainContent = () => (
    <>
        <div className="home-section-grid">
            <h2 className="section-title">Recently Played</h2>
            <div className="album-grid">
                {(tracks.all || []).slice(0, 6).map((track, i) => (
                    <AlbumCard key={i} track={track} onClick={() => openPlayer('all', i)} />
                ))}
            </div>
        </div>
        <div className="home-section-grid">
            <h2 className="section-title">Recommended Stations</h2>
             <div className="album-grid">
                {(tracks.all || []).slice(6, 12).map((track, i) => (
                    <AlbumCard key={i} track={track} onClick={() => openPlayer('all', i + 6)} />
                ))}
            </div>
        </div>
        <div className="home-section-grid">
            <div className="flex justify-between items-center">
              <h2 className="section-title">How are you feeling today?</h2>
              <Button variant="link" onClick={() => setSelectedEmotion('all')}>Show all</Button>
            </div>
            <div className="album-grid emotion-grid">
              {Object.entries(allMoods).map(([key, { emoji, title }]) => (
                <div 
                  key={key} 
                  className={cn("emotion-card", { active: selectedEmotion === key })}
                  onClick={() => setSelectedEmotion(key)}
                >
                  <span>{emoji}</span>
                  <p>{title}</p>
                </div>
              ))}
            </div>
        </div>
        <div className="home-section-grid">
            <h2 className="section-title">{selectedEmotion === 'all' ? 'Popular Playlists' : `For Your ${selectedEmotion.charAt(0).toUpperCase() + selectedEmotion.slice(1)} Mood`}</h2>
            <div className="album-grid">
                {filteredTracks.slice(0, 12).map((track, i) => (
                    <AlbumCard key={i} track={track} onClick={() => openPlayer(selectedEmotion, i)} />
                ))}
            </div>
        </div>
    </>
  );

  return (
    <SidebarProvider>
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
      
      <Sidebar side="left" collapsible="icon" variant="sidebar">
          <SidebarHeader>
              <a href="#" onClick={(e) => { e.preventDefault(); openPage('home'); }} className="logo">
                MoodyO
              </a>
          </SidebarHeader>
          <SidebarContent>
              <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={() => openPage('home')} isActive={activePage === 'home'}>
                        <HomeIcon />
                        <span>Home</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                   <SidebarMenuItem>
                    <SidebarMenuButton>
                        <Search />
                        <span>Search</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton>
                        <Library />
                        <span>Your Library</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
              </SidebarMenu>
              <SidebarGroup>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton onClick={() => setIsCustomMoodDialogOpen(true)}>
                            <Plus />
                            <span>Create Mood</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton>
                            <div className="liked-songs-icon"><Heart /></div>
                            <span>Liked Songs</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroup>

              <ScrollArea className="flex-grow p-2">
                <SidebarMenu>
                    {likedSongs.slice(0, 10).map(song => (
                        <SidebarMenuItem key={song.id}>
                            <SidebarMenuButton className="h-auto py-1">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={song.cover} alt={song.title}/>
                                    <AvatarFallback>{song.title.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col items-start">
                                    <span>{song.title}</span>
                                    <small className="text-xs text-muted-foreground">{song.artist}</small>
                                </div>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
              </ScrollArea>
          </SidebarContent>
          <SidebarFooter>
            {user ? (
                <SidebarMenuButton onClick={() => auth.signOut()}>
                    <LogOut />
                    <span>Sign Out</span>
                </SidebarMenuButton>
            ) : (
                <SidebarMenuButton onClick={() => setIsAuthSheetOpen(true)}>
                    <LogIn />
                    <span>Sign In</span>
                </SidebarMenuButton>
            )}
          </SidebarFooter>
      </Sidebar>
      
      <SidebarInset>
        <header className="app-header">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="md:hidden" />
            <div className="relative w-full max-w-md hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="What do you want to play?" className="pl-10" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">Premium</Button>
            <Button variant="ghost" size="icon"><Bell /></Button>
            <Avatar className="h-8 w-8 cursor-pointer" onClick={() => user && openPage('admin')}>
              <AvatarImage src={user?.photoURL || ''} alt={user?.displayName || 'User'} />
              <AvatarFallback>{user?.email?.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
          </div>
        </header>

        <main className="app-main">
          {activePage === 'home' ? (
              <MainContent />
          ) : (
             <AnimatePresence>
                {activePage !== 'home' && allMoods[activePage] && (
                   <MoodPage
                      mood={activePage}
                      definition={allMoods[activePage]}
                      tracks={tracks[activePage]}
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
          )}
        </main>
        
        <footer className="app-footer">
          <small>Made with ❤️ by Bouroju Akshay • <a href="mailto:23eg106b12@anurag.edu.in">23eg106b12@anurag.edu.in</a> • MoodyO Demo</small>
        </footer>
      </SidebarInset>
        
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
              {isGenerating ? <>
                <Mic2 className="animate-pulse mr-2" size={16}/> Generating...
              </> : "Generate Mood"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isAuthSheetOpen} onOpenChange={setIsAuthSheetOpen}>
        <DialogContent className="sheet-content">
          <DialogHeader>
            <DialogTitle>{user ? `Welcome, ${user.displayName || user.email}`: 'Sign In or Sign Up'}</DialogTitle>
          </DialogHeader>
          {isUserLoading ? (
              <div className="flex justify-center items-center p-8">
                  <Mic2 className="animate-pulse" />
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
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
