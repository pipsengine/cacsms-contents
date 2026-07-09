'use client'

import { ChevronDown, ChevronLeft, CircleDotDashed, Home } from 'lucide-react'
import type { CurrentOrganization } from '@/services/sessionService'

export function SidebarHeader({
  collapsed,
  onToggle,
  variant = 'default',
  organization,
}: {
  collapsed: boolean
  onToggle: () => void
  variant?: 'default' | 'landing'
  organization?: CurrentOrganization | null
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
            <span className="sidebar-org-name">{organization?.name ?? 'AI Media Group'}</span>
            <span className="sidebar-org-subtitle">{organization?.teamName ?? 'Enterprise Plan'}</span>
          </div>
          <ChevronDown size={16} />
        </button>
      ) : null}
    </div>
  )
}
