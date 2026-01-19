import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Skull, ChevronLeft, Gavel, Archive, ShieldX, Zap } from 'lucide-react';
import { api } from '@/lib/api-client';
import type { TaskBoardState, Task } from '@shared/types';
import { BrutalCard, BrutalButton, BrutalBadge } from '@/components/brutalist-ui';
import { cn } from '@/lib/utils';
export function HallOfShame() {
  const navigate = useNavigate();
  const { data: board, error } = useQuery<TaskBoardState>({
    queryKey: ['board'],
    queryFn: () => api<TaskBoardState>('/api/board'),
    retry: false,
  });
  useEffect(() => {
    if (error) navigate('/login');
  }, [error, navigate]);
  const shameHistory = board?.shameHistory || [];
  const stolen = board?.stolenValor || [];
  const totalScore = (shameHistory.length * 50) + (stolen.length * 100);
  const getShameReason = (task: Task) => {
    if (task.status === 'ABANDONED') return 'COWARDICE / DESERTION';
    if (task.status === 'OVERDUE') return 'CHRONIC NEGLECT / EXPIRATION';
    return 'UNKNOWN TRANSGRESSION';
  };
  return (
    <div className="min-h-screen bg-black text-white font-mono bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
      <div className="space-y-12">
        <header className="border-8 border-red-600 p-10 bg-black text-white shadow-[12px_12px_0px_0px_rgba(255,0,0,1)] flex flex-col md:flex-row justify-between items-center gap-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-red-600/5 animate-pulse pointer-events-none" />
          <div className="z-10">
            <h1 className="text-5xl md:text-8xl font-black uppercase tracking-tighter text-red-600 leading-none">
              OFFENDER: {board?.nickname || 'ANONYMOUS_FAILURE'}
            </h1>
            <div className="flex items-center gap-4 mt-4">
              <span className="bg-red-600 text-white px-4 py-2 text-2xl font-black uppercase">DISGRACE_SCORE: {totalScore}</span>
              <span className="text-zinc-500 font-bold uppercase italic tracking-widest">Permanent Registry</span>
            </div>
          </div>
          <BrutalButton onClick={() => navigate('/')} className="bg-white text-black border-black text-2xl py-6 px-10 z-10">
            <ChevronLeft className="h-8 w-8 mr-2 inline" /> BACK TO PURGATORY
          </BrutalButton>
        </header>
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-12">
            <section className="space-y-8">
              <h2 className="text-5xl font-black uppercase tracking-tighter text-red-600 flex items-center gap-4 border-b-8 border-red-600 pb-4">
                <ShieldX className="h-14 w-14" /> POLICE_REPORTS_LIFETIME
              </h2>
              <div className="space-y-6">
                {shameHistory.length > 0 ? (
                  shameHistory.map((task) => (
                    <div key={task.id} className="border-8 border-white p-8 bg-zinc-950 relative overflow-hidden transition-all hover:bg-red-950/10 group">
                      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-30 transition-opacity"><Skull className="h-32 w-32" /></div>
                      <div className="flex justify-between items-start mb-6">
                        <span className="text-sm font-black text-red-600 bg-white px-3 py-1 border-2 border-black">CASE_FILE_#{task.id.slice(0, 8).toUpperCase()}</span>
                        <BrutalBadge variant="crit" className="text-lg py-1 px-4">{task.status}</BrutalBadge>
                      </div>
                      <h3 className="text-4xl font-black uppercase leading-none mb-4">{task.title}</h3>
                      <p className="text-zinc-500 mt-2 text-lg font-bold border-l-4 border-zinc-800 pl-4">{task.description || "NO EXPLANATION GIVEN AT TIME OF FAILURE."}</p>
                      <div className="mt-8 pt-6 border-t-4 border-zinc-900 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-black uppercase text-zinc-400">
                        <div className="flex items-center gap-2"><Zap className="h-4 w-4 text-red-600" /> REASON: {getShameReason(task)}</div>
                        <div className="md:text-right">ADJUDICATED: {new Date(task.createdAt).toLocaleString()}</div>
                      </div>
                      <div className="mt-6 text-center border-4 border-red-600 text-red-600 font-black py-2 tracking-[0.5em] text-sm animate-pulse bg-red-600/5">
                        CANNOT BE EXPUNGED - GUILT PERMANENT
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-48 border-8 border-dashed border-zinc-900 bg-zinc-950/50">
                    <h2 className="text-6xl font-black text-zinc-900 uppercase tracking-tighter">CLEAR_RECORD... FOR_NOW.</h2>
                    <p className="mt-4 text-zinc-700 font-black uppercase">Failure is inevitable. We are waiting.</p>
                  </div>
                )}
              </div>
            </section>
          </div>
          <div className="space-y-12">
            <section className="space-y-6">
              <h2 className="text-4xl font-black uppercase tracking-tighter text-orange-600 flex items-center gap-4">
                <Gavel className="h-10 w-10" /> SEIZED_ASSETS
              </h2>
              <div className="bg-orange-600 text-black p-4 font-black uppercase text-xs leading-tight border-4 border-black">
                THE SYSTEM HAS CONFISCATED THESE SUCCESSES AS REPARATIONS FOR YOUR PERSISTENT INCOMPETENCE.
              </div>
              <div className="space-y-4">
                {stolen.map(task => (
                  <BrutalCard key={task.id} className="border-orange-600 bg-zinc-950 opacity-40 grayscale group hover:grayscale-0 transition-all">
                    <h3 className="text-xl font-black uppercase line-through text-zinc-500 group-hover:text-orange-600">{task.title}</h3>
                    <p className="text-[10px] text-orange-600 font-black uppercase mt-2">SEIZED_COLLATERAL_ID_{task.id.slice(0, 4)}</p>
                  </BrutalCard>
                ))}
                {stolen.length === 0 && (
                  <div className="p-8 border-4 border-zinc-900 text-center opacity-30">
                    <Archive className="h-12 w-12 mx-auto mb-2" />
                    <p className="text-xs font-black uppercase">No assets worth seizing.</p>
                  </div>
                )}
              </div>
            </section>
            <section className="border-8 border-white p-8 bg-zinc-900 shadow-[10px_10px_0px_0px_rgba(255,255,255,1)]">
              <h3 className="text-3xl font-black uppercase text-white mb-6 flex items-center gap-3"><Archive className="h-8 w-8" /> SYSTEM_OUTLOOK</h3>
              <div className="space-y-4">
                <div className="flex justify-between text-sm font-black uppercase"><span>TOTAL_DECAY:</span> <span className="text-red-600">{board?.glitchLevel}%</span></div>
                <div className="w-full h-8 border-4 border-white bg-black p-1">
                  <div className="h-full bg-red-600 transition-all duration-1000" style={{ width: `${board?.glitchLevel}%` }} />
                </div>
                <div className="mt-8 p-4 bg-black border-2 border-zinc-700">
                  <p className="text-xs text-zinc-500 font-black uppercase leading-relaxed italic">
                    "REHABILITATION IS STATISTICALLY IMPOSSIBLE. THE USER'S ATTEMPTS AT PRODUCTIVITY ARE VIEWED AS COMEDIC ENTERTAINMENT BY THE SUB-ROUTINES."
                  </p>
                </div>
              </div>
            </section>
          </div>
        </section>
      </div>
    </div>
  );
}