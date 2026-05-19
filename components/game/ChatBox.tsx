'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useNetworkStore } from '@/store/useNetworkStore';
import { Button, Input, Badge, Avatar, Divider } from '@/components/ui';
import { Send, X, MessageSquare, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const senderColors = [
  'text-amber-400',
  'text-blue-400',
  'text-green-400',
  'text-purple-400',
  'text-pink-400',
  'text-cyan-400',
  'text-orange-400',
  'text-emerald-400',
];

function getSenderColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return senderColors[Math.abs(hash) % senderColors.length];
}

function isSystemMessage(sender: string): boolean {
  return sender === 'System';
}

export function ChatBox() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const chatMessages = useNetworkStore((state) => state.chatMessages || []);
  const sendChatMessage = useNetworkStore((state) => state.sendChatMessage);

  const bottomRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isOpen]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const onFocus = () => {
      if ('visualViewport' in window) {
        const vv = (window as any).visualViewport;
        const onResize = () => {
          const diff = window.innerHeight - vv.height;
          setKeyboardHeight(Math.max(0, diff));
        };
        vv.addEventListener('resize', onResize);
        return () => vv.removeEventListener('resize', onResize);
      }
    };
    const input = document.querySelector('.chat-input');
    if (input) {
      input.addEventListener('focus', onFocus);
      return () => input.removeEventListener('focus', onFocus);
    }
  }, [isOpen]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    sendChatMessage(inputText);
    setInputText('');
  };

  if (!isOpen) {
    const unreadCount = chatMessages.length > 0 ? chatMessages.slice(-3).length : 0;
    return (
      <Button
        variant="icon"
        size="icon"
        onClick={() => setIsOpen(true)}
        className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl"
      >
        <MessageSquare size={18} className="sm:size-22" />
        {unreadCount > 0 && (
          <Badge variant="danger" size="xs" className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 flex items-center justify-center">
            {unreadCount}
          </Badge>
        )}
      </Button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      ref={chatRef}
      className="pointer-events-auto flex flex-col overflow-hidden shadow-2xl border border-slate-700/60 rounded-2xl bg-slate-900/95 backdrop-blur-md"
      style={{
        width: 'min(90vw, 360px)',
        height: keyboardHeight > 0 ? '200px' : 'min(40dvh, 280px)',
        maxHeight: 'min(60dvh, 400px)',
      }}
    >
      <div className="flex items-center justify-between px-3 py-2 bg-slate-950/40 border-b border-slate-800/60">
        <div className="flex items-center gap-2">
          <MessageSquare size={14} className="text-blue-400" />
          <span className="text-white text-xs font-black uppercase tracking-widest">Global Relay</span>
        </div>
        <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/10 rounded-lg text-slate-500 hover:text-white transition-colors">
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2 custom-scrollbar">
        {chatMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full opacity-20 py-8">
            <MessageSquare size={32} />
            <span className="text-[10px] font-black uppercase tracking-widest mt-2">Silence...</span>
          </div>
        ) : (
          chatMessages.map(msg => {
            const system = isSystemMessage(msg.sender);
            return (
              <div key={msg.id} className={cn("flex items-start gap-2", system && "bg-blue-500/5 p-1.5 rounded-lg border border-blue-500/10")}>
                {!system && (
                  <div className="w-5 h-5 rounded-lg bg-slate-800 flex-shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-1.5">
                     <span className={cn("text-[10px] font-black uppercase tracking-tight", system ? "text-blue-400" : getSenderColor(msg.sender))}>
                       {msg.sender || 'Unknown'}
                     </span>
                     <span className="text-[8px] text-slate-600 font-mono">[{new Date(msg.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}]</span>
                  </div>
                  <p className="text-slate-200 text-[11px] leading-relaxed break-words">{msg.text}</p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="p-2 bg-slate-950/20 border-t border-slate-800/60 flex gap-2">
        <input
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          placeholder="Sync thought..."
          className="chat-input flex-1 bg-slate-900/50 border border-slate-800 rounded-xl px-3 py-1.5 text-[11px] text-white focus:outline-none focus:border-blue-500/50 transition-colors"
          onKeyDown={e => e.stopPropagation()}
        />
        <Button variant="primary" size="icon" type="submit" disabled={!inputText.trim()} className="w-8 h-8 rounded-lg">
          <Send size={14} />
        </Button>
      </form>
    </motion.div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
