'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Text, Spinner } from '@/components/ui';
import { Sparkles } from 'lucide-react';

export function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center z-[100]">
      <div className="relative">
        <motion.div
          animate={{
            rotate: 360,
            scale: [1, 1.1, 1],
          }}
          transition={{
            rotate: { duration: 20, repeat: Infinity, ease: "linear" },
            scale: { duration: 4, repeat: Infinity, ease: "easeInOut" }
          }}
          className="w-32 h-32 rounded-[2rem] border border-blue-500/20 bg-blue-500/5 flex items-center justify-center shadow-[0_0_50px_rgba(59,130,246,0.1)]"
        >
          <Sparkles size={48} className="text-blue-400 opacity-50" />
        </motion.div>

        <div className="absolute inset-0 flex items-center justify-center">
           <Spinner size="lg" color="blue" />
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-12 text-center"
      >
        <Text variant="heading" className="text-blue-100 tracking-[0.3em] uppercase font-black text-xl italic mb-2">
          Entering World
        </Text>
        <div className="flex gap-1 justify-center">
           {[0, 1, 2].map(i => (
             <motion.div
              key={i}
              animate={{ opacity: [0.2, 1, 0.2] }}
              transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
              className="w-1.5 h-1.5 rounded-full bg-blue-500"
             />
           ))}
        </div>
      </motion.div>

      <div className="absolute bottom-12 left-0 right-0 px-8 flex justify-center">
        <div className="max-w-xs w-full">
           <div className="h-1 w-full bg-slate-900 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
                className="h-full bg-gradient-to-r from-blue-600 to-blue-400"
              />
           </div>
           <p className="text-slate-600 text-[10px] uppercase font-black tracking-widest text-center mt-3">
             Loading high-fidelity assets...
           </p>
        </div>
      </div>
    </div>
  );
}
