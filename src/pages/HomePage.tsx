import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Volume2, VolumeX, Radio, Clock, ShieldAlert, LogOut, Lock
} from 'lucide-react';
import { api } from '@/lib/api-client';
import type { Task, TaskBoardState, TaskPriority } from '@shared/types';
import { cn, calculateFailureRate, getExaggeratedFailureRate, getLifeWastedEstimate, getSarcasticStatusMessage } from '@/lib/utils';
import { BrutalCard, BrutalButton, BrutalInput, BrutalBadge } from '@/components/brutalist-ui';
import { Toaster, toast } from 'sonner';
import { snark } from '@/lib/snark-engine';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
export function HomePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isMuted, setIsMuted] = useState(snark.getMuteStatus());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNicknameModal, setIsNicknameModal] = useState(false);
  const [nicknameInput, setNicknameInput] = useState('');
  const { data: board, error } = useQuery<TaskBoardState>({
    queryKey: ['board'],
    queryFn: () => api<TaskBoardState>('/api/board'),
    retry: false,
    refetchInterval: 5000,
  });
  useEffect(() => {
    if (error) navigate('/login');
  }, [error, navigate]);
  useEffect(() => {
    if (board && !board.nickname && !isNicknameModal) {
      setIsNicknameModal(true);
    }
  }, [board, isNicknameModal]);
  const updateNickname = useMutation({
    mutationFn: (nickname: string) => api('/api/user/onboard', { method: 'POST', body: JSON.stringify({ nickname }) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board'] });
      setIsNicknameModal(false);
      snark.speak('welcome', nicknameInput);
    }
  });
  const logout = async () => {
    await api('/api/auth/logout', { method: 'POST' });
    snark.speak('idle_shame');
    navigate('/login');
  };
  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string, status: Task['status'] }) =>
      api<TaskBoardState>(`/api/board/task/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['board'] });
      if (variables.status === 'COMPLETED') snark.speak('task_completed', board?.nickname);
      if (variables.status === 'ABANDONED') {
        snark.playSound('chicken');
        snark.speak('task_abandoned', board?.nickname);
      }
    },
  });
  if (!board) return <div className="p-20 text-4xl font-black flex items-center justify-center min-h-screen bg-black text-white">RECALLING YOUR CRIMES...</div>;
  const lockoutSeconds = board.lockoutUntil ? Math.ceil((board.lockoutUntil - Date.now()) / 1000) : 0;
  const isLockedOut = lockoutSeconds > 0;
  return (
    <div className={cn("min-h-screen bg-black text-white font-mono pb-24", board.failureRate > 75 && "animate-glitch")}>
      {!isUnlocked && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-6 text-white">
          <BrutalButton className="text-4xl p-12 bg-red-600 text-white border-white animate-bounce shadow-[10px_10px_0px_0px_rgba(255,255,255,1)]" onClick={() => { snark.unlock(); setIsUnlocked(true); snark.speak('welcome', board.nickname); }}>
            <Volume2 className="inline mr-4 h-12 w-12" /> INITIALIZE SHAME
          </BrutalButton>
        </div>
      )}
      {isLockedOut && (
        <div className="fixed inset-0 z-[90] bg-red-600/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-white text-center">
          <Lock className="h-32 w-32 mb-8 animate-bounce" />
          <h2 className="text-6xl font-black uppercase tracking-tighter mb-4">COWARD LOCKOUT</h2>
          <p className="text-2xl font-bold max-w-md uppercase">YOU GAVE UP. THINK ABOUT YOUR FAILURES FOR {lockoutSeconds}s.</p>
        </div>
      )}
      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12 space-y-12">
        <header className="flex flex-col md:flex-row justify-between items-center gap-6 border-b-8 border-white pb-8">
          <div>
            <h1 className="text-5xl md:text-7xl font-black uppercase text-red-600 tracking-tighter leading-none">
              RUTHLESS {board.nickname && <span className="text-white">_ {board.nickname}</span>}
            </h1>
            <p className="text-xl font-bold italic text-zinc-400">Accountability is not optional.</p>
          </div>
          <div className="flex gap-4">
            <BrutalButton variant="blue" className="text-xl py-4" onClick={() => setIsModalOpen(true)}>
              <Plus className="mr-2 h-6 w-6" /> ADD BURDEN
            </BrutalButton>
          </div>
        </header>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <BrutalCard className="bg-zinc-900 border-white flex flex-col justify-between">
            <span className="text-[10px] font-black uppercase text-zinc-500">FAILURE RATE</span>
            <p className="text-5xl font-black text-red-600">{getExaggeratedFailureRate(board.tasks)}</p>
          </BrutalCard>
          <BrutalCard className="bg-zinc-900 border-white flex flex-col justify-between">
            <span className="text-[10px] font-black uppercase text-zinc-500">STOLEN VALOR</span>
            <p className="text-5xl font-black text-orange-600">{board.stolenValor?.length || 0}</p>
          </BrutalCard>
          <BrutalCard className="bg-zinc-900 border-white flex flex-col justify-between">
            <span className="text-[10px] font-black uppercase text-zinc-500">LIFE WASTED</span>
            <p className="text-5xl font-black">{Math.round(getLifeWastedEstimate(board.tasks))}%</p>
          </BrutalCard>
          <BrutalCard className="bg-green-600 border-black text-white flex flex-col justify-between">
            <span className="text-[10px] font-black uppercase text-white/60">DONE</span>
            <p className="text-5xl font-black">{board.tasks.filter(t => t.status === 'COMPLETED').length}</p>
          </BrutalCard>
        </div>
        <section className="space-y-6">
          <h2 className="text-4xl font-black uppercase tracking-tighter border-b-4 border-white pb-2">PENDING DOOMS</h2>
          <div className="grid grid-cols-1 gap-4">
            {board.tasks.filter(t => t.status !== 'COMPLETED' && t.status !== 'ABANDONED').map(task => (
              <BrutalCard key={task.id} className={cn("bg-zinc-950 border-white flex justify-between items-center p-6", task.status === 'OVERDUE' && "border-red-600")}>
                <div>
                  <h3 className="text-2xl font-black uppercase">{task.title}</h3>
                  <div className="flex gap-4 mt-2 text-xs font-bold text-zinc-500 uppercase">
                    <span>{task.priority}</span>
                    <span>DUE: {new Date(task.deadline).toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <BrutalButton variant="success" className="p-2" onClick={() => updateStatus.mutate({ id: task.id, status: 'COMPLETED' })}>DONE</BrutalButton>
                  <BrutalButton variant="danger" className="p-2" onClick={() => updateStatus.mutate({ id: task.id, status: 'ABANDONED' })}>QUIT</BrutalButton>
                </div>
              </BrutalCard>
            ))}
          </div>
        </section>
        <footer className="fixed bottom-0 left-0 right-0 bg-black border-t-4 border-white p-4 z-40 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Radio className={cn("h-4 w-4", isMuted ? "text-red-600" : "text-green-500 animate-pulse")} />
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">SHAMING: {isMuted ? 'SILENCED' : 'ACTIVE'}</span>
          </div>
          <div className="flex gap-4">
            <BrutalButton onClick={() => setIsMuted(snark.toggleMute())} className="py-1 px-4 text-xs bg-white text-black">{isMuted ? 'UNMUTE' : 'MUTE'}</BrutalButton>
            <BrutalButton onClick={logout} variant="danger" className="py-1 px-4 text-xs">RESIGN (LOGOUT)</BrutalButton>
          </div>
        </footer>
      </div>
      <Dialog open={isNicknameModal} onOpenChange={setIsNicknameModal}>
        <DialogContent className="bg-white text-black border-8 border-black p-8">
          <DialogHeader><DialogTitle className="text-3xl font-black uppercase">CHOOSE YOUR MONIKER</DialogTitle></DialogHeader>
          <p className="font-bold text-sm mb-4">WHAT SHOULD THE ENGINE CALL YOU WHEN YOU FAIL?</p>
          <BrutalInput value={nicknameInput} onChange={e => setNicknameInput(e.target.value)} placeholder="E.G. CHRONIC_QUITTER" />
          <DialogFooter className="mt-6">
            <BrutalButton className="w-full bg-black text-white" onClick={() => updateNickname.mutate(nicknameInput)}>SUBMIT TO THE SHAME</BrutalButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Toaster position="top-center" theme="dark" richColors />
    </div>
  );
}