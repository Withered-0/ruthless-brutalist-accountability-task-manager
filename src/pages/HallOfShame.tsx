import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Skull, ChevronLeft, Frown, UserX, FileWarning } from 'lucide-react';
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
        <header className="border-8 border-red-600 p-8 bg-black text-white shadow-[8px_8px_0px_0px_rgba(255,0,0,1)] flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left">
            <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter leading-none text-red-600">Criminal Record</h1>
            <p className="text-xl font-bold italic text-white/80">A PERMANENT TESTAMENT TO YOUR INCOMPETENCE</p>
          </div>
          <BrutalButton onClick={() => navigate('/')} className="flex items-center gap-2 bg-white text-black border-black">
            <ChevronLeft className="h-6 w-6" /> RETURN TO YOUR DUTIES
          </BrutalButton>
        </header>
        <div className="grid grid-cols-1 gap-8">
          {failures.length > 0 ? (
            failures.map((task, idx) => (
              <div key={task.id} className="relative group">
                <BrutalCard className="border-4 border-red-600 bg-zinc-950 text-white p-0 overflow-hidden flex flex-col md:flex-row shadow-[12px_12px_0px_0px_rgba(153,27,27,1)]">
                  {/* Mugshot Area */}
                  <div className="w-full md:w-48 bg-zinc-900 border-b-4 md:border-b-0 md:border-r-4 border-red-600 flex flex-col items-center justify-center p-6 gap-2">
                    <div className="p-4 border-4 border-zinc-700 bg-zinc-800">
                      {task.status === 'ABANDONED' ? (
                        <UserX className="h-16 w-16 text-zinc-500" />
                      ) : (
                        <Skull className="h-16 w-16 text-red-600" />
                      )}
                    </div>
                    <span className="text-[10px] font-mono text-zinc-500 uppercase">SUBJECT_{task.id.slice(0, 8)}</span>
                  </div>
                  {/* Record Content */}
                  <div className="flex-1 p-8 relative">
                    <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <FileWarning className="h-5 w-5 text-red-600" />
                          <span className="text-xs font-black uppercase text-red-600 tracking-widest">Case File #{idx + 1042}</span>
                        </div>
                        <h3 className="text-4xl font-black uppercase text-white mb-2 tracking-tight">{task.title}</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-xs font-mono text-zinc-400 uppercase">
                          <p><span className="text-zinc-600">OFFENSE DATE:</span> {new Date(task.createdAt).toLocaleString()}</p>
                          <p><span className="text-zinc-600">DUE DATE:</span> {new Date(task.deadline).toLocaleString()}</p>
                          <p className="sm:col-span-2"><span className="text-zinc-600">IDENTIFIER:</span> {task.id}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <BrutalBadge variant="crit" className="text-lg py-1 px-4">{task.status}</BrutalBadge>
                      </div>
                    </div>
                    {/* Decorative "GUILTY" Stamp */}
                    <div 
                      className="absolute top-1/2 right-12 -translate-y-1/2 -rotate-12 pointer-events-none opacity-10 md:opacity-30 transition-transform group-hover:scale-110"
                      style={{ right: `${idx % 2 === 0 ? '10%' : '15%'}` }}
                    >
                      <span className="text-6xl md:text-9xl font-black border-[12px] border-red-600 p-6 text-red-600 uppercase tracking-tighter">
                        {task.status === 'ABANDONED' ? 'COWARD' : 'FAILURE'}
                      </span>
                    </div>
                  </div>
                </BrutalCard>
              </div>
            ))
          ) : (
            <div className="text-center py-32 border-8 border-dashed border-zinc-800">
              <Frown className="mx-auto h-32 w-32 mb-8 text-zinc-800" />
              <h2 className="text-5xl font-black uppercase text-zinc-800">NO FAILURES YET? YOUR LIES ARE RECORDED TOO.</h2>
            </div>
          )}
        </div>
        {failures.length > 0 && (
          <footer className="text-center pt-20">
            <div className="inline-block border-8 border-red-600 p-8 bg-red-600/10 shadow-[10px_10px_0px_0px_rgba(220,38,38,0.2)]">
              <p className="text-4xl font-black uppercase text-red-600 flex items-center justify-center gap-6">
                <Skull className="h-12 w-12" /> TOTAL DISGRACE COUNT: {failures.length} <Skull className="h-12 w-12" />
              </p>
              <p className="mt-4 font-mono text-zinc-500 text-sm uppercase">This record is permanent. No expungement possible.</p>
            </div>
          </footer>
        )}
      </div>
    </div>
  );
}