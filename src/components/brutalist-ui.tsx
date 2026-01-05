import React from 'react';
import { cn } from '@/lib/utils';
export const BrutalCard = ({ children, className, onClick }: { children: React.ReactNode, className?: string, onClick?: () => void }) => (
  <div 
    onClick={onClick}
    className={cn(
      "border-3 border-black bg-white p-4 shadow-brutal transition-all",
      onClick && "cursor-pointer hover:-translate-x-1 hover:-translate-y-1 hover:shadow-brutal-lg active:translate-x-0 active:translate-y-0 active:shadow-none",
      className
    )}
  >
    {children}
  </div>
);
export const BrutalButton = ({ children, onClick, className, variant = 'primary' }: { children: React.ReactNode, onClick?: () => void, className?: string, variant?: 'primary' | 'danger' | 'success' }) => {
  const variants = {
    primary: "bg-white text-black border-black hover:bg-black hover:text-white",
    danger: "bg-red-600 text-white border-black hover:bg-white hover:text-red-600",
    success: "bg-green-500 text-black border-black hover:bg-white hover:text-green-500"
  };
  return (
    <button 
      onClick={onClick}
      className={cn(
        "border-3 px-4 py-2 font-black uppercase shadow-brutal transition-all active:translate-x-1 active:translate-y-1 active:shadow-none",
        variants[variant],
        className
      )}
    >
      {children}
    </button>
  );
};
export const BrutalInput = ({ ...props }: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input 
    {...props}
    className={cn(
      "w-full border-3 border-black p-3 font-mono text-black focus:outline-none focus:ring-0",
      props.className
    )}
  />
);
export const BrutalBadge = ({ children, variant = 'neutral' }: { children: React.ReactNode, variant?: 'neutral' | 'warn' | 'crit' }) => {
  const variants = {
    neutral: "bg-black text-white",
    warn: "bg-yellow-400 text-black border-2 border-black",
    crit: "bg-red-600 text-white border-2 border-black"
  };
  return (
    <span className={cn("px-2 py-0.5 text-xs font-bold uppercase", variants[variant])}>
      {children}
    </span>
  );
};