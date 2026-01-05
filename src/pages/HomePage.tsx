import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Plus, Check, Skull, Trash2, History, Volume2, VolumeX, Radio } from 'lucide-react';
import { api } from '@/lib/api-client';
import type { Task, TaskBoardState } from '@shared/types';
import { cn, calculateFailureRate } from '@/lib/utils';
import { BrutalCard, BrutalButton, BrutalInput, BrutalBadge } from '@/components/brutalist-ui';
import { Toaster, toast } from 'sonner';
import { snark } from '@/lib/snark-engine';
export function HomePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [newTitle, setNewTitle] = useState('');
  const [newDeadline, setNewDeadline] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isMuted, setIsMuted] = useState(snark.getMuteStatus());
  const previousOverdueCount = useRef<number | null>(null);
  const { data: board, isLoading } = useQuery<TaskBoardState>({
    queryKey: ['board'],
    queryFn: () => api<TaskBoardState>('/api/board'),
    refetchInterval: 15000,
  });
  useEffect(() => {
    if (board) {
      const currentOverdue = board.tasks.filter(t => t.status === 'OVERDUE').length;
      if (previousOverdueCount.current !== null && currentOverdue > previousOverdueCount.current) {
        snark.playSound('death_knell');
        toast.error("THE BELL TOLLS. ANOTHER DEADLINE MISSED.");
      }
      previousOverdueCount.current = currentOverdue;
    }
  }, [board]);
  const addTask = useMutation({
    mutationFn: (task: Partial<Task>) => api<TaskBoardState>('/api/board/task', {
      method: 'POST',
      body: JSON.stringify(task),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board'] });
      setNewTitle('');
      setNewDeadline('');
      snark.speak('task_added');
      toast.success("BURDEN ADDED. DON'T FAIL THIS ONE.");
    },
    onError: () => toast.error("YOU FAILED TO EVEN ADD A TASK. PATHETIC.")
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
      } else if (variables.status === 'ABANDONED') {
        snark.playSound('chicken');
        snark.speak('task_abandoned');
      }
    },
  });
  const handleUnlock = () => {
    snark.unlock();
    setIsUnlocked(true);
    snark.speak('welcome');
  };
  const toggleMute = () => {
    const newMute = snark.toggleMute();
    setIsMuted(newMute);
  };
  const failureRate = board ? calculateFailureRate(board.tasks) : 0;
  const isGlitching = failureRate > 50;
  const glitchIntensity = Math.max(0.1, 0.5 - (failureRate / 200)); // Lower = faster
  if (isLoading) return <div className="p-20 text-4xl font-black animate-pulse flex items-center justify-center min-h-screen">LOADING YOUR FAILURES...</div>;
  return (
    <div 
      className={cn("min-h-screen p-4 md:p-8 space-y-12 max-w-7xl mx-auto mb-20", isGlitching && "animate-glitch")}
      style={isGlitching ? { animationDuration: `${glitchIntensity}s` } : {}}
    >
      {!isUnlocked && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-6 text-white">
          <h2 className="text-4xl md:text-6xl font-black mb-8 text-center uppercase tracking-tighter">Accountability is Mandatory</h2>
          <BrutalButton
            className="text-4xl p-12 bg-red-600 text-white border-white animate-bounce shadow-[10px_10px_0px_0px_rgba(255,255,255,1)]"
            onClick={handleUnlock}
          >
            <Volume2 className="inline mr-4 h-12 w-12" />
            INITIALIZE SHAME
          </BrutalButton>
        </div>
      )}
      <header className="border-8 border-black p-6 bg-white text-black shadow-brutal-lg flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter leading-none">Ruthless</h1>
          <p className="text-xl font-bold italic">PROCRASTINATION PUNISHER v3.0</p>
        </div>
        <div className="text-right flex flex-col items-center md:items-end">
          <span className="text-sm font-black uppercase">Current Failure Score</span>
          <span className={cn(
            "text-7xl md:text-9xl font-black leading-none",
            failureRate > 70 ? "text-red-600" : "text-black"
          )}>
            {Math.round(failureRate)}%
          </span>
        </div>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-12">
        <div className="md:col-span-3 flex justify-end">
          <BrutalButton onClick={() => navigate('/shame')} className="flex items-center gap-2 bg-red-600 text-white border-black">
            <History className="h-5 w-5" /> VIEW HALL OF DISGRACE
          </BrutalButton>
        </div>
        <section className="md:col-span-1 space-y-4">
          <h2 className="text-2xl font-black uppercase border-b-4 border-black pb-2">Log New Burden</h2>
          <BrutalCard className="space-y-4">
            <div>
              <label className="text-xs font-black uppercase mb-1 block">Task Description</label>
              <BrutalInput
                placeholder="E.g. FINISH THE ENGINE"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-black uppercase mb-1 block">Deadline (UTC)</label>
              <BrutalInput
                type="datetime-local"
                value={newDeadline}
                onChange={(e) => setNewDeadline(e.target.value)}
              />
            </div>
            <BrutalButton
              className="w-full bg-black text-white"
              onClick={() => addTask.mutate({ title: newTitle, deadline: newDeadline, priority: 'HIGH' })}
            >
              <Plus className="inline mr-2 h-5 w-5" /> COMMIT TO THIS
            </BrutalButton>
          </BrutalCard>
        </section>
        <section className="md:col-span-2 space-y-4">
          <h2 className="text-2xl font-black uppercase border-b-4 border-black pb-2">Active Burdens</h2>
          <div className="space-y-4">
            {board?.tasks.filter(t => t.status !== 'ABANDONED').map((task) => (
              <BrutalCard key={task.id} className={cn(
                "flex justify-between items-center group relative overflow-hidden",
                task.status === 'OVERDUE' && "border-red-600 border-4 bg-red-50"
              )}>
                <div className="space-y-1 relative z-10">
                  <div className="flex items-center gap-2">
                    {task.status === 'OVERDUE' && <AlertCircle className="text-red-600 h-6 w-6 animate-pulse" />}
                    <h3 className={cn("text-2xl font-black uppercase", task.status === 'COMPLETED' && "line-through opacity-50")}>
                      {task.title}
                    </h3>
                  </div>
                  <p className="text-sm font-mono font-bold">
                    DEADLINE: {new Date(task.deadline).toLocaleString()}
                  </p>
                  <BrutalBadge variant={task.status === 'OVERDUE' ? 'crit' : 'neutral'}>
                    {task.status}
                  </BrutalBadge>
                </div>
                <div className="flex gap-3 relative z-10">
                  {task.status !== 'COMPLETED' && (
                    <>
                      <BrutalButton
                        variant="success"
                        className="p-3"
                        onClick={() => updateStatus.mutate({ id: task.id, status: 'COMPLETED' })}
                      >
                        <Check className="h-8 w-8" />
                      </BrutalButton>
                      <BrutalButton
                        variant="danger"
                        className="p-3"
                        onClick={() => {
                          updateStatus.mutate({ id: task.id, status: 'ABANDONED' });
                          toast.error("COWARD. YOU GAVE UP.");
                        }}
                      >
                        <Trash2 className="h-8 w-8" />
                      </BrutalButton>
                    </>
                  )}
                </div>
                {task.status === 'OVERDUE' && (
                  <div className="absolute top-0 right-0 p-2 opacity-5 pointer-events-none">
                    <Skull className="h-24 w-24 text-red-600" />
                  </div>
                )}
              </BrutalCard>
            ))}
            {board?.tasks.filter(t => t.status !== 'ABANDONED').length === 0 && (
              <div className="text-center py-16 border-4 border-dashed border-white/20">
                <Radio className="mx-auto h-16 w-16 mb-4 opacity-20" />
                <p className="font-black uppercase text-xl opacity-20">NO ACTIVE BURDENS. YOUR LIFE HAS NO PURPOSE.</p>
              </div>
            )}
          </div>
        </section>
      </div>
      <footer className="fixed bottom-0 left-0 right-0 bg-black text-white p-4 border-t-4 border-white z-50 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={cn("h-3 w-3 rounded-full animate-pulse", isMuted ? "bg-red-600" : "bg-green-500")} />
            <span className="text-xs font-black uppercase tracking-widest">
              Snark Engine: {isMuted ? 'SILENCED' : 'ACTIVE'}
            </span>
          </div>
          <span className="hidden md:inline text-[10px] font-mono opacity-50 uppercase">
            System Monitoring failure_rate_{Math.round(failureRate)}
          </span>
        </div>
        <BrutalButton 
          onClick={toggleMute} 
          className="py-1 px-4 text-xs bg-white text-black border-black shadow-none active:translate-y-0"
        >
          {isMuted ? <VolumeX className="h-4 w-4 mr-2 inline" /> : <Volume2 className="h-4 w-4 mr-2 inline" />}
          {isMuted ? 'UNMUTE' : 'MUTE'} SHAME
        </BrutalButton>
      </footer>
      <Toaster position="top-center" theme="dark" richColors />
    </div>
  );
}