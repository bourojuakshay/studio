
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Home, Search, Library, Heart, LogOut, LogIn, Plus } from 'lucide-react';
import { useAuth, useUser } from '@/firebase';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { ScrollArea } from './ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { useUserPreferences } from '@/hooks/use-user-preferences';
import { useSongs } from '@/hooks/use-songs';
import { useAppContext } from '@/context/AppContext';

export default function AuthButtons() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const { setActivePage } = useAppContext();
  const { likedSongIds } = useUserPreferences(user?.uid);
  const { songs } = useSongs();

  const likedSongs = songs.filter(song => likedSongIds.includes(song.id!));

  const handleNavigation = (path: string) => {
    setActivePage('home');
    router.push(path);
  };
  
  if (isUserLoading) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <>
      <SidebarGroup>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={() => handleNavigation('/')} isActive={router.pathname === '/'}>
              <Home />
              <span>Home</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={() => handleNavigation('/search')}>
              <Search />
              <span>Search</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>

      {user && (
        <SidebarGroup className="flex-grow flex flex-col min-h-0">
           <SidebarMenu>
              <SidebarMenuItem>
                  <SidebarMenuButton>
                      <Library />
                      <span>Your Library</span>
                      <Plus size={18} className="ml-auto opacity-70 hover:opacity-100" />
                  </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                  <SidebarMenuButton>
                      <div className="liked-songs-icon"><Heart /></div>
                      <span>Liked Songs</span>
                  </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          <ScrollArea className="flex-grow mt-4">
            {likedSongs.length > 0 && (
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
            )}
          </ScrollArea>
        </SidebarGroup>
      )}


      <SidebarFooter>
        {user ? (
          <SidebarMenuButton onClick={() => auth.signOut()}>
            <LogOut />
            <span>Sign Out</span>
          </SidebarMenuButton>
        ) : (
          <SidebarMenuButton onClick={() => router.push('/login')}>
            <LogIn />
            <span>Sign In</span>
          </SidebarMenuButton>
        )}
      </SidebarFooter>
    </>
  );
}
