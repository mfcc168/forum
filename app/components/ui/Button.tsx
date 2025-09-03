import React from 'react';
import { cn } from '@/lib/utils';
import { ButtonProps } from '@/lib/types';

export function Button({ 
  variant = 'primary', 
  size = 'md', 
  icon, 
  iconAfter,
  children, 
  className,
  isLoading = false,
  loadingText,
  fullWidth = false,
  disabled,
  'aria-label': ariaLabel,
  'data-testid': testId,
  ...props 
}: ButtonProps) {
  const baseClasses = 'minecraft-button inline-flex items-center justify-center font-medium transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700',
    secondary: 'bg-white text-slate-800 border-2 border-slate-300 hover:bg-slate-50',
    outline: 'bg-transparent text-slate-600 border-2 border-slate-300 hover:bg-slate-50 hover:text-slate-900',
    ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900',
    destructive: 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700',
    minecraft: 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 border-2 border-green-800 shadow-md',
    default: 'bg-slate-100 text-slate-800 border-2 border-slate-200 hover:bg-slate-200',
  };

  const sizes = {
    xs: 'px-2 py-1 text-xs rounded',
    sm: 'px-3 py-2 text-sm rounded-md',
    md: 'px-4 py-2 text-sm rounded-lg',
    lg: 'px-6 py-3 text-base rounded-lg',
    xl: 'px-8 py-4 text-lg rounded-xl',
  };

  const isDisabled = disabled || isLoading;
  const displayText = isLoading && loadingText ? loadingText : children;

  return (
    <button
      className={cn(
        baseClasses,
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className
      )}
      disabled={isDisabled}
      aria-label={ariaLabel}
      data-testid={testId}
      {...props}
    >
      {/* Loading spinner */}
      {isLoading && (
        <svg 
          className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24"
        >
          <circle 
            className="opacity-25" 
            cx="12" 
            cy="12" 
            r="10" 
            stroke="currentColor" 
            strokeWidth="4"
          />
          <path 
            className="opacity-75" 
            fill="currentColor" 
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      
      {/* Start icon */}
      {!isLoading && icon && <span className="mr-2">{icon}</span>}
      
      {/* Button text */}
      {displayText}
      
      {/* End icon */}
      {!isLoading && iconAfter && <span className="ml-2">{iconAfter}</span>}
    </button>
  );
}