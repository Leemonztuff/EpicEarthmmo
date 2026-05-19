'use client';

import React, { useState, useEffect } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { motion, AnimatePresence } from 'framer-motion';

export function MapNameDisplay() {
  const currentMapId = useGameStore((state) => state.currentMapId);
  const [show, setShow] = useState(false);

  const mapNames: Record<string, string> = {
    prontera: 'Prontera City',
    prontera_fields: 'Prontera Fields',
    geffen_dungeon: 'Geffen Dungeon',
  };

  const name = mapNames[currentMapId] || (currentMapId ? currentMapId.replace(/_/g, ' ') : '');

  useEffect(() => {
    if (!currentMapId) return;
    setShow(true);
    const timer = setTimeout(() => setShow(false), 5000);
    return () => clearTimeout(timer);
  }, [currentMapId]);

  return (
    <div className="absolute top-20 sm:top-24 left-0 right-0 pointer-events-none flex justify-center z-50 px-6">
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: -40, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 1.5, filter: 'blur(15px)', transition: { duration: 1 } }}
            className="flex flex-col items-center w-full max-w-[500px]"
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ duration: 1 }}
              className="h-[1px] bg-gradient-to-r from-transparent via-blue-400 to-transparent mb-2 sm:mb-3"
            />
            <motion.h1
              initial={{ letterSpacing: '0.1em' }}
              animate={{ letterSpacing: '0.4em' }}
              transition={{ duration: 4 }}
              className="text-white font-black text-xl sm:text-3xl uppercase italic drop-shadow-[0_4px_15px_rgba(0,0,0,1)] text-center break-words"
            >
              {name}
            </motion.h1>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: '80%' }}
              transition={{ duration: 1, delay: 0.2 }}
              className="h-[1px] bg-gradient-to-r from-transparent via-blue-600/50 to-transparent mt-2 sm:mt-3"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
