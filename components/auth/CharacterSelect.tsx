'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { Button, Input, Card, Text, Spinner, Avatar, showToast, Badge, IconBox } from '@/components/ui';
import { Sword, Plus, Trash2, ArrowRight, Sparkles, User, LogOut, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CharacterData {
  id: string;
  name: string;
  state: any;
  created_at: string;
}

interface CharacterSelectProps {
  onSelect: (character: CharacterData) => void;
  onLogout: () => void;
}

export function CharacterSelect({ onSelect, onLogout }: CharacterSelectProps) {
  const { user } = useAuth();
  const [characters, setCharacters] = useState<CharacterData[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [selectedCharId, setSelectedCharId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [isEntering, setIsEntering] = useState(false);

  useEffect(() => {
    loadCharacters();
  }, [user]);

  const loadCharacters = async () => {
    if (!supabase || !user) return;
    try {
      const { data, error: fetchError } = await supabase
        .from('characters')
        .select('id, name, state, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setCharacters(data as CharacterData[]);
      if (data && data.length > 0 && !selectedCharId) {
        setSelectedCharId(data[0].id);
      }
    } catch (err: any) {
      console.error('Error fetching characters:', err);
      showToast('Failed to load hero list', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!supabase || !user || !newName.trim()) return;

    const cleanName = newName.trim();
    if (cleanName.length < 3 || cleanName.length > 20) {
      setError('Hero name must be 3-20 characters');
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(cleanName)) {
      setError('Use only letters, numbers, and underscores');
      return;
    }

    setCreating(true);
    setError('');

    try {
      const { data, error: insertError } = await supabase
        .from('characters')
        .insert({
          user_id: user.id,
          name: cleanName,
          state: {
            name: cleanName,
            baseLevel: 1,
            jobLevel: 1,
            baseExp: 0,
            jobExp: 0,
            hp: 50,
            maxHp: 50,
            sp: 10,
            maxSp: 10,
            zeny: 0,
            jobClass: 'Novice',
            stats: { str: 5, agi: 5, vit: 5, int: 5, dex: 5, luk: 5, statPoints: 0 },
            skillPoints: 5,
            unlockedSkills: ['basic_attack'],
            inventory: [
              { id: 'red_potion', name: 'Red Potion', type: 'usable', amount: 10, description: 'Restores 30 HP.' },
              { id: 'iron_sword', name: 'Iron Sword', type: 'equip', amount: 1, description: 'A basic sword. +2 STR' },
              { id: 'cotton_shirt', name: 'Cotton Shirt', type: 'equip', amount: 1, description: 'A light shirt. +1 VIT' },
            ],
            equippedItems: {},
          },
        })
        .select();

      if (insertError) {
        if (insertError.code === '23505') {
          setError('This name is already claimed by another hero');
        } else {
          setError(insertError.message);
        }
      } else {
        setNewName('');
        setShowCreate(false);
        showToast('Hero recruited!', 'success');
        await loadCharacters();
        if (data && data[0]) {
          setSelectedCharId(data[0].id);
        }
      }
    } catch (err: any) {
      setError('Communication failure with the barracks');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (charId: string) => {
    if (!supabase) return;
    if (!confirm('Are you sure you want to dismiss this hero? All progress will be lost.')) return;

    try {
      const { error: deleteError } = await supabase
        .from('characters')
        .delete()
        .eq('id', charId);

      if (deleteError) throw deleteError;

      showToast('Hero dismissed', 'warning');
      if (selectedCharId === charId) setSelectedCharId(null);
      loadCharacters();
    } catch (err) {
      showToast('The hero refuses to leave!', 'error');
    }
  };

  const handleSelect = () => {
    if (!selectedCharId) return;
    const char = characters.find(c => c.id === selectedCharId);
    if (char) {
       setIsEntering(true);
       setTimeout(() => onSelect(char), 1000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
          className="w-24 h-24 rounded-[2.5rem] bg-blue-600/10 flex items-center justify-center mb-8 border border-blue-500/20"
        >
          <Sparkles size={40} className="text-blue-500 animate-pulse" />
        </motion.div>
        <Text variant="heading" className="text-white text-xl tracking-[0.4em] uppercase font-black italic">Synchronizing</Text>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0">
         <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.08)_0%,transparent_70%)]" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-xl relative z-10"
      >
        <div className="flex items-center justify-between mb-8">
           <div>
              <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">
                Select <span className="text-blue-500">Hero</span>
              </h1>
              <div className="flex items-center gap-2 mt-1">
                 <ShieldCheck size={12} className="text-emerald-500" />
                 <Text variant="caption" className="text-slate-500 font-bold uppercase tracking-widest text-[9px]">{user?.email}</Text>
              </div>
           </div>
           <Button variant="ghost" size="sm" onClick={onLogout} className="rounded-xl text-slate-500 hover:text-red-400 gap-1.5 h-9">
              <LogOut size={14} /> Disconnect
           </Button>
        </div>

        <div className="grid grid-cols-1 gap-3 mb-8 max-h-[450px] overflow-y-auto pr-3 custom-scrollbar">
          <AnimatePresence mode="popLayout">
            {characters.map((char, index) => {
              const state = char.state;
              const isSelected = selectedCharId === char.id;
              return (
                <motion.div
                  key={char.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.08 }}
                >
                  <Card
                    variant={isSelected ? 'default' : 'outline'}
                    padding="none"
                    rounded="3xl"
                    className={cn(
                      "cursor-pointer transition-all duration-300 relative group overflow-hidden border-2",
                      isSelected
                        ? "bg-slate-900 border-blue-500 shadow-[0_0_30px_-5px_rgba(59,130,246,0.4)] ring-4 ring-blue-500/10"
                        : "border-slate-800 hover:border-slate-700 bg-slate-950/40"
                    )}
                    onClick={() => setSelectedCharId(char.id)}
                  >
                    {isSelected && (
                      <motion.div
                        layoutId="char-glow"
                        className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-transparent pointer-events-none"
                      />
                    )}

                    <div className="flex items-center gap-5 w-full relative z-10 p-5">
                      <div className="relative">
                        <Avatar name={state.name} level={state.baseLevel} size="lg" ringColor={isSelected ? "gradient" : "gray"} className="shadow-2xl" />
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute -top-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center border-2 border-slate-900 shadow-lg"
                          >
                            <div className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
                          </motion.div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1.5">
                          <Text variant="value" className={cn("text-xl font-black tracking-tight transition-colors", isSelected ? "text-white" : "text-slate-500")}>
                            {state.name}
                          </Text>
                          <Badge variant={isSelected ? "primary" : "default"} size="sm" className="h-6 px-2">LV {state.baseLevel}</Badge>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1.5">
                             <Sword size={12} className="text-slate-600" />
                             <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                {state.jobClass}
                             </span>
                          </div>
                          <div className="w-1 h-1 rounded-full bg-slate-800" />
                          <span className="text-[10px] font-bold text-slate-600 italic">
                             Job Lv. {state.jobLevel}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(char.id); }}
                        className="w-11 h-11 rounded-2xl flex items-center justify-center text-slate-700 hover:text-red-400 hover:bg-red-500/10 transition-all active:scale-90"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {!showCreate && characters.length < 5 && (
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowCreate(true)}
              className="w-full h-24 border-2 border-dashed border-slate-800 rounded-[2rem] flex flex-col items-center justify-center gap-2 text-slate-600 hover:text-blue-500 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all cursor-pointer"
            >
              <Plus size={32} />
              <span className="text-[11px] font-black uppercase tracking-[0.3em]">Recruit New Hero</span>
            </motion.button>
          )}
        </div>

        {showCreate && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card variant="elevated" padding="lg" rounded="3xl" className="mb-8 border-slate-700 shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-5">
                  <User size={120} />
               </div>

               <div className="flex items-center gap-3 mb-6 relative z-10">
                  <IconBox icon={<User size={20} />} color="blue" size="md" rounded="sm" />
                  <Text variant="subheading" className="text-white font-black text-lg uppercase tracking-tight">Recruitment Protocol</Text>
               </div>

               <div className="space-y-5 relative z-10">
                 <Input
                   label="Codename / Hero Name"
                   value={newName}
                   onChange={e => { setNewName(e.target.value); setError(''); }}
                   placeholder="Enter character name..."
                   maxLength={20}
                   variant="filled"
                   className="bg-slate-900 border-slate-800 h-14 text-lg font-bold"
                   onKeyDown={e => e.key === 'Enter' && handleCreate()}
                 />

                 <AnimatePresence mode="wait">
                   {error && (
                     <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="text-red-400 text-xs font-bold px-1 bg-red-500/5 border border-red-500/20 p-3 rounded-xl">
                       {error}
                     </motion.div>
                   )}
                 </AnimatePresence>

                 <div className="flex gap-3 pt-2">
                   <Button variant="ghost" size="lg" onClick={() => { setShowCreate(false); setError(''); }} className="flex-1 rounded-2xl h-14">
                     Abort
                   </Button>
                   <Button variant="primary" size="lg" onClick={handleCreate} disabled={creating || newName.length < 3} className="flex-2 rounded-2xl h-14 shadow-blue-600/20">
                     {creating ? <Spinner size="sm" color="white" /> : (
                       <span className="flex items-center gap-2">Confirm <ShieldCheck size={18} /></span>
                     )}
                   </Button>
                 </div>
               </div>
            </Card>
          </motion.div>
        )}

        <div className="flex flex-col gap-4">
          <Button
            variant="primary"
            size="lg"
            onClick={handleSelect}
            disabled={!selectedCharId || isEntering}
            className="w-full rounded-[2rem] shadow-blue-600/20 h-20 text-2xl font-black italic uppercase tracking-tighter"
          >
            {isEntering ? <Spinner size="md" color="white" /> : (
              <span className="flex items-center gap-3">
                 Enter the World <ArrowRight size={24} className="animate-pulse" />
              </span>
            )}
          </Button>
        </div>

        <p className="mt-8 text-center text-slate-700 text-[9px] font-black uppercase tracking-[0.5em] opacity-40">
           Connection Secured • Proxy-Alpha-09
        </p>
      </motion.div>
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
