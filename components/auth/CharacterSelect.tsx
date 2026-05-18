'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { Button, Input, Card, Text, Spinner, Avatar, showToast, Badge, IconBox } from '@/components/ui';
import { Sword, Plus, Trash2, ArrowRight, Sparkles, User, Shield } from 'lucide-react';
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
  const [selectedChar, setSelectedChar] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loadCharacters();
  }, [user]);

  const loadCharacters = async () => {
    if (!supabase || !user) return;
    const { data, error } = await supabase
      .from('characters')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (data) setCharacters(data as CharacterData[]);
    setLoading(false);
    if (data && data.length > 0 && !selectedChar) {
      setSelectedChar(data[0].id);
    }
  };

  const handleCreate = async () => {
    if (!supabase || !user || !newName.trim()) return;
    if (newName.length < 3 || newName.length > 20) {
      setError('Name must be 3-20 characters');
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(newName)) {
      setError('Name can only contain letters, numbers, and underscores');
      return;
    }

    setCreating(true);
    setError('');

    const { error: err } = await supabase
      .from('characters')
      .insert({
        user_id: user.id,
        name: newName.trim(),
        state: {
          name: newName.trim(),
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
      });

    setCreating(false);

    if (err) {
      if (err.code === '23505') {
        setError('Character name already taken');
      } else {
        setError(err.message);
      }
    } else {
      setNewName('');
      setShowCreate(false);
      showToast('Character created!', 'success');
      loadCharacters();
    }
  };

  const handleDelete = async (charId: string) => {
    if (!supabase) return;
    if (!confirm('Are you sure you want to delete this character?')) return;
    const { error: err } = await supabase.from('characters').delete().eq('id', charId);
    if (!err) {
      showToast('Character deleted', 'warning');
      loadCharacters();
    }
  };

  const handleSelect = () => {
    const char = characters.find(c => c.id === selectedChar);
    if (char) onSelect(char);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="w-20 h-20 rounded-[2rem] bg-blue-600/10 flex items-center justify-center mb-6"
        >
          <Sparkles size={32} className="text-blue-500" />
        </motion.div>
        <Text variant="heading" className="text-white text-xl tracking-[0.2em] uppercase font-black italic">Synchronizing</Text>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0">
         <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.05)_0%,transparent_70%)]" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg relative z-10"
      >
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic mb-2">
            Select <span className="text-blue-500">Hero</span>
          </h1>
          <div className="flex items-center justify-center gap-2">
             <div className="h-[1px] w-12 bg-slate-800" />
             <Text variant="caption" className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">{user?.email}</Text>
             <div className="h-[1px] w-12 bg-slate-800" />
          </div>
        </div>

        <div className="space-y-3 mb-8 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          <AnimatePresence mode="popLayout">
            {characters.map((char, index) => {
              const state = char.state;
              const isSelected = selectedChar === char.id;
              return (
                <motion.div
                  key={char.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card
                    variant={isSelected ? 'default' : 'outline'}
                    padding="sm"
                    rounded="2xl"
                    className={cn(
                      "cursor-pointer transition-all duration-300 relative group overflow-hidden h-24 flex items-center",
                      isSelected
                        ? "bg-slate-900 border-blue-500/50 shadow-[0_0_25px_-5px_rgba(59,130,246,0.3)] ring-1 ring-blue-500/20"
                        : "border-slate-800 hover:border-slate-700 bg-slate-950/50"
                    )}
                    onClick={() => setSelectedChar(char.id)}
                  >
                    {isSelected && (
                      <motion.div
                        layoutId="active-char-bg"
                        className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-transparent pointer-events-none"
                      />
                    )}

                    <div className="flex items-center gap-4 w-full relative z-10 px-2">
                      <div className="relative">
                        <Avatar name={state.name} level={state.baseLevel} size="md" ringColor={isSelected ? "gradient" : "gray"} className="shadow-xl" />
                        {isSelected && (
                          <motion.div
                            layoutId="check-icon"
                            className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center border-2 border-slate-900"
                          >
                            <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                          </motion.div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Text variant="value" className={cn("text-lg font-black tracking-tight transition-colors", isSelected ? "text-white" : "text-slate-400")}>
                            {state.name}
                          </Text>
                          <Badge variant={isSelected ? "primary" : "default"} size="xs" className="h-5">LV {state.baseLevel}</Badge>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                             {state.jobClass}
                          </span>
                          <div className="w-1 h-1 rounded-full bg-slate-800" />
                          <span className="text-[10px] font-bold text-slate-600 italic">
                             Job Lv. {state.jobLevel}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(char.id); }}
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-700 hover:text-red-400 hover:bg-red-950/30 transition-all active:scale-90"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {!showCreate && characters.length < 3 && (
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowCreate(true)}
              className="w-full h-20 border-2 border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center gap-1 text-slate-600 hover:text-blue-500 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all cursor-pointer"
            >
              <Plus size={24} />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Recruit New Hero</span>
            </motion.button>
          )}
        </div>

        {showCreate && (
          <Card variant="elevated" padding="lg" rounded="3xl" className="mb-8 border-slate-700 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
               <IconBox icon={<User size={20} />} color="blue" size="md" rounded="sm" />
               <Text variant="subheading" className="text-white font-black text-lg">Create New Hero</Text>
            </div>

            <div className="space-y-4">
              <Input
                label="Hero Name"
                value={newName}
                onChange={e => { setNewName(e.target.value); setError(''); }}
                placeholder="Enter character name..."
                maxLength={20}
                variant="filled"
                className="bg-slate-900 border-slate-800"
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
              />

              <AnimatePresence>
                {error && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-red-400 text-xs font-bold px-1">
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex gap-3 pt-2">
                <Button variant="ghost" size="md" onClick={() => { setShowCreate(false); setError(''); }} className="flex-1 rounded-xl">
                  Cancel
                </Button>
                <Button variant="primary" size="md" onClick={handleCreate} disabled={creating || newName.length < 3} className="flex-1 rounded-xl shadow-blue-600/20">
                  {creating ? <Spinner size="sm" color="white" /> : 'Create Hero'}
                </Button>
              </div>
            </div>
          </Card>
        )}

        <div className="flex gap-4">
          <Button variant="ghost" size="lg" onClick={onLogout} className="flex-1 rounded-2xl text-slate-500 hover:text-white uppercase tracking-widest text-[11px] font-black">
            Disconnect
          </Button>
          <Button
            variant="primary"
            size="lg"
            onClick={handleSelect}
            disabled={!selectedChar}
            className="flex-1 rounded-2xl shadow-blue-600/20 h-16 text-lg font-black italic uppercase tracking-tighter"
          >
            Enter World <ArrowRight size={20} className="ml-2" />
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
