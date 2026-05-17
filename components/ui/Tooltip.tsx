import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/cn';

export interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  className?: string;
  contentClassName?: string;
}

export function Tooltip({
  content,
  children,
  position = 'top',
  delay = 200,
  className,
  contentClassName,
}: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const show = () => {
    timeoutRef.current = setTimeout(() => setVisible(true), delay);
  };

  const hide = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 -mt-1 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-slate-800',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 -mb-1 border-l-4 border-r-4 border-b-4 border-l-transparent border-r-transparent border-b-slate-800',
    left: 'left-full top-1/2 -translate-y-1/2 -ml-1 border-t-4 border-b-4 border-l-4 border-t-transparent border-b-transparent border-l-slate-800',
    right: 'right-full top-1/2 -translate-y-1/2 -mr-1 border-t-4 border-b-4 border-r-4 border-t-transparent border-b-transparent border-r-slate-800',
  };

  return (
    <div className={cn('relative inline-flex', className)} onMouseEnter={show} onMouseLeave={hide}>
      {children}
      {visible && (
        <div className={cn(
          'absolute z-50 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg shadow-xl text-xs text-white whitespace-nowrap pointer-events-none animate-fade-in',
          positionClasses[position],
          contentClassName
        )}>
          {content}
          <div className={cn('absolute w-0 h-0', arrowClasses[position])} />
        </div>
      )}
    </div>
  );
}
