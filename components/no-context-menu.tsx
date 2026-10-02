'use client'

import { useEffect } from 'react'

export function NoContextMenu() {
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      e.preventDefault()
    }
    document.addEventListener('contextmenu', handler)
    return () => document.removeEventListener('contextmenu', handler)
  }, [])

  return null
}
