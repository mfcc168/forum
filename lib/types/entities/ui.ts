/**
 * UI Interaction Types
 * 
 * Types for UI components and user interactions
 */

// ============================================================================
// UI INTERACTION TYPES
// ============================================================================

/** Confirmation dialog options */
export interface ConfirmOptions {
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
}

/** Confirmation dialog state */
export interface ConfirmState extends ConfirmOptions {
  isOpen: boolean
  resolver?: (value: boolean) => void
}