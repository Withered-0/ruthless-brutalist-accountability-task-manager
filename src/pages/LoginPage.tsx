import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Skull } from 'lucide-react';
import { api } from '@/lib/api-client';
import { BrutalCard, BrutalButton, BrutalInput } from '@/components/brutalist-ui';
import { toast } from 'sonner';
import { snark } from '@/lib/snark-engine';
import { useQueryClient } from '@tanstack/react-query';
export function LoginPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', nickname: '' });
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
      await api(endpoint, {
        method: 'POST',
        body: JSON.stringify(form),
      });
      // Reset app state for clean slate
      queryClient.clear();
      // Hint to Snark Engine that user is active
      snark.unlock();
      toast.success(isRegister ? "YOUR SOUL IS LOGGED." : "WELCOME BACK TO HELL.");
      navigate('/');
    } catch (err: any) {
      toast.error(err.message || "FAILURE AT THE GATES.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen bg-black text-white font-mono flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <header className="text-center">
          <div className="inline-block border-4 border-red-600 p-4 mb-6 animate-pulse">
            <Skull className="h-16 w-16 text-red-600" />
          </div>
          <h1 className="text-5xl font-black uppercase tracking-tighter text-red-600 leading-none">
            DIGITAL<br />PURGATORY
          </h1>
          <p className="mt-4 text-zinc-500 font-bold uppercase text-xs tracking-widest">
            {isRegister ? 'SIGN AWAY YOUR EXCUSES' : 'VALIDATE YOUR INCOMPETENCE'}
          </p>
        </header>
        <BrutalCard className="bg-zinc-950 border-white p-8 shadow-[12px_12px_0px_0px_rgba(255,255,255,1)]">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="text-[10px] font-black uppercase text-zinc-500 block mb-1">Email Address</label>
              <BrutalInput
                type="email"
                required
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="YOU@FAILURE.COM"
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-zinc-500 block mb-1">Password</label>
              <BrutalInput
                type="password"
                required
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder="********"
              />
            </div>
            {isRegister && (
              <div>
                <label className="text-[10px] font-black uppercase text-zinc-500 block mb-1">Target Nickname</label>
                <BrutalInput
                  value={form.nickname}
                  onChange={e => setForm({ ...form, nickname: e.target.value })}
                  placeholder="WHINER_99"
                />
              </div>
            )}
            <BrutalButton
              type="submit"
              className="w-full py-4 text-xl bg-red-600 text-white border-white"
              disabled={loading}
            >
              {loading ? 'PROCESSING...' : (isRegister ? 'ENTER PURGATORY' : 'LOG IN')}
            </BrutalButton>
          </form>
          <div className="mt-6 text-center">
            <button
              onClick={() => setIsRegister(!isRegister)}
              className="text-xs uppercase font-black text-zinc-400 hover:text-white underline decoration-red-600 underline-offset-4"
            >
              {isRegister ? 'ALREADY A PRISONER? LOGIN' : 'NEW TO THE NIGHTMARE? REGISTER'}
            </button>
          </div>
        </BrutalCard>
        <footer className="text-[10px] text-zinc-600 text-center uppercase leading-relaxed max-w-xs mx-auto">
          BY ENTERING, YOU AGREE TO BE VERBALLY ABUSED BY A ROBOT UNTIL YOUR PRODUCTIVITY IMPROVES.
        </footer>
      </div>
    </div>
  );
}