import React from 'react';
import { cn } from '@/lib/utils';
export const BrutalCard = ({ 
  children, 
  className, 
  onClick,
  style 
}: { 
  children: React.ReactNode, 
  className?: string, 
  onClick?: () => void,
  style?: React.CSSProperties
}) => (
  <div
    onClick={onClick}
    style={style}
    className={cn(
      "border-3 border-black bg-white p-4 shadow-brutal transition-all",
      onClick && "cursor-pointer hover:-translate-x-1 hover:-translate-y-1 hover:shadow-brutal-lg active:translate-x-0 active:translate-y-0 active:shadow-none",
      className
    )}
  >
    {children}
  </div>
);
export const BrutalButton = ({ 
  children, 
  onClick, 
  className, 
  variant = 'primary',
  disabled,
  type = "button"
}: { 
  children: React.ReactNode, 
  onClick?: () => void, 
  className?: string, 
  variant?: 'primary' | 'danger' | 'success' | 'blue',
  disabled?: boolean,
  type?: "button" | "submit" | "reset"
}) => {
  const variants = {
    primary: "bg-white text-black border-black hover:bg-black hover:text-white",
    danger: "bg-red-600 text-white border-black hover:bg-white hover:text-red-600",
    success: "bg-green-500 text-black border-black hover:bg-white hover:text-green-500",
    blue: "bg-blue-600 text-white border-black hover:bg-white hover:text-blue-600"
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "border-3 px-4 py-2 font-black uppercase shadow-brutal transition-all active:translate-x-1 active:translate-y-1 active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        className
      )}
    >
      {children}
    </button>
  );
};
export const BrutalInput = ({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    {...props}
    className={cn(
      "w-full border-3 border-black p-3 font-mono text-black focus:outline-none focus:ring-0 bg-white",
      className
    )}
  />
);
export const BrutalBadge = ({ 
  children, 
  variant = 'neutral',
  className 
}: { 
  children: React.ReactNode, 
  variant?: 'neutral' | 'warn' | 'crit' | 'success',
  className?: string
}) => {
  const variants = {
    neutral: "bg-black text-white",
    warn: "bg-yellow-400 text-black border-2 border-black",
    crit: "bg-red-600 text-white border-2 border-black",
    success: "bg-green-500 text-black border-2 border-black"
  };
  return (
    <span className={cn("px-2 py-0.5 text-xs font-bold uppercase inline-block", variants[variant], className)}>
      {children}
    </span>
  );
};