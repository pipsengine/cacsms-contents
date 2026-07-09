'use client'

import { ChevronDown, ChevronLeft, CircleDotDashed, Home } from 'lucide-react'

export function SidebarHeader({
  collapsed,
  onToggle,
  variant = 'default',
}: {
  collapsed: boolean
  onToggle: () => void
  variant?: 'default' | 'landing'
}) {
  return (
    <div className="sidebar-header-block">
      <div className="sidebar-brand-row">
        <div className="sidebar-brand-icon">
          {variant === 'landing' ? <CircleDotDashed size={20} /> : <Home size={18} />}
        </div>
        <div className="sidebar-brand-text">
          <span className="sidebar-brand-title">{variant === 'landing' ? 'CACSMS' : 'CACSMS Contents'}</span>
          <span className="sidebar-brand-subtitle">{variant === 'landing' ? 'CONTENTS' : 'AI Media Operating System'}</span>
        </div>
        <button type="button" className="sidebar-collapse-button" onClick={onToggle} aria-label="Toggle sidebar">
          {collapsed ? <ChevronDown size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>
      {variant === 'default' ? (
        <button type="button" className="sidebar-org-switcher">
          <div className="sidebar-org-avatar">A</div>
          <div className="sidebar-org-details">
            <span className="sidebar-org-name">Acme Media</span>
            <span className="sidebar-org-subtitle">Team Beta</span>
          </div>
          <ChevronDown size={16} />
        </button>
      ) : null}
    </div>
  )
}
