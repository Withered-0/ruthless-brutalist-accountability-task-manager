import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, Volume2, Radio, Clock, ShieldAlert, Trash2, Skull, Lock, Zap } from 'lucide-react';
import { api } from '@/lib/api-client';
import type { Task, TaskBoardState, TaskPriority } from '@shared/types';
import { cn, getExaggeratedFailureRate, getLifeWastedEstimate } from '@/lib/utils';
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNicknameModal, setIsNicknameModal] = useState(false);
  const [nicknameInput, setNicknameInput] = useState('');
  const [taskForm, setTaskForm] = useState<Partial<Task>>({
    title: '', description: '', priority: 'MEDIUM', deadline: ''
  });
  const notifiedFailures = useRef<Set<string>>(new Set());
  const wasAwayNotified = useRef(false);
  const { data: board, error } = useQuery<TaskBoardState>({
    queryKey: ['board'],
    queryFn: () => api<TaskBoardState>('/api/board'),
    retry: false,
    refetchInterval: 30000, // Background sync every 30s to trigger server-side syncDeadlines
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
      if (board.wasAway && !wasAwayNotified.current) {
        toast.warning("YOUR BOARD DECAYED WHILE YOU WERE AWAY.");
        wasAwayNotified.current = true;
      }
      if (board.newlyOverdue && board.newlyOverdue.length > 0) {
        const unseenFailures = board.newlyOverdue.filter(id => !notifiedFailures.current.has(id));
        if (unseenFailures.length > 0) {
          snark.playSound('death_knell');
          toast.error(`${unseenFailures.length} BURDENS EXPIRED. THE KNELL TOLLS.`);
          unseenFailures.forEach(id => notifiedFailures.current.add(id));
        }
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
  if (!board) return <div className="p-20 text-4xl font-black flex items-center justify-center min-h-screen bg-black text-white">PROBING YOUR FAILURES...</div>;
  const lockoutSeconds = board.lockoutUntil ? Math.ceil((board.lockoutUntil - Date.now()) / 1000) : 0;
  const isLockedOut = lockoutSeconds > 0;
  const rawFailureRate = board.failureRate || 0;
  const isHighGlitch = board.glitchLevel > 60;
  const isSkullCollapsing = board.failureRate > 90;
  return (
    <div className={cn("min-h-screen bg-black text-white font-mono pb-24 transition-all duration-300", isHighGlitch && "animate-glitch")}>
      {!isUnlocked && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-6 text-white overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-red-900/20 via-black to-black opacity-50" />
          <BrutalButton 
            className="text-4xl p-12 bg-red-600 text-white border-white animate-pulse shadow-[16px_16px_0px_0px_rgba(255,255,255,1)] z-10" 
            onClick={() => { snark.unlock(); setIsUnlocked(true); snark.speak('welcome', board.nickname); }}
          >
            <Skull className="inline mr-4 h-12 w-12" /> ENTER THE NIGHTMARE
          </BrutalButton>
          <p className="mt-12 text-zinc-500 font-black tracking-widest uppercase animate-bounce">Awaiting interaction for audio clearance...</p>
        </div>
      )}
      {isLockedOut && (
        <div className="fixed inset-0 z-[95] bg-red-600 flex flex-col items-center justify-center p-6 text-white text-center">
          <Lock className="h-64 w-64 mb-8 animate-pulse text-black" />
          <h2 className="text-8xl font-black uppercase tracking-tighter mb-4 glitch-text">COWARD LOCKOUT</h2>
          <p className="text-3xl font-bold max-w-xl uppercase bg-black text-white p-4 border-4 border-white">
            RETURNING IN {lockoutSeconds}S. THINK ABOUT YOUR LIFE CHOICES.
          </p>
        </div>
      )}
      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12 space-y-12">
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 border-b-8 border-white pb-8">
          <div className="flex items-center gap-6">
            <div className={cn("h-24 w-24 bg-red-600 flex items-center justify-center border-4 border-white transition-transform duration-100", isSkullCollapsing && "animate-skull-collapse")}>
              <Skull className="h-16 w-16 text-white" />
            </div>
            <div>
              <h1 className="text-4xl md:text-7xl font-black uppercase text-red-600 tracking-tighter leading-none">
                THE PROCRASTINATOR'S <span className="text-white">NIGHTMARE</span>
              </h1>
              <p className="text-xl font-bold italic text-zinc-500 mt-2 uppercase flex items-center gap-2">
                <Zap className="h-4 w-4 text-yellow-400 fill-yellow-400" /> FAILURE_RATE_{Math.round(rawFailureRate)}%_CONFIRMED
              </p>
            </div>
          </div>
          <div className="flex gap-4 w-full lg:w-auto">
            <Link to="/shame" className="flex-1 lg:flex-none">
              <BrutalButton variant="danger" className="w-full text-xl py-6"><Skull className="mr-2 h-6 w-6" /> CRIMINAL RECORD</BrutalButton>
            </Link>
            <BrutalButton variant="blue" className="flex-1 lg:flex-none text-xl py-6" onClick={() => setIsModalOpen(true)}>
              <Plus className="mr-2 h-6 w-6" /> NEW BURDEN
            </BrutalButton>
          </div>
        </header>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <BrutalCard className={cn("bg-zinc-900 border-white", rawFailureRate > 50 && "border-red-600 shadow-brutal-red")}>
            <span className="text-[10px] font-black uppercase text-zinc-500">EXAGGERATED_SHAME</span>
            <p className={cn("text-6xl font-black", rawFailureRate > 50 ? "text-red-600 glitch-text" : "text-white")}>{getExaggeratedFailureRate(board.tasks)}</p>
          </BrutalCard>
          <BrutalCard className="bg-zinc-900 border-white">
            <span className="text-[10px] font-black uppercase text-zinc-500">STOLEN_COMPLETIONS</span>
            <p className="text-6xl font-black text-orange-600">{board.stolenValor?.length || 0}</p>
          </BrutalCard>
          <BrutalCard className="bg-zinc-900 border-white">
            <span className="text-[10px] font-black uppercase text-zinc-500">LIFE_DECAY_ESTIMATE</span>
            <p className="text-6xl font-black">{Math.round(getLifeWastedEstimate(board.tasks))}%</p>
          </BrutalCard>
          <BrutalCard className="bg-green-600 border-black text-white">
            <span className="text-[10px] font-black uppercase text-white/60">REDEEMED_TASKS</span>
            <p className="text-6xl font-black">{board.tasks.filter(t => t.status === 'COMPLETED').length}</p>
          </BrutalCard>
        </div>
        <section className="space-y-6">
          <h2 className="text-4xl font-black uppercase tracking-tighter border-b-4 border-white pb-2 flex items-center justify-between">
            ACTIVE_BURDENS
            <span className="text-sm font-bold text-zinc-600">QUEUE_DEPTH: {board.tasks.filter(t => t.status === 'PENDING' || t.status === 'OVERDUE').length}</span>
          </h2>
          <div className="grid grid-cols-1 gap-6">
            {board.tasks.filter(t => t.status !== 'COMPLETED' && t.status !== 'ABANDONED').length > 0 ? (
              board.tasks.filter(t => t.status !== 'COMPLETED' && t.status !== 'ABANDONED').map(task => (
                <BrutalCard 
                  key={task.id} 
                  className={cn(
                    "bg-zinc-950 border-white flex flex-col md:flex-row justify-between items-center p-8 transition-all relative group overflow-hidden",
                    task.status === 'OVERDUE' && "border-red-600 border-8 bg-red-950/20 shadow-brutal-red",
                    task.priority === 'CRITICAL' && "border-l-[16px] border-l-red-600",
                    task.priority === 'HIGH' && "border-l-[12px] border-l-red-500",
                    task.priority === 'MEDIUM' && "border-l-[12px] border-l-yellow-400",
                    task.priority === 'LOW' && "border-l-[12px] border-l-zinc-500"
                  )}
                >
                  {task.status === 'OVERDUE' && (
                    <div className="absolute top-0 left-0 w-full h-1 bg-red-600 animate-pulse" />
                  )}
                  <div className="mb-4 md:mb-0 flex-1 z-10">
                    <div className="flex items-center gap-4 flex-wrap">
                      <h3 className="text-3xl md:text-4xl font-black uppercase group-hover:glitch-text transition-all">
                        {task.title}
                      </h3>
                      {task.status === 'OVERDUE' && <BrutalBadge variant="crit" className="animate-pulse">TERMINATED_FAILURE</BrutalBadge>}
                    </div>
                    <p className="text-zinc-400 text-lg mt-2 font-bold uppercase">{task.description || "NO DESCRIPTION PROVIDED. TYPICAL LAZINESS."}</p>
                    <div className="flex gap-4 text-xs font-black uppercase text-zinc-500 mt-6 flex-wrap">
                      <span className="flex items-center gap-2 border-2 border-zinc-800 px-3 py-1 bg-black"><ShieldAlert className="h-4 w-4" /> SEVERITY: {task.priority}</span>
                      <span className={cn("flex items-center gap-2 border-2 px-3 py-1 bg-black", task.status === 'OVERDUE' ? "border-red-600 text-red-600" : "border-zinc-800")}><Clock className="h-4 w-4" /> DEADLINE: {new Date(task.deadline).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="flex gap-4 w-full md:w-auto z-10">
                    <BrutalButton variant="success" className="px-10 py-4 text-2xl" onClick={() => updateTask.mutate({ id: task.id, updates: { status: 'COMPLETED' } })}>DONE</BrutalButton>
                    <BrutalButton variant="danger" className="px-10 py-4 text-2xl" onClick={() => updateTask.mutate({ id: task.id, updates: { status: 'ABANDONED' } })}>GIVE UP 🐔</BrutalButton>
                    <BrutalButton className="p-4 border-white text-white hover:bg-white hover:text-black" onClick={() => deleteTask.mutate(task.id)}><Trash2 className="h-6 w-6" /></BrutalButton>
                  </div>
                </BrutalCard>
              ))
            ) : (
              <div className="text-center py-32 border-8 border-dashed border-zinc-900 bg-zinc-950/50">
                <Skull className="h-24 w-24 mx-auto text-zinc-800 mb-6 opacity-20" />
                <h2 className="text-5xl font-black text-zinc-800 uppercase tracking-tighter">THE QUEUE IS EMPTY... FOR NOW.</h2>
              </div>
            )}
          </div>
        </section>
        <footer className="fixed bottom-0 left-0 right-0 bg-black border-t-8 border-white p-6 z-40 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <Radio className={cn("h-6 w-6", isMuted ? "text-red-600" : "text-green-500 animate-pulse")} />
            <span className="text-xs font-black uppercase tracking-[0.3em] text-zinc-400">ABUSE_ENGINE_V1.1: {isMuted ? 'SILENCED_COWARD' : 'ACTIVE_SHAME'}</span>
          </div>
          <div className="flex gap-4">
             <BrutalButton onClick={() => snark.speak('idle_shame', board?.nickname)} className="py-2 px-6 text-xs bg-zinc-800 text-white border-zinc-600">MANUAL_INSULT</BrutalButton>
             <BrutalButton onClick={() => setIsMuted(snark.toggleMute())} className="py-2 px-6 text-xs bg-white text-black">{isMuted ? 'RESTORE ABUSE' : 'SILENCE ROBOT'}</BrutalButton>
          </div>
        </footer>
      </div>
      <Dialog open={isModalOpen} onOpenChange={(open) => { setIsModalOpen(open); if (!open) setTaskForm({ title: '', description: '', priority: 'MEDIUM', deadline: '' }); }}>
        <DialogContent className="bg-white text-black border-[16px] border-black p-10 sm:max-w-[600px] shadow-[24px_24px_0px_0px_rgba(0,0,0,1)]">
          <DialogHeader><DialogTitle className="text-5xl font-black uppercase tracking-tighter leading-none">COMMIT BURDEN</DialogTitle></DialogHeader>
          <DialogDescription className="text-sm font-black uppercase text-zinc-600 mb-6">Enter a task you'll definitely abandon later.</DialogDescription>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase">BURDEN_TITLE</label>
              <BrutalInput className="text-2xl border-4" value={taskForm.title} onChange={e => setTaskForm({...taskForm, title: e.target.value})} placeholder="E.G. STOP BEING USELESS" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase">DEADLINE_TIME</label>
              <BrutalInput className="text-xl border-4" type="datetime-local" value={taskForm.deadline} onChange={e => setTaskForm({...taskForm, deadline: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase">SEVERITY_LEVEL</label>
              <Select value={taskForm.priority} onValueChange={(v: TaskPriority) => setTaskForm({...taskForm, priority: v})}>
                <SelectTrigger className="border-4 border-black font-black uppercase h-16 text-xl"><SelectValue /></SelectTrigger>
                <SelectContent className="border-4 border-black bg-white">
                  <SelectItem className="font-black uppercase" value="LOW">LOW_PRIORITY</SelectItem>
                  <SelectItem className="font-black uppercase" value="MEDIUM">MEDIUM_PRIORITY</SelectItem>
                  <SelectItem className="font-black uppercase" value="HIGH">HIGH_PRIORITY</SelectItem>
                  <SelectItem className="font-black uppercase" value="CRITICAL">CRITICAL_FAILURE_RISK</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <BrutalButton className="w-full text-4xl py-12 bg-black text-white hover:bg-red-600 transition-colors" onClick={() => addTask.mutate(taskForm)}>
              COMMIT TO FATE
            </BrutalButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isNicknameModal} onOpenChange={setIsNicknameModal}>
        <DialogContent className="bg-red-600 text-white border-[20px] border-white p-12 sm:max-w-[700px] shadow-[32px_32px_0px_0px_rgba(255,255,255,1)]">
          <DialogHeader>
            <DialogTitle className="text-7xl font-black uppercase tracking-tighter leading-none mb-4">LOG IDENTITY</DialogTitle>
            <DialogDescription className="text-2xl font-black uppercase text-white leading-tight">
              The system requires a name to mock you with surgical precision.
            </DialogDescription>
          </DialogHeader>
          <div className="py-10">
            <BrutalInput value={nicknameInput} onChange={e => setNicknameInput(e.target.value)} placeholder="COWARD_ID_001" className="text-5xl py-12 bg-white text-black border-8 border-black placeholder:text-zinc-300" />
          </div>
          <DialogFooter>
            <BrutalButton className="w-full text-4xl py-14 bg-black text-white hover:bg-white hover:text-black border-8 border-white uppercase" onClick={() => nicknameInput.trim() && onboardUser.mutate(nicknameInput.trim())}>
              CONFIRM_DISGRACE
            </BrutalButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Toaster position="top-center" theme="dark" richColors expand={true} closeButton />
    </div>
  );
}