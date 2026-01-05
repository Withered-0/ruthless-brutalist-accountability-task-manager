import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Skull, ChevronLeft, UserX, Gavel, ShieldAlert, Archive } from 'lucide-react';
import { api } from '@/lib/api-client';
import type { TaskBoardState } from '@shared/types';
import { BrutalCard, BrutalButton, BrutalBadge } from '@/components/brutalist-ui';
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
  const totalScore = (shameHistory.length * 10) + (stolen.length * 25);
  return (
    <div className="min-h-screen bg-black text-white font-mono">
      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12 space-y-12">
        <header className="border-8 border-red-600 p-8 bg-black text-white shadow-[8px_8px_0px_0px_rgba(255,0,0,1)] flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-red-600 leading-none">
              OFFENDER_ID: {board?.nickname || 'UNKNOWN'}
            </h1>
            <p className="text-xl font-bold italic uppercase mt-2">Incompetence Score: {totalScore}</p>
          </div>
          <BrutalButton onClick={() => navigate('/')} className="bg-white text-black border-black text-xl py-4">
            <ChevronLeft className="h-6 w-6 mr-2 inline" /> BACK TO PURGATORY
          </BrutalButton>
        </header>
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-12">
            <section className="space-y-6">
              <h2 className="text-4xl font-black uppercase tracking-tighter text-red-600 flex items-center gap-4 border-b-4 border-red-600 pb-2">
                <Skull className="h-10 w-10" /> POLICE REPORTS (PERMANENT)
              </h2>
              <div className="space-y-4">
                {shameHistory.length > 0 ? (
                  shameHistory.map((task) => (
                    <div key={task.id} className="border-4 border-white p-6 bg-zinc-950 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-2 opacity-10"><Skull className="h-24 w-24" /></div>
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-xs font-black text-red-600 bg-white px-2 py-1">CRIMINAL_RECORD_#{task.id.slice(0, 8)}</span>
                        <BrutalBadge variant="crit">{task.status}</BrutalBadge>
                      </div>
                      <h3 className="text-3xl font-black uppercase leading-tight">{task.title}</h3>
                      <p className="text-zinc-500 mt-2 text-sm italic">{task.description}</p>
                      <div className="mt-4 pt-4 border-t border-zinc-800 grid grid-cols-2 text-[10px] font-black uppercase text-zinc-400">
                        <div>DUE_DATE: {new Date(task.deadline).toLocaleString()}</div>
                        <div className="text-right">OFFENSE_LOGGED: {new Date(task.createdAt).toLocaleString()}</div>
                      </div>
                      <div className="mt-2 text-center border-2 border-red-600 text-red-600 font-black py-1 tracking-widest text-xs">
                        CANNOT BE DELETED - ADMITTED GUILT
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-24 border-8 border-dashed border-zinc-900">
                    <h2 className="text-4xl font-black text-zinc-800 uppercase">NO PERMANENT RECORD... YET.</h2>
                  </div>
                )}
              </div>
            </section>
          </div>
          <div className="space-y-8">
            <section className="space-y-6">
              <h2 className="text-3xl font-black uppercase tracking-tighter text-orange-600 flex items-center gap-4">
                <Gavel className="h-8 w-8" /> STOLEN VALOR
              </h2>
              <p className="text-zinc-500 font-bold uppercase text-[10px] leading-tight">THE SYSTEM HAS SEIZED THESE COMPLETIONS DUE TO YOUR POOR OVERALL BEHAVIOR.</p>
              <div className="space-y-3">
                {stolen.map(task => (
                  <BrutalCard key={task.id} className="border-orange-600 bg-zinc-950 opacity-60 grayscale">
                    <h3 className="text-lg font-black uppercase line-through">{task.title}</h3>
                    <p className="text-[10px] text-orange-600 font-black uppercase mt-1">STATUS: SEIZED AS COLLATERAL</p>
                  </BrutalCard>
                ))}
                {stolen.length === 0 && <p className="text-zinc-800 font-black uppercase text-center italic">Nothing worth stealing yet.</p>}
              </div>
            </section>
            <section className="border-4 border-white p-6 bg-zinc-900">
              <h3 className="text-xl font-black uppercase text-white mb-4 flex items-center gap-2"><Archive className="h-5 w-5" /> REHABILITATION STATUS</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-black uppercase"><span>Failure Depth:</span> <span className="text-red-600">{board?.glitchLevel}%</span></div>
                <div className="w-full h-4 border-2 border-white bg-black p-0.5">
                  <div className="h-full bg-red-600" style={{ width: `${board?.glitchLevel}%` }} />
                </div>
                <p className="text-[10px] text-zinc-500 uppercase leading-tight mt-4">
                  REHABILITATION IS UNLIKELY. THE SYSTEM SUGGESTS DELETING YOUR BROWSER AND STARTING A NEW LIFE AS A POTATO.
                </p>
              </div>
            </section>
          </div>
        </section>
      </div>
    </div>
  );
}