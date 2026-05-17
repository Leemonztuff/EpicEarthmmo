'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { Button, Input, Card, Text, Spinner, showToast } from '@/components/ui';
import { Sword, Mail, Lock, Eye, EyeOff } from 'lucide-react';

export function AuthForm() {
  const { signIn, signUp } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error: err } = isSignUp ? await signUp(email, password) : await signIn(email, password);

    setLoading(false);

    if (err) {
      setError(err);
    } else {
      showToast(isSignUp ? 'Account created! Please check your email.' : 'Welcome back!', 'success');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
      </div>

      <Card variant="elevated" rounded="2xl" padding="lg" className="w-full max-w-sm relative z-10 border-slate-700/60 shadow-2xl shadow-black/50">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-blue-900/50">
            <Sword size={28} className="text-white" />
          </div>
          <Text variant="heading" className="text-xl">EpicEarthMMO</Text>
          <Text variant="caption" className="mt-1">
            {isSignUp ? 'Create your account' : 'Sign in to play'}
          </Text>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            icon={<Mail size={16} />}
            required
            variant="filled"
          />

          <div className="relative">
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              icon={<Lock size={16} />}
              required
              variant="filled"
              minLength={6}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-[34px] text-slate-500 hover:text-slate-300 touch-manipulation"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-500/30 rounded-lg px-3 py-2">
              <Text variant="error">{error}</Text>
            </div>
          )}

          <Button
            variant="primary"
            size="lg"
            type="submit"
            disabled={loading || !email || password.length < 6}
            className="w-full"
          >
            {loading ? <Spinner size="sm" color="white" /> : isSignUp ? 'Create Account' : 'Sign In'}
          </Button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
            className="text-blue-400 hover:text-blue-300 text-sm touch-manipulation"
          >
            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </button>
        </div>
      </Card>
    </div>
  );
}
