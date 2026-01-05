import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle, Plus, Check, Skull, Trash2, History, Volume2, VolumeX,
  Radio, TrendingDown, Clock, CheckCircle, Edit3, X, ArrowDown
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
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  // Form states
  const [title, setTitle] = useState('');
  const [deadline, setDeadline] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  const [description, setDescription] = useState('');
  const previousOverdueCount = useRef<number | null>(null);
  const { data: board, isLoading } = useQuery<TaskBoardState>({
    queryKey: ['board'],
    queryFn: () => api<TaskBoardState>('/api/board'),
    refetchInterval: 10000,
  });
  useEffect(() => {
    if (board) {
      const currentOverdue = board.tasks.filter(t => t.status === 'OVERDUE').length;
      if (previousOverdueCount.current !== null && currentOverdue > previousOverdueCount.current) {
        snark.playSound('death_knell');
        toast.error("THE BELL TOLLS. ANOTHER DEADLINE MISSED.");
        snark.speak('idle_shame');
      }
      previousOverdueCount.current = currentOverdue;
    }
  }, [board]);
  const saveTask = useMutation({
    mutationFn: (task: Partial<Task>) => {
      if (editingTask) {
        return api<TaskBoardState>(`/api/board/task/${editingTask.id}`, {
          method: 'PUT',
          body: JSON.stringify(task),
        });
      }
      return api<TaskBoardState>('/api/board/task', {
        method: 'POST',
        body: JSON.stringify(task),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board'] });
      resetForm();
      setIsModalOpen(false);
      snark.speak(editingTask ? 'welcome' : 'task_added');
      toast.success(editingTask ? "BURDEN ADJUSTED." : "BURDEN ADDED. DON'T FAIL THIS ONE.");
    }
  });
  const deleteTask = useMutation({
    mutationFn: (id: string) => api<TaskBoardState>(`/api/board/task/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board'] });
      toast.info("BURDEN EXPUNGED. BUT THE SHAME REMAINS.");
    }
  });
  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string, status: Task['status'] }) =>
      api<TaskBoardState>(`/api/board/task/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['board'] });
      if (variables.status === 'COMPLETED') {
        snark.speak('task_completed');
        toast.success("TASK DONE. DON'T EXPECT A REWARD.");
      }
      if (variables.status === 'ABANDONED') {
        snark.playSound('chicken');
        snark.speak('task_abandoned');
        toast.error("QUITTER. RECORDED IN THE HALL OF SHAME.");
      }
    },
  });
  const resetForm = () => {
    setTitle('');
    setDeadline('');
    setPriority('MEDIUM');
    setDescription('');
    setEditingTask(null);
  };
  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setTitle(task.title);
    setDeadline(new Date(task.deadline).toISOString().slice(0, 16));
    setPriority(task.priority);
    setDescription(task.description);
    setIsModalOpen(true);
  };
  const handleUnlock = () => {
    snark.unlock();
    setIsUnlocked(true);
    snark.speak('welcome');
  };
  const toggleMute = () => {
    setIsMuted(snark.toggleMute());
  };
  if (isLoading) return <div className="p-20 text-4xl font-black animate-pulse flex items-center justify-center min-h-screen bg-black text-white">LOADING YOUR FAILURES...</div>;
  const tasks = board?.tasks || [];
  const failureRate = calculateFailureRate(tasks);
  const exaggeratedRate = getExaggeratedFailureRate(tasks);
  const lifeWasted = getLifeWastedEstimate(tasks);
  const statusMsg = getSarcasticStatusMessage(tasks);
  const overdueCount = tasks.filter(t => t.status === 'OVERDUE').length;
  const doneCount = tasks.filter(t => t.status === 'COMPLETED').length;
  const isGlitching = failureRate > 50;
  const glitchIntensity = Math.max(0.1, 0.5 - (failureRate / 200));
  return (
    <div className={cn("min-h-screen bg-black text-white font-mono selection:bg-red-600 selection:text-white pb-24", isGlitching && "animate-glitch")} style={isGlitching ? { animationDuration: `${glitchIntensity}s` } : {}}>
      {!isUnlocked && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-6 text-white">
          <h2 className="text-4xl md:text-6xl font-black mb-8 text-center uppercase tracking-tighter text-red-600">Accountability is Mandatory</h2>
          <BrutalButton className="text-4xl p-12 bg-red-600 text-white border-white animate-bounce shadow-[10px_10px_0px_0px_rgba(255,255,255,1)]" onClick={handleUnlock}>
            <Volume2 className="inline mr-4 h-12 w-12" /> INITIALIZE SHAME
          </BrutalButton>
        </div>
      )}
      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12 space-y-12">
        <header className="flex flex-col md:flex-row justify-between items-center gap-6 border-b-8 border-white pb-8">
          <div className="text-center md:text-left">
            <h1 className="text-5xl md:text-7xl font-black uppercase text-red-600 tracking-tighter leading-none mb-2">
              THE PROCRASTINATOR'S NIGHTMARE
            </h1>
            <p className="text-xl font-bold italic text-zinc-400">A task manager designed to bully you into productivity.</p>
          </div>
          <Dialog open={isModalOpen} onOpenChange={(open) => { if(!open) resetForm(); setIsModalOpen(open); }}>
            <DialogTrigger asChild>
              <BrutalButton variant="blue" className="text-2xl py-6 px-10">
                <Plus className="mr-2 h-8 w-8" /> ADD NEW BURDEN
              </BrutalButton>
            </DialogTrigger>
            <DialogContent className="bg-white text-black border-8 border-black shadow-[15px_15px_0px_0px_rgba(0,0,0,1)] max-w-2xl p-8">
              <DialogHeader>
                <DialogTitle className="text-4xl font-black uppercase tracking-tighter border-b-4 border-black pb-4 mb-6">
                  {editingTask ? 'AMEND THE BURDEN' : 'LOG NEW BURDEN'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                <div>
                  <label className="text-xs font-black uppercase mb-1 block">Short Title (The Lie)</label>
                  <BrutalInput value={title} onChange={e => setTitle(e.target.value)} placeholder="E.g. FINISH THE ENGINE" />
                </div>
                <div>
                  <label className="text-xs font-black uppercase mb-1 block">Description (Optional excuses)</label>
                  <textarea className="w-full border-3 border-black p-3 font-mono text-black focus:outline-none focus:ring-0 bg-white min-h-[100px]" value={description} onChange={e => setDescription(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-black uppercase mb-1 block">Priority Level</label>
                    <select className="w-full border-3 border-black p-3 font-mono text-black bg-white" value={priority} onChange={e => setPriority(e.target.value as TaskPriority)}>
                      <option value="LOW">LOW (IRRELEVANT)</option>
                      <option value="MEDIUM">MEDIUM (IGNORED)</option>
                      <option value="HIGH">HIGH (STRESSFUL)</option>
                      <option value="CRITICAL">CRITICAL (PANIC)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-black uppercase mb-1 block">Deadline (UTC)</label>
                    <BrutalInput type="datetime-local" value={deadline} onChange={e => setDeadline(e.target.value)} />
                  </div>
                </div>
              </div>
              <DialogFooter className="mt-8 flex-col sm:flex-row gap-4">
                <BrutalButton className="w-full bg-black text-white text-xl py-4" onClick={() => saveTask.mutate({ title, deadline, priority, description })}>
                  {editingTask ? 'CONFIRM AMENDMENT' : 'COMMIT TO THIS'}
                </BrutalButton>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </header>
        {/* Shame Dashboard */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <BrutalCard className="bg-zinc-900 border-white col-span-1 lg:col-span-1 flex flex-col justify-between">
            <span className="text-[10px] font-black uppercase text-zinc-500">Current Status</span>
            <p className="text-lg font-black leading-tight mt-2">{statusMsg}</p>
          </BrutalCard>
          <BrutalCard className="bg-zinc-900 border-white flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-black uppercase text-zinc-500">Failure Rate</span>
              <ArrowDown className="h-4 w-4 text-red-600 animate-bounce" />
            </div>
            <p className="text-4xl font-black text-red-600">{exaggeratedRate}</p>
          </BrutalCard>
          <BrutalCard className="bg-red-600 border-black text-white flex flex-col justify-between shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]">
            <span className="text-[10px] font-black uppercase text-white/60">Overdue Count</span>
            <p className="text-5xl font-black">{overdueCount}</p>
          </BrutalCard>
          <BrutalCard className="bg-zinc-900 border-white flex flex-col justify-between">
            <span className="text-[10px] font-black uppercase text-zinc-500">Of Your Life Wasted</span>
            <p className="text-4xl font-black text-white">{Math.round(lifeWasted)}%</p>
          </BrutalCard>
          <BrutalCard className="bg-green-600 border-black text-white flex flex-col justify-between shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]">
            <span className="text-[10px] font-black uppercase text-white/60">Done Count</span>
            <p className="text-5xl font-black">{doneCount}</p>
          </BrutalCard>
        </div>
        {/* Pending Dooms Section */}
        <section className="space-y-6">
          <div className="flex justify-between items-end border-b-4 border-white pb-2">
            <h2 className="text-4xl font-black uppercase tracking-tighter">Pending Dooms ({tasks.filter(t => t.status !== 'COMPLETED' && t.status !== 'ABANDONED').length})</h2>
            <BrutalButton onClick={() => navigate('/shame')} className="text-xs bg-red-600 border-white py-1">VIEW DISGRACE LOG</BrutalButton>
          </div>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="bg-zinc-900 p-1 border-2 border-white mb-6">
              <TabsTrigger value="all" className="data-[state=active]:bg-white data-[state=active]:text-black rounded-none uppercase font-black px-8">All</TabsTrigger>
              <TabsTrigger value="pending" className="data-[state=active]:bg-white data-[state=active]:text-black rounded-none uppercase font-black px-8">Pending</TabsTrigger>
              <TabsTrigger value="overdue" className="data-[state=active]:bg-red-600 data-[state=active]:text-white rounded-none uppercase font-black px-8">Overdue</TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="space-y-4">
              <TaskList tasks={tasks} onStatus={updateStatus.mutate} onEdit={handleEdit} onDelete={deleteTask.mutate} />
            </TabsContent>
            <TabsContent value="pending" className="space-y-4">
              <TaskList tasks={tasks.filter(t => t.status === 'PENDING')} onStatus={updateStatus.mutate} onEdit={handleEdit} onDelete={deleteTask.mutate} />
            </TabsContent>
            <TabsContent value="overdue" className="space-y-4">
              <TaskList tasks={tasks.filter(t => t.status === 'OVERDUE')} onStatus={updateStatus.mutate} onEdit={handleEdit} onDelete={deleteTask.mutate} />
            </TabsContent>
          </Tabs>
        </section>
        <footer className="fixed bottom-0 left-0 right-0 bg-black border-t-4 border-white p-4 z-40 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Radio className={cn("h-4 w-4", isMuted ? "text-red-600" : "text-green-500 animate-pulse")} />
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
              Bully Protocol: {isMuted ? 'SILENCED' : 'VOCAL'}
            </span>
          </div>
          <BrutalButton onClick={toggleMute} className="py-1 px-4 text-xs bg-white text-black border-black shadow-none">
            {isMuted ? <VolumeX className="h-4 w-4 mr-2 inline" /> : <Volume2 className="h-4 w-4 mr-2 inline" />}
            {isMuted ? 'UNMUTE SHAME' : 'MUTE SHAME'}
          </BrutalButton>
        </footer>
      </div>
      <Toaster position="top-center" theme="dark" richColors />
    </div>
  );
}
function TaskList({ tasks, onStatus, onEdit, onDelete }: {
  tasks: Task[],
  onStatus: (args: {id: string, status: Task['status']}) => void,
  onEdit: (task: Task) => void,
  onDelete: (id: string) => void
}) {
  if (tasks.length === 0) return (
    <div className="text-center py-20 border-4 border-dashed border-zinc-800">
      <p className="text-2xl font-black uppercase text-zinc-700">Empty. Like your promises.</p>
    </div>
  );
  return (
    <div className="grid grid-cols-1 gap-4">
      {tasks.map(task => {
        const isOverdue = task.status === 'OVERDUE';
        const isCompleted = task.status === 'COMPLETED';
        const isAbandoned = task.status === 'ABANDONED';
        let priorityColor = "bg-zinc-800";
        if (task.priority === 'HIGH' || task.priority === 'CRITICAL') priorityColor = "bg-orange-600";
        if (isOverdue) priorityColor = "bg-red-600";
        return (
          <BrutalCard key={task.id} className={cn(
            "group bg-zinc-950 border-white p-0 overflow-hidden flex flex-col sm:flex-row transition-all",
            isOverdue && "border-red-600 shadow-[8px_8px_0px_0px_rgba(220,38,38,1)]",
            isCompleted && "opacity-40 grayscale"
          )}>
            <div className={cn("w-full sm:w-12 flex items-center justify-center p-4 sm:p-0", priorityColor)}>
              <span className="sm:-rotate-90 whitespace-nowrap font-black text-xs text-white uppercase tracking-widest">
                {task.priority} {isOverdue && 'OVERDUE'}
              </span>
            </div>
            <div className="flex-1 p-6 space-y-2">
              <div className="flex justify-between items-start">
                <h3 className={cn("text-2xl font-black uppercase tracking-tight", isCompleted && "line-through")}>
                  {task.title}
                </h3>
                <div className="flex gap-2">
                  {!isCompleted && !isAbandoned && (
                    <>
                      <button onClick={() => onEdit(task)} className="p-2 hover:bg-white hover:text-black transition-colors" title="Edit Burden"><Edit3 className="h-5 w-5" /></button>
                      <button onClick={() => onDelete(task.id)} className="p-2 hover:bg-red-600 hover:text-white transition-colors" title="Delete Burden"><Trash2 className="h-5 w-5" /></button>
                    </>
                  )}
                </div>
              </div>
              <p className="text-sm text-zinc-400 font-mono">{task.description || "No details provided. Classic."}</p>
              <div className="flex flex-wrap items-center gap-4 pt-4">
                <div className="flex items-center gap-2 text-xs font-black uppercase text-zinc-500">
                  <Clock className="h-3 w-3" />
                  BY: {new Date(task.deadline).toLocaleString()}
                </div>
                <BrutalBadge variant={isOverdue ? 'crit' : isCompleted ? 'success' : 'neutral'}>
                  {task.status}
                </BrutalBadge>
              </div>
            </div>
            <div className="p-6 border-t-2 sm:border-t-0 sm:border-l-2 border-white flex sm:flex-col gap-2 justify-center">
              {!isCompleted && !isAbandoned && (
                <>
                  <BrutalButton variant="success" className="w-full" onClick={() => onStatus({ id: task.id, status: 'COMPLETED' })}>
                    <Check className="h-6 w-6" />
                  </BrutalButton>
                  <BrutalButton variant="danger" className="w-full" onClick={() => onStatus({ id: task.id, status: 'ABANDONED' })}>
                    <X className="h-6 w-6" />
                  </BrutalButton>
                </>
              )}
            </div>
          </BrutalCard>
        );
      })}
    </div>
  );
}