'use client'

import { useState, useCallback } from 'react'
import type { ConfirmOptions, ConfirmState } from '@/lib/types'

export function useConfirm() {
  const [state, setState] = useState<ConfirmState>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    variant: 'danger'
  })

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({
        isOpen: true,
        resolver: resolve,
        ...options
      })
    })
  }, [])

  const handleConfirm = useCallback(() => {
    if (state.resolver) {
      state.resolver(true)
    }
    setState(prev => ({ ...prev, isOpen: false, resolver: undefined }))
  }, [state])

  const handleCancel = useCallback(() => {
    if (state.resolver) {
      state.resolver(false)
    }
    setState(prev => ({ ...prev, isOpen: false, resolver: undefined }))
  }, [state])

  return {
    confirm,
    confirmState: state,
    handleConfirm,
    handleCancel
  }
}