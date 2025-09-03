'use client'

import { useEffect } from 'react'
import { Button } from './Button'
import { Card } from './Card'

interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger'
}: ConfirmModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'auto'
    }

    return () => {
      document.body.style.overflow = 'auto'
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleConfirm = () => {
    onConfirm()
    onClose()
  }

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          icon: '⚠️',
          iconBg: 'bg-red-100',
          iconText: 'text-red-600',
          confirmButton: 'bg-red-600 hover:bg-red-700'
        }
      case 'warning':
        return {
          icon: '⚠️',
          iconBg: 'bg-yellow-100',
          iconText: 'text-yellow-600',
          confirmButton: 'bg-yellow-600 hover:bg-yellow-700'
        }
      case 'info':
        return {
          icon: 'ℹ️',
          iconBg: 'bg-blue-100',
          iconText: 'text-blue-600',
          confirmButton: 'bg-blue-600 hover:bg-blue-700'
        }
    }
  }

  const styles = getVariantStyles()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative z-10 w-full max-w-md mx-4">
        <Card className="p-6">
          <div className="flex items-start space-x-4">
            {/* Icon */}
            <div className={`flex-shrink-0 w-10 h-10 rounded-full ${styles.iconBg} flex items-center justify-center`}>
              <span className={`text-lg ${styles.iconText}`}>
                {styles.icon}
              </span>
            </div>
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                {title}
              </h3>
              <p className="text-sm text-slate-600 mb-6">
                {message}
              </p>
              
              {/* Actions */}
              <div className="flex space-x-3 justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onClose}
                  className="min-w-[80px]"
                >
                  {cancelText}
                </Button>
                <Button
                  size="sm"
                  onClick={handleConfirm}
                  className={`min-w-[80px] text-white ${styles.confirmButton}`}
                >
                  {confirmText}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}