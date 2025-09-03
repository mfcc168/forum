import React from 'react';
import { cn } from '@/lib/utils';
import type { BadgeProps } from '@/lib/types';

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  const baseClasses = 'inline-flex items-center font-medium text-xs uppercase tracking-wider';
  
  const variants = {
    default: 'minecraft-badge px-3 py-1 rounded-full',
    primary: 'bg-blue-600 text-white px-2 py-1 rounded text-xs font-bold',
    secondary: 'bg-gray-600 text-white px-2 py-1 rounded text-xs font-bold',
    danger: 'bg-red-600 text-white px-2 py-1 rounded text-xs font-bold',
    success: 'bg-green-600 text-white px-2 py-1 rounded text-xs font-bold',
    warning: 'bg-yellow-600 text-white px-2 py-1 rounded text-xs font-bold',
  } as const;

  return (
    <span className={cn(baseClasses, variants[variant], className)}>
      {children}
    </span>
  );
}