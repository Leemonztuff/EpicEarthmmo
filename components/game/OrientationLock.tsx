'use client';

import React, { useEffect, useState } from 'react';
import { Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function OrientationLock() {
  const [isWrongOrientation, setIsOrientation] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkOrientation = () => {
      // User requested Portrait mode specifically
      const isLandscape = window.innerWidth > window.innerHeight;
      setIsOrientation(isLandscape);
    };

    window.addEventListener('resize', checkOrientation);
    checkOrientation();
    return () => window.removeEventListener('resize', checkOrientation);
  }, []);

  return (
    <AnimatePresence>
      {isWrongOrientation && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] bg-slate-950 flex flex-col items-center justify-center p-8 text-center"
        >
          <div className="w-20 h-20 rounded-3xl bg-blue-500/10 flex items-center justify-center mb-6">
            <motion.div
               animate={{ rotate: [0, 90, 90, 0] }}
               transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <Smartphone size={40} className="text-blue-500" />
            </motion.div>
          </div>
          <h2 className="text-white font-black text-xl uppercase tracking-tighter mb-2 italic">Portrait Mode Recommended</h2>
          <p className="text-slate-500 text-sm font-medium">Please rotate your device to portrait for the best experience.</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
