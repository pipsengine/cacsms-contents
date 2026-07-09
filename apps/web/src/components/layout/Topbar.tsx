'use client'

import { Bell, Menu, Moon, Search, Smile, SunMedium } from 'lucide-react'
import { useState } from 'react'

export function Topbar({ onOpenSidebar }: { onOpenSidebar?: () => void }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button type="button" className="topbar-menu-button" aria-label="Open navigation" onClick={onOpenSidebar}>
          <Menu size={18} />
        </button>
        <div className="topbar-breadcrumbs">
          <span>Dashboard</span>
          <span className="topbar-breadcrumb-separator">/</span>
          <span>Overview</span>
        </div>
        <div className="topbar-title-block">
          <h1>Welcome to CACSMS</h1>
          <p>Monitor performance, manage content, and control AI workflows.</p>
        </div>
      </div>
      <div className="topbar-actions">
        <button type="button" className="topbar-search-button" aria-label="Global search">
          <Search size={18} />
          <span>Search</span>
        </button>
        <button type="button" className="topbar-action-button">
          <Bell size={18} />
        </button>
        <button type="button" className="topbar-action-button" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
          {theme === 'light' ? <Moon size={18} /> : <SunMedium size={18} />}
        </button>
        <button type="button" className="topbar-avatar-button" aria-label="Open profile menu">
          <Smile size={18} />
        </button>
      </div>
    </header>
  )
}
