'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { Button, Input, Card, Text, Spinner, Avatar, showToast, Badge } from '@/components/ui';
import { Sword, Plus, Trash2, ArrowRight } from 'lucide-react';

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
          jobClass: 'novice',
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
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" color="blue" />
          <Text variant="body" className="mt-4 text-slate-400">Loading characters...</Text>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-purple-600/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-blue-900/50">
            <Sword size={24} className="text-white" />
          </div>
          <Text variant="heading" className="text-xl">Select Character</Text>
          <Text variant="caption" className="mt-1">{user?.email}</Text>
        </div>

        {characters.length > 0 && (
          <div className="space-y-2 mb-4">
            {characters.map(char => {
              const state = char.state;
              return (
                <Card
                  key={char.id}
                  variant={selectedChar === char.id ? 'default' : 'outline'}
                  padding="sm"
                  rounded="xl"
                  className={`cursor-pointer transition-all ${
                    selectedChar === char.id ? 'border-blue-500/50 bg-slate-800/70' : 'border-slate-700/40 hover:border-slate-600/50'
                  }`}
                  onClick={() => setSelectedChar(char.id)}
                >
                  <div className="flex items-center gap-3">
                    <Avatar name={state.name} level={state.baseLevel} size="md" ringColor="gradient" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Text variant="value" className="text-sm truncate">{state.name}</Text>
                        <Badge variant="primary" size="xs">Lv.{state.baseLevel}</Badge>
                      </div>
                      <Text variant="caption">{state.jobClass} • Job Lv.{state.jobLevel}</Text>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(char.id); }}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 hover:text-red-400 hover:bg-red-900/20 touch-manipulation transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {showCreate ? (
          <Card variant="elevated" padding="md" rounded="xl" className="mb-4">
            <Text variant="subheading" className="mb-3">New Character</Text>
            <Input
              label="Character Name"
              value={newName}
              onChange={e => { setNewName(e.target.value); setError(''); }}
              placeholder="Enter name..."
              maxLength={20}
              variant="filled"
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
            />
            {error && <Text variant="error" className="mt-2">{error}</Text>}
            <div className="flex gap-2 mt-3">
              <Button variant="secondary" size="md" onClick={() => { setShowCreate(false); setError(''); }} className="flex-1">
                Cancel
              </Button>
              <Button variant="primary" size="md" onClick={handleCreate} disabled={creating || newName.length < 3} className="flex-1">
                {creating ? <Spinner size="sm" color="white" /> : 'Create'}
              </Button>
            </div>
          </Card>
        ) : (
          <Button
            variant="outline"
            size="md"
            onClick={() => setShowCreate(true)}
            className="w-full mb-4"
          >
            <Plus size={16} /> New Character
          </Button>
        )}

        <div className="flex gap-2">
          <Button variant="ghost" size="md" onClick={onLogout} className="flex-1">
            Logout
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={handleSelect}
            disabled={!selectedChar}
            className="flex-1"
          >
            Play <ArrowRight size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
}
