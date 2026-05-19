'use client';

import React, { useEffect, useState } from 'react';
import { useNetworkStore } from '@/store/useNetworkStore';
import { motion } from 'framer-motion';

const SOCKET_URL = process.env.NEXT_PUBLIC_GAME_SERVER_URL || 'http://localhost:3001';

export function ConnectionBadge() {
  const isConnected = useNetworkStore(s => s.isConnected);
  const [serverUrl] = useState(() => {
    try { return new URL(SOCKET_URL).hostname; }
    catch { return 'unknown'; }
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-950/50 backdrop-blur-md border border-slate-800/60 shadow-lg"
    >
      <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.6)]' : 'bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.6)]'}`} />
      <span className="text-[10px] font-medium text-slate-400 truncate max-w-[140px]">
        {isConnected ? serverUrl : 'Offline — datos locales'}
      </span>
    </motion.div>
  );
}
