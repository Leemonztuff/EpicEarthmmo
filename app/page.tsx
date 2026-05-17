'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { AuthForm } from '@/components/auth/AuthForm';
import { CharacterSelect } from '@/components/auth/CharacterSelect';
import { GameWrapper } from '@/components/game/GameWrapper';
import { HUD } from '@/components/game/HUD';
import { LoadingScreen } from '@/components/game/LoadingScreen';

type AppScreen = 'auth' | 'character-select' | 'loading' | 'game';

export default function Home() {
  const { session, user, loading: authLoading, signOut } = useAuth();
  const [screen, setScreen] = useState<AppScreen>('loading');
  const [selectedCharacter, setSelectedCharacter] = useState<any>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!session) {
      setScreen('auth');
      return;
    }

    setScreen('character-select');
  }, [session, authLoading]);

  const handleSelectCharacter = (character: any) => {
    setSelectedCharacter(character);
    setScreen('loading');

    import('@/store/useGameStore').then(({ useGameStore }) => {
      useGameStore.getState().loadCharacter(character.state);
    });

    setTimeout(() => {
      setScreen('game');
    }, 1500);
  };

  const handleLogout = async () => {
    await signOut();
    setScreen('auth');
    setSelectedCharacter(null);
  };

  if (screen === 'auth') {
    return <AuthForm />;
  }

  if (screen === 'character-select') {
    return <CharacterSelect onSelect={handleSelectCharacter} onLogout={handleLogout} />;
  }

  if (screen === 'loading') {
    return <LoadingScreen />;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-black overflow-hidden relative">
      <div
        className="game-container relative w-full h-full overflow-hidden shadow-2xl ring-1 ring-white/10"
        style={{ maxWidth: '430px', aspectRatio: '9/16' }}
      >
        <GameWrapper characterName={selectedCharacter?.state?.name} />
        <HUD characterName={selectedCharacter?.state?.name} />
      </div>
    </main>
  );
}
