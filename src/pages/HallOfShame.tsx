import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Skull, ChevronLeft, Frown } from 'lucide-react';
import { api } from '@/lib/api-client';
import type { TaskBoardState } from '@shared/types';
import { BrutalCard, BrutalButton, BrutalBadge } from '@/components/brutalist-ui';
export function HallOfShame() {
  const navigate = useNavigate();
  const { data: board } = useQuery<TaskBoardState>({
    queryKey: ['board'],
    queryFn: () => api<TaskBoardState>('/api/board'),
  });
  const failures = board?.tasks.filter(t => t.status === 'ABANDONED' || t.status === 'OVERDUE') || [];
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-8 md:py-10 lg:py-12 space-y-12">
        <header className="border-8 border-brutal-red p-8 bg-brutal-black text-white shadow-brutal-red flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left">
            <h1 className="text-7xl font-black uppercase tracking-tighter leading-none text-red-600">Hall of Shame</h1>
            <p className="text-xl font-bold italic text-white/80">YOUR PERMANENT CRIMINAL RECORD</p>
          </div>
          <BrutalButton onClick={() => navigate('/')} className="flex items-center gap-2">
            <ChevronLeft /> RETURN TO YOUR DUTIES
          </BrutalButton>
        </header>
        <div className="grid grid-cols-1 gap-6">
          {failures.length > 0 ? (
            failures.map((task) => (
              <div key={task.id} className="relative group">
                <BrutalCard className="border-red-600 bg-zinc-950 text-white p-6 overflow-hidden">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <h3 className="text-3xl font-black uppercase text-red-500 mb-2">{task.title}</h3>
                      <div className="flex flex-wrap gap-4 text-sm font-mono text-zinc-400">
                        <span>CREATED: {new Date(task.createdAt).toLocaleDateString()}</span>
                        <span>DEADLINE: {new Date(task.deadline).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <BrutalBadge variant="crit">{task.status}</BrutalBadge>
                    </div>
                  </div>
                  {/* Decorative "GUILTY" Stamp */}
                  <div className="absolute top-1/2 right-20 -translate-y-1/2 -rotate-12 pointer-events-none opacity-20 md:opacity-40">
                    <span className="text-6xl md:text-8xl font-black border-8 border-red-600 p-4 text-red-600 uppercase">
                      {task.status === 'ABANDONED' ? 'COWARD' : 'FAILURE'}
                    </span>
                  </div>
                </BrutalCard>
              </div>
            ))
          ) : (
            <div className="text-center py-20 border-4 border-dashed border-white/20">
              <Frown className="mx-auto h-24 w-24 mb-6 opacity-20" />
              <h2 className="text-4xl font-black uppercase opacity-20">NO FAILURES YET? I DON'T BELIEVE YOU.</h2>
            </div>
          )}
        </div>
        {failures.length > 0 && (
          <footer className="text-center pt-12">
            <div className="inline-block border-4 border-red-600 p-4 bg-red-600/10">
              <p className="font-black uppercase text-red-600 flex items-center gap-2">
                <Skull className="h-6 w-6" /> TOTAL DISGRACE COUNT: {failures.length} <Skull className="h-6 w-6" />
              </p>
            </div>
          </footer>
        )}
      </div>
    </div>
  );
}