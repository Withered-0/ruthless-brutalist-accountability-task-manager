import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import {
  Plus, Volume2, Radio, Clock, ShieldAlert, LogOut, Lock, Edit3, Trash2, Skull
} from 'lucide-react';
import { api } from '@/lib/api-client';
import type { Task, TaskBoardState, TaskPriority } from '@shared/types';
import { cn, getExaggeratedFailureRate, getLifeWastedEstimate } from '@/lib/utils';
import { BrutalCard, BrutalButton, BrutalInput, BrutalBadge } from '@/components/brutalist-ui';
import { Toaster, toast } from 'sonner';
import { snark } from '@/lib/snark-engine';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
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
    refetchInterval: 5000,
  });
  const prevOverdueCount = useMemo(() => {
    if (!board) return 0;
    return board.tasks.filter(t => t.status === 'OVERDUE').length;
  }, [board]);
  useEffect(() => {
    if (error) navigate('/login');
  }, [error, navigate]);
  useEffect(() => {
    if (board && !board.nickname && !isNicknameModal) {
      setIsNicknameModal(true);
    }
  }, [board, isNicknameModal]);
  useEffect(() => {
    if (board) {
      const currentOverdue = board.tasks.filter(t => t.status === 'OVERDUE').length;
      if (currentOverdue > prevOverdueCount) {
        snark.playSound('death_knell');
        toast.error("THE KNELL TOLLS. ANOTHER FAILURE LOGGED.");
      }
    }
  }, [board, prevOverdueCount]);
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
  if (!board) return <div className="p-20 text-4xl font-black flex items-center justify-center min-h-screen bg-black text-white">RECALLING CRIMES...</div>;
  const lockoutSeconds = board.lockoutUntil ? Math.ceil((board.lockoutUntil - Date.now()) / 1000) : 0;
  const isLockedOut = lockoutSeconds > 0;
  const glitchStyle = {
    filter: board.glitchLevel > 30 ? `hue-rotate(${board.glitchLevel}deg) contrast(1.2)` : 'none',
    transform: board.glitchLevel > 60 ? `skew(${Math.random() * 5 - 2.5}deg)` : 'none',
  };
  return (
    <div className={cn("min-h-screen bg-black text-white font-mono pb-24", board.glitchLevel > 75 && "animate-glitch")} style={glitchStyle}>
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
            <Link to="/shame">
              <BrutalButton variant="danger" className="text-xl py-4"><Skull className="mr-2 h-6 w-6" /> CRIMINAL RECORD</BrutalButton>
            </Link>
            <BrutalButton variant="blue" className="text-xl py-4" onClick={() => setIsModalOpen(true)}>
              <Plus className="mr-2 h-6 w-6" /> ADD BURDEN
            </BrutalButton>
          </div>
        </header>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <BrutalCard className="bg-zinc-900 border-white"><span className="text-[10px] font-black uppercase text-zinc-500">FAILURE RATE</span><p className="text-5xl font-black text-red-600">{getExaggeratedFailureRate(board.tasks)}</p></BrutalCard>
          <BrutalCard className="bg-zinc-900 border-white"><span className="text-[10px] font-black uppercase text-zinc-500">STOLEN VALOR</span><p className="text-5xl font-black text-orange-600">{board.stolenValor?.length || 0}</p></BrutalCard>
          <BrutalCard className="bg-zinc-900 border-white"><span className="text-[10px] font-black uppercase text-zinc-500">LIFE WASTED</span><p className="text-5xl font-black">{Math.round(getLifeWastedEstimate(board.tasks))}%</p></BrutalCard>
          <BrutalCard className="bg-green-600 border-black text-white"><span className="text-[10px] font-black uppercase text-white/60">DONE</span><p className="text-5xl font-black">{board.tasks.filter(t => t.status === 'COMPLETED').length}</p></BrutalCard>
        </div>
        <section className="space-y-6">
          <h2 className="text-4xl font-black uppercase tracking-tighter border-b-4 border-white pb-2">PENDING DOOMS</h2>
          <div className="grid grid-cols-1 gap-4">
            {board.tasks.filter(t => t.status !== 'COMPLETED' && t.status !== 'ABANDONED').map(task => (
              <BrutalCard key={task.id} className={cn("bg-zinc-950 border-white flex flex-col md:flex-row justify-between items-center p-6", task.status === 'OVERDUE' && "border-red-600 border-4")}>
                <div className="mb-4 md:mb-0">
                  <h3 className="text-2xl font-black uppercase flex items-center gap-3">
                    {task.title} 
                    {task.status === 'OVERDUE' && <BrutalBadge variant="crit">OVERDUE</BrutalBadge>}
                  </h3>
                  <p className="text-zinc-500 text-sm mb-2">{task.description}</p>
                  <div className="flex gap-4 text-xs font-bold text-zinc-400 uppercase">
                    <span className="flex items-center gap-1"><ShieldAlert className="h-3 w-3" /> {task.priority}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> DUE: {new Date(task.deadline).toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                  <BrutalButton variant="success" className="flex-1 md:flex-none" onClick={() => updateTask.mutate({ id: task.id, updates: { status: 'COMPLETED' } })}>DONE</BrutalButton>
                  <BrutalButton className="p-2" onClick={() => { setEditingTask(task); setTaskForm(task); setIsModalOpen(true); }}><Edit3 className="h-5 w-5" /></BrutalButton>
                  <BrutalButton variant="danger" className="flex-1 md:flex-none" onClick={() => updateTask.mutate({ id: task.id, updates: { status: 'ABANDONED' } })}>QUIT</BrutalButton>
                  <BrutalButton className="p-2 border-red-600 text-red-600" onClick={() => deleteTask.mutate(task.id)}><Trash2 className="h-5 w-5" /></BrutalButton>
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
          <BrutalButton onClick={() => setIsMuted(snark.toggleMute())} className="py-1 px-4 text-xs bg-white text-black">{isMuted ? 'UNMUTE' : 'MUTE'}</BrutalButton>
        </footer>
      </div>
      <Dialog open={isModalOpen} onOpenChange={(open) => { setIsModalOpen(open); if (!open) setEditingTask(null); }}>
        <DialogContent className="bg-white text-black border-8 border-black p-8 sm:max-w-[500px]">
          <DialogHeader><DialogTitle className="text-3xl font-black uppercase tracking-tighter">{editingTask ? 'AMEND YOUR LIES' : 'ADD NEW BURDEN'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase">Burden Title</label>
              <BrutalInput value={taskForm.title} onChange={e => setTaskForm({...taskForm, title: e.target.value})} placeholder="E.G. FINISH THE DAMN REPORT" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase">Excuses / Description</label>
              <BrutalInput value={taskForm.description} onChange={e => setTaskForm({...taskForm, description: e.target.value})} placeholder="TELL ME WHY THIS MATTERS" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase">Priority</label>
                <Select value={taskForm.priority} onValueChange={(v: TaskPriority) => setTaskForm({...taskForm, priority: v})}>
                  <SelectTrigger className="border-3 border-black font-black uppercase"><SelectValue /></SelectTrigger>
                  <SelectContent className="border-3 border-black"><SelectItem value="LOW">LOW</SelectItem><SelectItem value="MEDIUM">MEDIUM</SelectItem><SelectItem value="HIGH">HIGH</SelectItem><SelectItem value="CRITICAL">CRITICAL</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase">Deadline</label>
                <BrutalInput type="datetime-local" value={taskForm.deadline} onChange={e => setTaskForm({...taskForm, deadline: e.target.value})} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <BrutalButton className="w-full text-xl py-6" variant={editingTask ? 'blue' : 'primary'} onClick={() => editingTask ? updateTask.mutate({ id: editingTask.id, updates: taskForm }) : addTask.mutate(taskForm)}>
              {editingTask ? 'UPDATE THE LIE' : 'ACCEPT THE BURDEN'}
            </BrutalButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Toaster position="top-center" theme="dark" richColors />
    </div>
  );
}