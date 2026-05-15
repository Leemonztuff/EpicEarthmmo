import { GameWrapper } from '@/components/game/GameWrapper';
import { HUD } from '@/components/game/HUD';

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-black overflow-hidden relative">
      <div 
        className="relative shadow-2xl bg-neutral-900 overflow-hidden shadow-[0_0_50px_rgba(30,58,138,0.3)] ring-1 ring-white/10"
        style={{
           width: '100vw',
           maxWidth: '430px',
           height: '100svh',
           aspectRatio: '9/16'
        }}
      >
        <GameWrapper />
        <HUD />
      </div>
    </main>
  );
}
