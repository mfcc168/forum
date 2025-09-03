'use client'

import { memo, forwardRef, ButtonHTMLAttributes } from 'react'
import { Icon } from '@/app/components/ui/Icon'

export interface ActionButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'size'> {
  /** Button variant */
  variant?: 'default' | 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'success' | 'warning'
  
  /** Button size */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  
  /** Icon name (from your Icon component) */
  icon?: string
  
  /** Icon position */
  iconPosition?: 'left' | 'right' | 'only'
  
  /** Loading state */
  isLoading?: boolean
  
  /** Loading text override */
  loadingText?: string
  
  /** Show loading spinner */
  showLoadingSpinner?: boolean
  
  /** Badge/count to show in top-right corner */
  badge?: string | number
  
  /** Badge color */
  badgeColor?: 'default' | 'red' | 'green' | 'blue' | 'yellow' | 'purple'
  
  /** Full width button */
  fullWidth?: boolean
  
  /** Rounded variant */
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full'
  
  /** Drop shadow */
  shadow?: 'none' | 'sm' | 'md' | 'lg'
  
  /** Animation on click */
  clickAnimation?: 'none' | 'bounce' | 'scale' | 'pulse'
  
  /** Tooltip text */
  tooltip?: string
  
  /** Custom CSS classes */
  className?: string
  
  /** Ref forwarding */
  ref?: React.Ref<HTMLButtonElement>
}

export const ActionButton = memo(forwardRef<HTMLButtonElement, ActionButtonProps>(function ActionButton({
  variant = 'default',
  size = 'md',
  icon,
  iconPosition = 'left',
  isLoading = false,
  loadingText,
  showLoadingSpinner = true,
  badge,
  badgeColor = 'default',
  fullWidth = false,
  rounded = 'md',
  shadow = 'none',
  clickAnimation = 'none',
  tooltip,
  className = '',
  children,
  disabled,
  ...props
}, ref) {
  
  // Get size classes
  const sizeClasses = {
    xs: {
      button: 'px-2 py-1 text-xs',
      icon: 'w-3 h-3',
      spinner: 'w-3 h-3'
    },
    sm: {
      button: 'px-2.5 py-1.5 text-sm',
      icon: 'w-4 h-4',
      spinner: 'w-4 h-4'
    },
    md: {
      button: 'px-3 py-2 text-sm',
      icon: 'w-4 h-4',
      spinner: 'w-4 h-4'
    },
    lg: {
      button: 'px-4 py-2.5 text-base',
      icon: 'w-5 h-5',
      spinner: 'w-5 h-5'
    },
    xl: {
      button: 'px-6 py-3 text-lg',
      icon: 'w-6 h-6',
      spinner: 'w-6 h-6'
    }
  }
  
  // Get variant classes
  const getVariantClasses = () => {
    const variants = {
      default: 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 hover:border-slate-400 focus:ring-slate-500',
      primary: 'bg-emerald-500 text-white border border-emerald-500 hover:bg-emerald-600 hover:border-emerald-600 focus:ring-emerald-500',
      secondary: 'bg-slate-500 text-white border border-slate-500 hover:bg-slate-600 hover:border-slate-600 focus:ring-slate-500',
      outline: 'bg-transparent text-emerald-600 border border-emerald-300 hover:bg-emerald-50 hover:border-emerald-400 focus:ring-emerald-500',
      ghost: 'bg-transparent text-slate-600 border-transparent hover:bg-slate-100 hover:text-slate-700 focus:ring-slate-500',
      destructive: 'bg-red-500 text-white border border-red-500 hover:bg-red-600 hover:border-red-600 focus:ring-red-500',
      success: 'bg-green-500 text-white border border-green-500 hover:bg-green-600 hover:border-green-600 focus:ring-green-500',
      warning: 'bg-yellow-500 text-white border border-yellow-500 hover:bg-yellow-600 hover:border-yellow-600 focus:ring-yellow-500'
    }
    
    return variants[variant]
  }
  
  // Get rounded classes
  const getRoundedClasses = () => {
    const roundedVariants = {
      none: 'rounded-none',
      sm: 'rounded-sm',
      md: 'rounded-md',
      lg: 'rounded-lg',
      full: 'rounded-full'
    }
    
    return roundedVariants[rounded]
  }
  
  // Get shadow classes
  const getShadowClasses = () => {
    const shadowVariants = {
      none: '',
      sm: 'shadow-sm',
      md: 'shadow-md',
      lg: 'shadow-lg'
    }
    
    return shadowVariants[shadow]
  }
  
  // Get click animation classes
  const getClickAnimationClasses = () => {
    const animations = {
      none: '',
      bounce: 'active:animate-bounce',
      scale: 'active:scale-95 transform transition-transform',
      pulse: 'active:animate-pulse'
    }
    
    return animations[clickAnimation]
  }
  
  // Get badge classes
  const getBadgeClasses = () => {
    const badgeColors = {
      default: 'bg-slate-500 text-white',
      red: 'bg-red-500 text-white',
      green: 'bg-green-500 text-white',
      blue: 'bg-blue-500 text-white',
      yellow: 'bg-yellow-500 text-white',
      purple: 'bg-purple-500 text-white'
    }
    
    return badgeColors[badgeColor]
  }
  
  // Loading spinner component
  const LoadingSpinner = () => (
    <svg 
      className={`${sizeClasses[size].spinner} animate-spin`} 
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
        d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )
  
  // Determine if button should be disabled
  const isDisabled = disabled || isLoading
  
  // Get display text
  const getDisplayText = () => {
    if (isLoading && loadingText) return loadingText
    return children
  }
  
  // Render icon
  const renderIcon = (position: 'left' | 'right') => {
    if (!icon || iconPosition !== position) return null
    
    if (isLoading && showLoadingSpinner && position === 'left') {
      return <LoadingSpinner />
    }
    
    return (
      <Icon 
        name={icon} 
        className={sizeClasses[size].icon} 
      />
    )
  }
  
  // Base button classes
  const baseClasses = [
    'inline-flex items-center justify-center font-medium transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
    sizeClasses[size].button,
    getVariantClasses(),
    getRoundedClasses(),
    getShadowClasses(),
    getClickAnimationClasses(),
    fullWidth ? 'w-full' : '',
    className
  ].filter(Boolean).join(' ')
  
  return (
    <div className="relative inline-flex">
      <button
        ref={ref}
        className={baseClasses}
        disabled={isDisabled}
        title={tooltip}
        {...props}
      >
        {/* Left icon or loading spinner */}
        {renderIcon('left')}
        
        {/* Icon-only button */}
        {iconPosition === 'only' && (
          <>
            {isLoading && showLoadingSpinner ? <LoadingSpinner /> : icon && <Icon name={icon} className={sizeClasses[size].icon} />}
          </>
        )}
        
        {/* Button text */}
        {iconPosition !== 'only' && (
          <span className={`${
            (icon && iconPosition === 'left') || (isLoading && showLoadingSpinner) ? 'ml-2' : ''
          } ${
            icon && iconPosition === 'right' ? 'mr-2' : ''
          }`}>
            {getDisplayText()}
          </span>
        )}
        
        {/* Right icon */}
        {renderIcon('right')}
      </button>
      
      {/* Badge */}
      {badge && (
        <span className={`
          absolute -top-1 -right-1 flex items-center justify-center
          min-w-[1.25rem] h-5 px-1 text-xs font-bold rounded-full
          ${getBadgeClasses()}
        `}>
          {badge}
        </span>
      )}
    </div>
  )
}))

export default ActionButton