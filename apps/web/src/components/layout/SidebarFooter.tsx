'use client'

import { Cpu, Database } from 'lucide-react'
import type { CurrentUser } from '@/services/sessionService'

export function SidebarFooter({
  collapsed,
  variant = 'default',
  user,
}: {
  collapsed: boolean
  variant?: 'default' | 'landing'
  user?: CurrentUser | null
}) {
  return (
    <div className="sidebar-footer">
      <div className="sidebar-usage-card">
        <div className="sidebar-usage-row">
          <div>
            <p className="sidebar-usage-label">Live Usage</p>
            <strong>Database required</strong>
          </div>
          {variant === 'landing' && !collapsed ? <span className="sidebar-usage-percent">DB</span> : <Cpu size={18} />}
        </div>
        {!collapsed ? <div className="sidebar-usage-progress" /> : null}
      </div>
      {!collapsed ? (
        <div className="sidebar-profile-card">
          <div className={variant === 'landing' ? 'sidebar-profile-photo' : 'sidebar-profile-avatar'}>{variant === 'landing' ? '' : user?.avatarInitials ?? '--'}</div>
          <div>
            <p className="sidebar-profile-name">{user?.name ?? 'No live session'}</p>
            <p className="sidebar-profile-role">{user?.roleLabel ?? 'Auth database required'}</p>
          </div>
        </div>
      ) : (
        <div className="sidebar-profile-avatar collapsed">{user?.avatarInitials ?? '--'}</div>
      )}
      {variant === 'default' ? null : (
        <div className="sidebar-footer-actions passive" aria-label="Sidebar data mode">
          <span className="sidebar-footer-status">
            <Database size={16} />
            {!collapsed ? <span>Live database mode</span> : null}
          </span>
        </div>
      )}
    </div>
  )
}
