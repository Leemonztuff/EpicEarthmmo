import React, { useState, useRef, useEffect } from 'react';
import { useNetworkStore } from '@/store/useNetworkStore';
import { useGameStore } from '@/store/useGameStore';

export function ChatBox() {
  const [isOpen, setIsOpen] = useState(true);
  const [inputText, setInputText] = useState('');
  const chatMessages = useNetworkStore((state) => state.chatMessages);
  const sendChatMessage = useNetworkStore((state) => state.sendChatMessage);
  const player = useGameStore((state) => state.player);
  
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isOpen]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    
    sendChatMessage(inputText, player.name);
    setInputText('');
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="pointer-events-auto bg-slate-900/80 text-white p-2 rounded-md border border-slate-700 text-xs font-bold"
      >
        Open Chat
      </button>
    );
  }

  return (
    <div className="pointer-events-auto w-80 bg-slate-900/80 border border-slate-700 rounded-md flex flex-col h-64 overflow-hidden shadow-lg font-sans">
      <div className="bg-slate-800 p-2 flex justify-between items-center border-b border-slate-700">
        <span className="text-white text-xs font-bold">Local Chat</span>
        <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white pb-1">
          &times;
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 space-y-1 text-xs">
        {chatMessages.map(msg => (
          <div key={msg.id} className="text-slate-200 break-words">
            <span className="font-bold text-amber-400">{msg.sender}:</span> {msg.text}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="p-2 border-t border-slate-700 bg-slate-800">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Say something..."
          className="w-full bg-slate-900 text-white border border-slate-600 rounded px-2 py-1 text-xs focus:outline-none focus:border-blue-500"
          onKeyDown={(e) => {
            // Stop propagation so we don't accidentally trigger game shortcuts if any
            e.stopPropagation();
          }}
        />
      </form>
    </div>
  );
}
