import React, { useState, useRef, useEffect } from 'react';
import { useNetworkStore } from '@/store/useNetworkStore';
import { Button, Input, Badge, Avatar, Divider } from '@/components/ui';
import { Send, X, MessageSquare, Shield, Crown } from 'lucide-react';

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
  for (let i = 0; i < name.length; i++) {
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
    const unreadCount = chatMessages.length > 0 ? chatMessages.slice(-3).length : 0;
    return (
      <Button variant="icon" size="icon" onClick={() => setIsOpen(true)} className="relative">
        <MessageSquare size={18} />
        {unreadCount > 0 && (
          <Badge variant="danger" size="xs" className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 flex items-center justify-center">
            {unreadCount}
          </Badge>
        )}
      </Button>
    );
  }

  return (
    <div
      ref={chatRef}
      className="pointer-events-auto flex flex-col overflow-hidden shadow-2xl border border-slate-700/60 rounded-2xl bg-slate-900/95 backdrop-blur-md"
      style={{
        width: 'min(85vw, 340px)',
        height: keyboardHeight > 0 ? `calc(100dvh - ${keyboardHeight + 60}px)` : 'min(50dvh, 280px)',
        maxHeight: 'min(70dvh, 380px)',
      }}
    >
      <div className="flex items-center justify-between px-3 py-2.5 bg-gradient-to-r from-blue-900/60 to-slate-900/60 border-b border-slate-700/50">
        <div className="flex items-center gap-2">
          <MessageSquare size={14} className="text-blue-400" />
          <span className="text-white text-sm font-bold">Local Chat</span>
          <Badge variant="primary" size="xs">{chatMessages.length}</Badge>
        </div>
        <Button variant="ghost" size="iconSm" onClick={() => setIsOpen(false)}>
          <X size={16} />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5">
        {chatMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-600">
            <MessageSquare size={24} className="mb-2 opacity-50" />
            <span className="text-xs">No messages yet</span>
          </div>
        ) : (
          chatMessages.map(msg => {
            const system = isSystemMessage(msg.sender);
            return (
              <div key={msg.id} className={`flex items-start gap-2 ${system ? 'opacity-70' : ''}`}>
                {!system && (
                  <Avatar name={msg.sender} size="xs" ringColor="blue" showLevel={false} />
                )}
                {system && (
                  <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0">
                    <Shield size={10} className="text-slate-500" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <span className={`text-xs font-bold ${system ? 'text-slate-500' : getSenderColor(msg.sender)}`}>
                    {msg.sender}
                  </span>
                  <span className="text-slate-300 text-xs ml-1 break-words">{msg.text}</span>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <Divider />

      <form onSubmit={handleSend} className="p-2 flex gap-2">
        <Input
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          placeholder="Type a message..."
          className="chat-input flex-1"
          onKeyDown={e => e.stopPropagation()}
          inputSize="sm"
          variant="filled"
        />
        <Button variant="primary" size="icon" type="submit" disabled={!inputText.trim()}>
          <Send size={16} />
        </Button>
      </form>
    </div>
  );
}
