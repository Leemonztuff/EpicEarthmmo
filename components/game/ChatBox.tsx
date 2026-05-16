import React, { useState, useRef, useEffect } from 'react';
import { useNetworkStore } from '@/store/useNetworkStore';

export function ChatBox() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const chatMessages = useNetworkStore((state) => state.chatMessages);
  const sendChatMessage = useNetworkStore((state) => state.sendChatMessage);

  const bottomRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isOpen]);

  useEffect(() => {
    const onFocus = () => {
      if (typeof window !== 'undefined' && 'visualViewport' in window) {
        const vv = (window as any).visualViewport;
        const onResize = () => {
          const diff = window.innerHeight - vv.height;
          setKeyboardHeight(Math.max(0, diff));
          if (chatRef.current && diff > 100) {
            chatRef.current.style.maxHeight = `${vv.height - 100}px`;
          }
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
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="pointer-events-auto bg-slate-900/80 text-white p-3 rounded-md border border-slate-700 text-xs font-bold touch-manipulation"
      >
        Chat
      </button>
    );
  }

  return (
    <div
      ref={chatRef}
      className="pointer-events-auto bg-slate-900/80 border border-slate-700 rounded-md flex flex-col overflow-hidden shadow-lg font-sans"
      style={{
        width: 'min(85vw, 380px)',
        height: keyboardHeight > 0 ? `calc(100dvh - ${keyboardHeight + 60}px)` : 'min(50dvh, 300px)',
        maxHeight: 'min(70dvh, 400px)',
      }}
    >
      <div className="bg-slate-800 p-3 flex justify-between items-center border-b border-slate-700">
        <span className="text-white text-sm font-bold">Local Chat</span>
        <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white flex items-center justify-center w-10 h-10 touch-manipulation">
          <span className="text-lg">&times;</span>
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 space-y-1 text-sm">
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
          autoComplete="off"
          className="chat-input w-full bg-slate-900 text-white border border-slate-600 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 touch-manipulation"
          onKeyDown={(e) => e.stopPropagation()}
        />
      </form>
    </div>
  );
}
