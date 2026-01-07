import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, Volume2, Radio, Clock, ShieldAlert, Edit3, Trash2, Skull, Lock } from 'lucide-react';
import { api } from '@/lib/api-client';
import type { Task, TaskBoardState, TaskPriority } from '@shared/types';
import { cn, getExaggeratedFailureRate, getLifeWastedEstimate, isUserInert } from '@/lib/utils';
import { BrutalCard, BrutalButton, BrutalInput, BrutalBadge } from '@/components/brutalist-ui';
import { Toaster, toast } from 'sonner';
import { snark } from '@/lib/snark-engine';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
export function HomePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isMuted, setIsMuted] = useState(snark.getMuteStatus());
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNicknameModal, setIsNicknameModal] = useState(false);
  const [nicknameInput, setNicknameInput] = useState('');
  const [taskForm, setTaskForm] = useState<Partial<Task>>({
    title: '', description: '', priority: 'MEDIUM', deadline: ''
  });
  const { data: board, error } = useQuery<TaskBoardState>({
    queryKey: ['board'],
    queryFn: () => api<TaskBoardState>('/api/board'),
    retry: false,
    refetchInterval: 10000,
  });
  useEffect(() => {
    if (error) navigate('/login');
  }, [error, navigate]);
  useEffect(() => {
    if (board && !board.nickname && !isNicknameModal) {
      setIsNicknameModal(true);
    }
  }, [board, isNicknameModal]);
  useEffect(() => {
    if (board && isUnlocked) {
      // 1. Inactivity Check
      if (isUserInert(board.lastAccess)) {
        toast.warning("LONG TIME NO SEE. YOUR BOARD HAS DECAYED.");
      }
      // 2. Newly Overdue Alert
      if (board.newlyOverdue && board.newlyOverdue.length > 0) {
        snark.playSound('death_knell');
        toast.error(`${board.newlyOverdue.length} TASKS EXPIRED WHILE YOU WERE SLACKING.`);
      }
    }
  }, [board, isUnlocked]);
  const onboardUser = useMutation({
    mutationFn: (nickname: string) => api<TaskBoardState>('/api/user/onboard', {
      method: 'POST',
      body: JSON.stringify({ nickname })
    }),
    onSuccess: (_, nickname) => {
      queryClient.invalidateQueries({ queryKey: ['board'] });
      setIsNicknameModal(false);
      snark.speak('welcome', nickname);
    }
  });
  const addTask = useMutation({
    mutationFn: (task: Partial<Task>) => api<TaskBoardState>('/api/board/task', { method: 'POST', body: JSON.stringify(task) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board'] });
      setIsModalOpen(false);
      snark.speak('task_added', board?.nickname);
      setTaskForm({ title: '', description: '', priority: 'MEDIUM', deadline: '' });
    }
  });
  const updateTask = useMutation({
    mutationFn: ({ id, updates }: { id: string, updates: Partial<Task> }) =>
      api<TaskBoardState>(`/api/board/task/${id}`, { method: 'PATCH', body: JSON.stringify(updates) }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['board'] });
      setEditingTask(null);
      if (variables.updates.status === 'COMPLETED') snark.speak('task_completed', board?.nickname);
      if (variables.updates.status === 'ABANDONED') {
        snark.playSound('chicken');
        snark.speak('task_abandoned', board?.nickname);
      }
    }
  });
  const deleteTask = useMutation({
    mutationFn: (id: string) => api(`/api/board/task/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['board'] })
  });
  if (!board) return <div className="p-20 text-4xl font-black flex items-center justify-center min-h-screen bg-black text-white">PROBING FAILURES...</div>;
  const lockoutSeconds = board.lockoutUntil ? Math.ceil((board.lockoutUntil - Date.now()) / 1000) : 0;
  const isLockedOut = lockoutSeconds > 0;
  const exRate = getExaggeratedFailureRate(board.tasks);
  const isHighFailure = parseInt(exRate) < -500;
  return (
    <div className={cn("min-h-screen bg-black text-white font-mono pb-24 transition-all duration-700", board.glitchLevel > 75 && "animate-glitch")}>
      {!isUnlocked && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-6 text-white">
          <BrutalButton className="text-4xl p-12 bg-red-600 text-white border-white animate-bounce shadow-[12px_12px_0px_0px_rgba(255,255,255,1)]" onClick={() => { snark.unlock(); setIsUnlocked(true); snark.speak('welcome', board.nickname); }}>
            <Volume2 className="inline mr-4 h-12 w-12" /> ACCEPT YOUR SHAME
          </BrutalButton>
        </div>
      )}
      {isLockedOut && (
        <div className="fixed inset-0 z-[90] bg-red-600 flex flex-col items-center justify-center p-6 text-white text-center">
          <Lock className="h-48 w-48 mb-8 animate-pulse" />
          <h2 className="text-7xl font-black uppercase tracking-tighter mb-4">LOCKOUT</h2>
          <p className="text-2xl font-bold max-w-md uppercase">RECOVER FROM YOUR COWARDICE IN {lockoutSeconds}S.</p>
        </div>
      )}
      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12 space-y-12">
        <header className="flex flex-col md:flex-row justify-between items-center gap-6 border-b-8 border-white pb-8">
          <div>
            <h1 className="text-5xl md:text-8xl font-black uppercase text-red-600 tracking-tighter leading-none">
              RUTHLESS {board.nickname && <span className="text-white">_ {board.nickname}</span>}
            </h1>
            <p className="text-xl font-bold italic text-zinc-400 mt-2 uppercase">Your failure is being recorded.</p>
          </div>
          <div className="flex gap-4">
            <Link to="/shame">
              <BrutalButton variant="danger" className="text-xl py-4"><Skull className="mr-2 h-6 w-6" /> CRIMES</BrutalButton>
            </Link>
            <BrutalButton variant="blue" className="text-xl py-4" onClick={() => setIsModalOpen(true)}>
              <Plus className="mr-2 h-6 w-6" /> NEW BURDEN
            </BrutalButton>
          </div>
        </header>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <BrutalCard className={cn("bg-zinc-900 border-white", isHighFailure && "animate-pulse border-red-600")}>
            <span className="text-[10px] font-black uppercase text-zinc-500">FAILURE QUOTIENT</span>
            <p className={cn("text-5xl font-black", isHighFailure ? "text-red-600 glitch-text" : "text-white")}>{exRate}</p>
          </BrutalCard>
          <BrutalCard className="bg-zinc-900 border-white">
            <span className="text-[10px] font-black uppercase text-zinc-500">STOLEN VALOR</span>
            <p className="text-5xl font-black text-orange-600">{board.stolenValor?.length || 0}</p>
          </BrutalCard>
          <BrutalCard className="bg-zinc-900 border-white">
            <span className="text-[10px] font-black uppercase text-zinc-500">LIFE WASTED</span>
            <p className="text-5xl font-black">{Math.round(getLifeWastedEstimate(board.tasks))}%</p>
          </BrutalCard>
          <BrutalCard className="bg-green-600 border-black text-white">
            <span className="text-[10px] font-black uppercase text-white/60">REDEEMED</span>
            <p className="text-5xl font-black">{board.tasks.filter(t => t.status === 'COMPLETED').length}</p>
          </BrutalCard>
        </div>
        <section className="space-y-6">
          <h2 className="text-4xl font-black uppercase tracking-tighter border-b-4 border-white pb-2 flex items-center justify-between">
            ACTIVE BURDENS
            <span className="text-sm font-bold text-zinc-600">COUNT: {board.tasks.length}</span>
          </h2>
          <div className="grid grid-cols-1 gap-4">
            {board.tasks.filter(t => t.status !== 'COMPLETED' && t.status !== 'ABANDONED').map(task => (
              <BrutalCard key={task.id} className={cn("bg-zinc-950 border-white flex flex-col md:flex-row justify-between items-center p-6 transition-all", task.status === 'OVERDUE' && "border-red-600 border-4 shadow-[4px_4px_0px_0px_#ff0000]")}>
                <div className="mb-4 md:mb-0 flex-1">
                  <h3 className="text-3xl font-black uppercase flex items-center gap-3">
                    {task.title}
                    {task.status === 'OVERDUE' && <BrutalBadge variant="crit">EXPIRED</BrutalBadge>}
                  </h3>
                  <p className="text-zinc-500 text-sm mt-1">{task.description}</p>
                  <div className="flex gap-4 text-xs font-bold text-zinc-500 uppercase mt-4">
                    <span className="flex items-center gap-1 border border-zinc-800 px-2 py-1"><ShieldAlert className="h-3 w-3" /> {task.priority}</span>
                    <span className="flex items-center gap-1 border border-zinc-800 px-2 py-1"><Clock className="h-3 w-3" /> BY: {new Date(task.deadline).toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                  <BrutalButton variant="success" className="px-8" onClick={() => updateTask.mutate({ id: task.id, updates: { status: 'COMPLETED' } })}>DONE</BrutalButton>
                  <BrutalButton variant="danger" onClick={() => updateTask.mutate({ id: task.id, updates: { status: 'ABANDONED' } })}>QUIT</BrutalButton>
                  <BrutalButton className="p-2 border-white text-white hover:bg-white hover:text-black" onClick={() => deleteTask.mutate(task.id)}><Trash2 className="h-5 w-5" /></BrutalButton>
                </div>
              </BrutalCard>
            ))}
          </div>
        </section>
        <footer className="fixed bottom-0 left-0 right-0 bg-black border-t-4 border-white p-4 z-40 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Radio className={cn("h-4 w-4", isMuted ? "text-red-600" : "text-green-500 animate-pulse")} />
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">ABUSE_ENGINE: {isMuted ? 'SILENCED' : 'ACTIVE'}</span>
          </div>
          <BrutalButton onClick={() => setIsMuted(snark.toggleMute())} className="py-1 px-4 text-xs bg-white text-black">{isMuted ? 'ENABLE ABUSE' : 'MUTE ROBOT'}</BrutalButton>
        </footer>
      </div>
      <Dialog open={isModalOpen} onOpenChange={(open) => { setIsModalOpen(open); if (!open) setEditingTask(null); }}>
        <DialogContent className="bg-white text-black border-[12px] border-black p-8 sm:max-w-[500px]">
          <DialogHeader><DialogTitle className="text-4xl font-black uppercase tracking-tighter">NEW BURDEN</DialogTitle></DialogHeader>
          <DialogDescription className="text-xs font-bold uppercase text-zinc-600 mb-4">Add another task you'll definitely forget.</DialogDescription>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase">Title</label>
              <BrutalInput value={taskForm.title} onChange={e => setTaskForm({...taskForm, title: e.target.value})} placeholder="E.G. STOP BEING LAZY" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase">Deadline</label>
              <BrutalInput type="datetime-local" value={taskForm.deadline} onChange={e => setTaskForm({...taskForm, deadline: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase">Priority</label>
              <Select value={taskForm.priority} onValueChange={(v: TaskPriority) => setTaskForm({...taskForm, priority: v})}>
                <SelectTrigger className="border-3 border-black font-black uppercase h-12"><SelectValue /></SelectTrigger>
                <SelectContent className="border-3 border-black"><SelectItem value="LOW">LOW</SelectItem><SelectItem value="MEDIUM">MEDIUM</SelectItem><SelectItem value="HIGH">HIGH</SelectItem><SelectItem value="CRITICAL">CRITICAL</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <BrutalButton className="w-full text-2xl py-8 bg-black text-white" onClick={() => editingTask ? updateTask.mutate({ id: editingTask.id, updates: taskForm }) : addTask.mutate(taskForm)}>
              ACCEPT FATE
            </BrutalButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isNicknameModal} onOpenChange={setIsNicknameModal}>
        <DialogContent className="bg-red-600 text-white border-[16px] border-white p-12 sm:max-w-[600px]">
          <DialogHeader><DialogTitle className="text-6xl font-black uppercase tracking-tighter leading-none">IDENTIFY YOURSELF</DialogTitle></DialogHeader>
          <div className="space-y-6 py-8">
            <p className="text-xl font-bold uppercase">The system requires a nickname to mock you with surgical precision.</p>
            <BrutalInput value={nicknameInput} onChange={e => setNicknameInput(e.target.value)} placeholder="COWARD_69" className="text-3xl py-8 bg-white text-black border-4 border-black" />
          </div>
          <DialogFooter>
            <BrutalButton className="w-full text-3xl py-10 bg-black text-white hover:bg-white hover:text-black border-4 border-white" onClick={() => nicknameInput.trim() && onboardUser.mutate(nicknameInput.trim())}>
              LOG IDENTITY
            </BrutalButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Toaster position="top-center" theme="dark" richColors />
    </div>
  );
}