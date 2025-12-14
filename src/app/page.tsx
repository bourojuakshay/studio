
'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { gsap } from 'gsap';
import { AnimatePresence } from 'framer-motion';
import { Bell, Search, Library, Plus, Heart } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ThemeProvider } from '@/components/theme-provider';
import { PersistentPlayer } from '@/components/PersistentPlayer';
import { MoodPage } from '@/components/MoodPage';
import { useSongs } from '@/hooks/use-songs';
import { useUserPreferences } from '@/hooks/use-user-preferences';
import { setUserSongPreference, type Song } from '@/firebase/firestore';
import { useFirestore, useUser } from '@/firebase';
import { MOOD_DEFS, type MoodDefinition } from '@/app/lib/mood-definitions';
import { useToast } from '@/hooks/use-toast';
import {
  Sidebar,
  SidebarContent,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
  SidebarHeader,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter
} from '@/components/ui/sidebar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAppContext, usePlaybackState } from '@/context/AppContext';
import AuthButtons from '@/components/AuthButtons';

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

const AlbumCard = ({ track, onClick }: { track: Song; onClick: () => void }) => (
    <div className="album-card" onClick={onClick}>
        <div className="album-card-image">
            <Image src={track.cover} alt={track.title} width={150} height={150} />
        </div>
        <div className="album-card-info">
            <p className="album-card-title">{track.title}</p>
            <p className="album-card-artist">{track.artist}</p>
        </div>
    </div>
);


export default function Home() {
  const [isMounted, setIsMounted] = useState(false);
  
  const { activePage, setActivePage, setPlaylist } = useAppContext();
  const { setNowPlayingId, handlePlayPause, currentTrack } = usePlaybackState();

  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const { likedSongIds } = useUserPreferences(user?.uid);
  const { songs: firestoreSongs } = useSongs();
  
  const [tracksByMood, setTracksByMood] = useState<Record<string, Song[]>>({});
  const [filteredTracks, setFilteredTracks] = useState<Song[]>([]);
  const [selectedEmotion, setSelectedEmotion] = useState<string>('all');
  
  const [showIntro, setShowIntro] = useState(true);
  const router = useRouter();

  const handleExitIntro = () => {
    setShowIntro(false);
  };

  useEffect(() => {
    if (firestoreSongs) {
      setPlaylist(firestoreSongs);

      const newTracksByMood: Record<string, Song[]> = {'all': firestoreSongs};
      firestoreSongs.forEach(song => {
        const moods = Array.isArray(song.emotions) ? song.emotions : [song.mood];
        moods.forEach(mood => {
            if (!newTracksByMood[mood]) {
                newTracksByMood[mood] = [];
            }
            newTracksByMood[mood].push(song);
        });
      });
      setTracksByMood(newTracksByMood);
    }
  }, [firestoreSongs, setPlaylist]);

  useEffect(() => {
    if (selectedEmotion === 'all') {
      setFilteredTracks(tracksByMood.all || []);
    } else {
      setFilteredTracks(tracksByMood[selectedEmotion] || []);
    }
  }, [selectedEmotion, tracksByMood]);


  useEffect(() => {
    setIsMounted(true);
  }, []);

  const playSong = (songId: string) => {
    setNowPlayingId(songId);
    handlePlayPause();
  };
  
  const openPlayer = (songId: string, contextMood: string) => {
    setActivePage(contextMood);
    setNowPlayingId(songId);
    handlePlayPause();
  };

  const isLiked = (songId: string) => {
    if (!songId) return false;
    return likedSongIds.includes(songId);
  }

  const handleLike = (e: React.MouseEvent, songId: string) => {
    e.stopPropagation();
    if (!user) {
        router.push('/login');
        toast({
            title: 'Please sign in',
            description: 'You need to be signed in to like songs.',
        });
        return;
    }
    if (!songId) return;
    
    const currentlyLiked = isLiked(songId);
    setUserSongPreference(firestore, user.uid, songId, !currentlyLiked);
  }

  const openPage = (id: string) => {
    if (id.startsWith('/')) {
        router.push(id);
    } else {
        setActivePage(id);
    }
  };
  
  const allMoods = { ...MOOD_DEFS };

  if (!isMounted) {
    return <AnimatePresence>{showIntro && <MoodyOLoader onExit={handleExitIntro} />}</AnimatePresence>;
  }

  const MainContent = () => (
    <>
        <div className="home-section-grid">
            <h2 className="section-title">Recently Played</h2>
            <div className="album-grid">
                {(tracksByMood.all || []).slice(0, 6).map((track, i) => (
                    <AlbumCard key={track.id || i} track={track} onClick={() => playSong(track.id!)} />
                ))}
            </div>
        </div>
        <div className="home-section-grid">
            <h2 className="section-title">Recommended Stations</h2>
             <div className="album-grid">
                {(tracksByMood.all || []).slice(6, 12).map((track, i) => (
                    <AlbumCard key={track.id || i} track={track} onClick={() => playSong(track.id!)} />
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
                    <AlbumCard key={track.id || i} track={track} onClick={() => openPlayer(track.id!, selectedEmotion)} />
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
        customMoods={{}}
        tracks={tracksByMood}
        nowPlayingId={currentTrack?.id || null}
        allMoods={allMoods}
      />
      
      <Sidebar side="left">
        <AuthButtons onNavigate={openPage} />
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
            <Avatar className="h-8 w-8 cursor-pointer" onClick={() => user && router.push('/admin')}>
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
                      tracks={tracksByMood[activePage]}
                      handleLike={handleLike}
                      isLiked={isLiked}
                      openPlayer={openPlayer}
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
            {currentTrack && (
                <PersistentPlayer
                    track={currentTrack}
                    handleLike={handleLike}
                    isLiked={isLiked}
                />
            )}
        </AnimatePresence>
      )}

      <AudioPlayer />
    </SidebarProvider>
  );
}

const AudioPlayer = () => {
    const { audioRef, setIsPlaying } = useAppContext();
    const { setProgress } = usePlaybackState();

    const handleNext = () => {
        // Implement next song logic here if needed, or handle in component
    };

    return (
        <audio 
            ref={audioRef} 
            onEnded={handleNext}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onTimeUpdate={() => {
                const audio = audioRef.current;
                if(audio) setProgress({ currentTime: audio.currentTime, duration: audio.duration });
            }}
            onLoadedData={() => {
                const audio = audioRef.current;
                if(audio) setProgress({ currentTime: audio.currentTime, duration: audio.duration });
            }}
            crossOrigin="anonymous"
        />
    )
}

    
