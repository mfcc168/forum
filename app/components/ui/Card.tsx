import React from 'react';
import { cn } from '@/lib/utils';
import { CardProps } from '@/lib/types';

export function Card({ 
  children, 
  className, 
  variant = 'default', 
  size = 'md',
  clickable = false,
  isSelected = false,
  hoverable = false,
  onClick,
  header,
  footer,
  id,
  'data-testid': testId,
  ...props 
}: CardProps) {
  const baseClasses = 'rounded-lg transition-all';
  
  const variants = {
    default: 'minecraft-card bg-white border border-slate-200/50 shadow-sm',
    bordered: 'bg-white border-2 border-slate-200',
    elevated: 'minecraft-card bg-white shadow-lg border border-slate-200/50',
    outlined: 'bg-transparent border-2 border-slate-300',
    minecraft: 'minecraft-panel bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200',
    panel: 'bg-white/80 backdrop-blur border border-slate-200/50 shadow-sm',
  } as const;

  const sizes = {
    xs: 'p-2',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-10',
  };

  const Component = (clickable || onClick) ? 'button' : 'div';
  const isInteractive = clickable || onClick || hoverable;

  return (
    <Component
      className={cn(
        baseClasses,
        variants[variant],
        sizes[size],
        isInteractive && 'cursor-pointer',
        hoverable && 'hover:scale-[1.02] hover:shadow-md',
        isSelected && 'ring-2 ring-emerald-500 ring-offset-2',
        clickable && 'focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2',
        className
      )}
      onClick={onClick}
      id={id}
      data-testid={testId}
      {...props}
    >
      {header && (
        <div className="mb-4 pb-4 border-b border-slate-200">
          {header}
        </div>
      )}
      
      <div className={cn(!header && !footer && sizes[size])}>
        {children}
      </div>
      
      {footer && (
        <div className="mt-4 pt-4 border-t border-slate-200">
          {footer}
        </div>
      )}
    </Component>
  );
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('mb-4', className)}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <h3 className={cn('text-xl font-bold text-slate-800', className)}>
      {children}
    </h3>
  );
}

export function CardContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('text-slate-600', className)}>
      {children}
    </div>
  );
}