'use client'

import { useEffect, useState } from 'react'

const STORAGE_KEY = 'cacsms-sidebar-collapsed'

export function useSidebarState() {
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === 'undefined') {
      return false
    }

    return window.localStorage.getItem(STORAGE_KEY) === 'true'
  })

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, collapsed ? 'true' : 'false')
  }, [collapsed])

  return {
    collapsed,
    toggleCollapsed: () => setCollapsed((value) => !value),
    setCollapsed,
  }
}
