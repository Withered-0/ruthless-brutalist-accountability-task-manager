import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Skull, ChevronLeft, UserX, FileWarning, Gavel } from 'lucide-react';
import { api } from '@/lib/api-client';
import type { TaskBoardState } from '@shared/types';
import { BrutalCard, BrutalButton, BrutalBadge } from '@/components/brutalist-ui';
export function HallOfShame() {
  const navigate = useNavigate();
  const { data: board } = useQuery<TaskBoardState>({
    queryKey: ['board'],
    queryFn: () => api<TaskBoardState>('/api/board'),
    retry: false,
  });
  const failures = board?.tasks.filter(t => t.status === 'ABANDONED' || t.status === 'OVERDUE') || [];
  const stolen = board?.stolenValor || [];
  return (
    <div className="min-h-screen bg-black text-white font-mono">
      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12 space-y-12">
        <header className="border-8 border-red-600 p-8 bg-black text-white shadow-[8px_8px_0px_0px_rgba(255,0,0,1)] flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-red-600">
              {board?.nickname || 'UNKNOWN'}'S RECORD
            </h1>
            <p className="text-xl font-bold italic">PERMANENT DISGRACE LOG</p>
          </div>
          <BrutalButton onClick={() => navigate('/')} className="bg-white text-black border-black">
            <ChevronLeft className="h-6 w-6 mr-2 inline" /> BACK TO WORK
          </BrutalButton>
        </header>
        {stolen.length > 0 && (
          <section className="space-y-6">
            <h2 className="text-4xl font-black uppercase tracking-tighter text-orange-600 flex items-center gap-4">
              <Gavel className="h-10 w-10" /> STOLEN VALOR
            </h2>
            <p className="text-zinc-500 font-bold uppercase text-xs">THESE COMPLETED TASKS WERE STRIPPED FROM YOU DUE TO YOUR OVERALL INCOMPETENCE.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {stolen.map(task => (
                <BrutalCard key={task.id} className="border-orange-600 bg-zinc-950 opacity-60">
                  <h3 className="text-xl font-black uppercase line-through">{task.title}</h3>
                  <p className="text-xs text-orange-600 mt-2 font-black uppercase">STATUS: SEIZED BY SYSTEM</p>
                </BrutalCard>
              ))}
            </div>
          </section>
        )}
        <section className="space-y-6">
          <h2 className="text-4xl font-black uppercase tracking-tighter text-red-600 flex items-center gap-4">
            <Skull className="h-10 w-10" /> CRIMINAL OFFENSES
          </h2>
          <div className="grid grid-cols-1 gap-8">
            {failures.length > 0 ? (
              failures.map((task) => (
                <BrutalCard key={task.id} className="border-4 border-red-600 bg-zinc-950 flex flex-col md:flex-row overflow-hidden p-0">
                  <div className="w-full md:w-48 bg-zinc-900 border-r-4 border-red-600 flex items-center justify-center p-6">
                    {task.status === 'ABANDONED' ? <UserX className="h-16 w-16 text-zinc-500" /> : <Skull className="h-16 w-16 text-red-600" />}
                  </div>
                  <div className="flex-1 p-8">
                    <div className="flex justify-between mb-4">
                      <span className="text-[10px] font-black text-red-600 uppercase tracking-widest">CASE_FILE_{task.id.slice(0, 8)}</span>
                      <BrutalBadge variant="crit">{task.status}</BrutalBadge>
                    </div>
                    <h3 className="text-4xl font-black uppercase">{task.title}</h3>
                    <p className="mt-4 text-xs font-mono text-zinc-500 uppercase">OFFENSE LOGGED: {new Date(task.createdAt).toLocaleString()}</p>
                  </div>
                </BrutalCard>
              ))
            ) : (
              <div className="text-center py-24 border-8 border-dashed border-zinc-900">
                <h2 className="text-4xl font-black text-zinc-800 uppercase">NO FAILURES? WE'RE WATCHING.</h2>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}