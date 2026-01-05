import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Plus, Check, Skull, Trash2 } from 'lucide-react';
import { api } from '@/lib/api-client';
import type { Task, TaskBoardState } from '@shared/types';
import { cn, calculateFailureRate } from '@/lib/utils';
import { BrutalCard, BrutalButton, BrutalInput, BrutalBadge } from '@/components/brutalist-ui';
import { Toaster, toast } from 'sonner';
export function HomePage() {
  const queryClient = useQueryClient();
  const [newTitle, setNewTitle] = useState('');
  const [newDeadline, setNewDeadline] = useState('');
  const { data: board, isLoading } = useQuery<TaskBoardState>({
    queryKey: ['board'],
    queryFn: () => api<TaskBoardState>('/api/board'),
    refetchInterval: 30000,
  });
  const addTask = useMutation({
    mutationFn: (task: Partial<Task>) => api<TaskBoardState>('/api/board/task', {
      method: 'POST',
      body: JSON.stringify(task),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board'] });
      setNewTitle('');
      setNewDeadline('');
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['board'] }),
  });
  const failureRate = board ? calculateFailureRate(board.tasks) : 0;
  const isGlitching = failureRate > 50;
  if (isLoading) return <div className="p-20 text-4xl animate-pulse">LOADING YOUR FAILURES...</div>;
  return (
    <div className={cn("min-h-screen p-4 md:p-8 space-y-12 max-w-5xl mx-auto", isGlitching && "animate-glitch")}>
      <header className="border-8 border-black p-6 bg-white text-black shadow-brutal-lg flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h1 className="text-6xl font-black uppercase tracking-tighter leading-none">Ruthless</h1>
          <p className="text-xl font-bold italic">BRUTALIST ACCOUNTABILITY</p>
        </div>
        <div className="text-right flex flex-col items-center md:items-end">
          <span className="text-sm font-black uppercase">Failure Rate</span>
          <span className={cn(
            "text-7xl font-black leading-none",
            failureRate > 70 ? "text-red-600" : "text-black"
          )}>
            {Math.round(failureRate)}%
          </span>
        </div>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <section className="md:col-span-1 space-y-4">
          <h2 className="text-2xl font-black uppercase border-b-4 border-black pb-2">Add New Burden</h2>
          <BrutalCard className="space-y-4">
            <div>
              <label className="text-xs font-black uppercase">What must you do?</label>
              <BrutalInput 
                placeholder="E.g. FINISH THE ENGINE" 
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-black uppercase">When is the deadline?</label>
              <BrutalInput 
                type="datetime-local" 
                value={newDeadline}
                onChange={(e) => setNewDeadline(e.target.value)}
              />
            </div>
            <BrutalButton 
              className="w-full"
              onClick={() => addTask.mutate({ title: newTitle, deadline: newDeadline, priority: 'HIGH' })}
            >
              <Plus className="inline mr-2" /> Accept Burden
            </BrutalButton>
          </BrutalCard>
        </section>
        <section className="md:col-span-2 space-y-4">
          <h2 className="text-2xl font-black uppercase border-b-4 border-black pb-2">Active Burdens</h2>
          <div className="space-y-4">
            {board?.tasks.filter(t => t.status !== 'ABANDONED').map((task) => (
              <BrutalCard key={task.id} className={cn(
                "flex justify-between items-center group",
                task.status === 'OVERDUE' && "border-red-600 border-4"
              )}>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {task.status === 'OVERDUE' && <AlertCircle className="text-red-600 h-5 w-5" />}
                    <h3 className={cn("text-xl font-black uppercase", task.status === 'COMPLETED' && "line-through opacity-50")}>
                      {task.title}
                    </h3>
                  </div>
                  <p className="text-xs font-mono opacity-70">
                    DEADLINE: {new Date(task.deadline).toLocaleString()}
                  </p>
                  <BrutalBadge variant={task.status === 'OVERDUE' ? 'crit' : 'neutral'}>
                    {task.status}
                  </BrutalBadge>
                </div>
                <div className="flex gap-2">
                  {task.status !== 'COMPLETED' && (
                    <>
                      <BrutalButton 
                        variant="success" 
                        className="p-2"
                        onClick={() => updateStatus.mutate({ id: task.id, status: 'COMPLETED' })}
                      >
                        <Check className="h-6 w-6" />
                      </BrutalButton>
                      <BrutalButton 
                        variant="danger" 
                        className="p-2"
                        onClick={() => {
                          updateStatus.mutate({ id: task.id, status: 'ABANDONED' });
                          toast.error("CHICKEN. YOU GAVE UP.");
                        }}
                      >
                        <Trash2 className="h-6 w-6" />
                      </BrutalButton>
                    </>
                  )}
                </div>
              </BrutalCard>
            ))}
            {board?.tasks.length === 0 && (
              <div className="text-center py-12 border-4 border-dashed border-white opacity-20">
                <Skull className="mx-auto h-16 w-16 mb-4" />
                <p className="font-black uppercase">NO BURDENS. YOU ARE USELESS.</p>
              </div>
            )}
          </div>
        </section>
      </div>
      <Toaster position="bottom-right" theme="dark" richColors />
    </div>
  );
}