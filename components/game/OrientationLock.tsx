'use client';

import React, { useEffect, useState } from 'react';
import { Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function OrientationLock() {
  const [isWrongOrientation, setIsOrientation] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkOrientation = () => {
      // Logic for mobile landscape locking if desired
      // For now we allow both but show a hint if aspect is too extreme
      const isExtremeLandscape = window.innerWidth / window.innerHeight > 2;
      // setIsOrientation(isExtremeLandscape);
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
            <Smartphone size={40} className="text-blue-500 animate-bounce" />
          </div>
          <h2 className="text-white font-black text-xl uppercase tracking-tighter mb-2 italic">Optimal View</h2>
          <p className="text-slate-500 text-sm font-medium">Please adjust your viewport for the best combat experience.</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
