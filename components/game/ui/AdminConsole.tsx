'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { useNetworkStore } from '@/store/useNetworkStore';
import { Modal, Input, Button, Badge } from '@/components/ui';
import { Terminal, Send, Trash2, Cpu, Zap, Ghost, Map as MapIcon, Box } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function AdminConsole({ onClose }: { onClose: () => void }) {
  const [command, setCommand] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const player = useGameStore(state => state.player);
  const enemies = useGameStore(state => state.enemies || {});
  const remotePlayers = useNetworkStore(state => state.remotePlayers || {});
  const socket = useNetworkStore(state => state.socket);

  const addLog = (msg: string) => {
    setHistory(prev => [...prev, `> ${msg}`].slice(-50));
  };

  const handleExecute = () => {
    if (!command.trim()) return;
    const [cmd, ...args] = command.trim().split(' ');

    addLog(command);

    switch (cmd.toLowerCase()) {
      case '/help':
        addLog('Available: /tp x z, /spawn id, /give id amt, /setlevel lvl, /killall, /stats');
        break;
      case '/stats':
        addLog(`HP: ${player?.hp}/${player?.maxHp}, Pos: ${useGameStore.getState().position?.x?.toFixed(1)}, ${useGameStore.getState().position?.z?.toFixed(1)}`);
        break;
      case '/tp':
        if (args.length >= 2) {
           const x = parseFloat(args[0]);
           const z = parseFloat(args[1]);
           useGameStore.getState().setPosition({ x, y: 0.5, z });
           addLog(`Teleported to ${x}, ${z}`);
        }
        break;
      case '/spawn':
        if (args[0] && socket) {
           socket.emit('adminCommand', { type: 'spawn', enemyId: args[0] });
           addLog(`Requested spawn: ${args[0]}`);
        }
        break;
      case '/killall':
        if (socket) {
          socket.emit('adminCommand', { type: 'killAll' });
          addLog('Wiping all entities...');
        }
        break;
      default:
        addLog(`Unknown command: ${cmd}`);
    }

    setCommand('');
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  return (
    <Modal isOpen onClose={onClose} title="Developer Console" subtitle="System Level Access" size="lg" position="bottom">
      <div className="space-y-4">
        {/* Quick Stats Grid */}
        <div className="grid grid-cols-4 gap-2">
           <QuickStat icon={<Cpu size={12} />} label="FPS" value="60" color="green" />
           <QuickStat icon={<MapIcon size={12} />} label="Entities" value={(Object.keys(enemies).length + Object.keys(remotePlayers).length + 1).toString()} color="blue" />
           <QuickStat icon={<Zap size={12} />} label="Ping" value="24ms" color="amber" />
           <QuickStat icon={<Box size={12} />} label="Draw" value="1.2k" color="purple" />
        </div>

        {/* Command Output */}
        <div className="bg-black/80 rounded-2xl border border-slate-800 p-4 h-48 overflow-y-auto font-mono text-[11px] custom-scrollbar" ref={scrollRef}>
          <AnimatePresence initial={false}>
            {history.map((line, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                className={line.startsWith('>') ? "text-blue-400" : "text-slate-500"}
              >
                {line}
              </motion.div>
            ))}
          </AnimatePresence>
          {history.length === 0 && <div className="text-slate-700 italic">Type /help to see commands...</div>}
        </div>

        {/* Input Area */}
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              value={command}
              onChange={e => setCommand(e.target.value)}
              placeholder="Enter admin command..."
              onKeyDown={e => e.key === 'Enter' && handleExecute()}
              variant="filled"
              className="bg-slate-900 border-slate-800"
              icon={<Terminal size={16} className="text-blue-500" />}
            />
          </div>
          <Button onClick={handleExecute} className="px-6 h-12 shadow-blue-500/20">
            <Send size={18} />
          </Button>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-800">
           <QuickAction icon={<Trash2 size={12} />} label="Clear Logs" onClick={() => setHistory([])} />
           <QuickAction icon={<Ghost size={12} />} label="God Mode" onClick={() => addLog('God Mode Enabled')} />
           <QuickAction icon={<MapIcon size={12} />} label="Reload Data" onClick={() => addLog('Hot reloading resources...')} />
        </div>
      </div>
    </Modal>
  );
}

function QuickStat({ icon, label, value, color }: any) {
  const colors: any = {
    green: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  };
  return (
    <div className={cn("p-2 rounded-xl border flex flex-col items-center gap-0.5", colors[color])}>
       {icon}
       <span className="text-[8px] font-black uppercase opacity-60">{label}</span>
       <span className="text-[10px] font-black">{value}</span>
    </div>
  );
}

function QuickAction({ icon, label, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/40 border border-slate-700/50 text-[10px] font-black text-slate-400 hover:text-white hover:bg-slate-700/60 transition-all cursor-pointer"
    >
      {icon}
      <span className="uppercase tracking-widest">{label}</span>
    </button>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
