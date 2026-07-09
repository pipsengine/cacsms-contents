'use client'

import { Cpu, LogOut, Sparkles } from 'lucide-react'

export function SidebarFooter({
  collapsed,
  variant = 'default',
}: {
  collapsed: boolean
  variant?: 'default' | 'landing'
}) {
  return (
    <div className="sidebar-footer">
      <div className="sidebar-usage-card">
        <div className="sidebar-usage-row">
          <div>
            <p className="sidebar-usage-label">AI Credits</p>
            <strong>{variant === 'landing' ? '32,450 / 50,000' : '142 / 200'}</strong>
          </div>
          {variant === 'landing' && !collapsed ? <span className="sidebar-usage-percent">64%</span> : <Cpu size={18} />}
        </div>
        {!collapsed ? <div className="sidebar-usage-progress" /> : null}
      </div>
      {!collapsed ? (
        <div className="sidebar-profile-card">
          <div className={variant === 'landing' ? 'sidebar-profile-photo' : 'sidebar-profile-avatar'}>{variant === 'landing' ? '' : 'AC'}</div>
          <div>
            <p className="sidebar-profile-name">{variant === 'landing' ? 'John Doe' : 'Alex Carter'}</p>
            <p className="sidebar-profile-role">{variant === 'landing' ? 'Super Admin' : 'Product Lead'}</p>
          </div>
        </div>
      ) : (
        <div className="sidebar-profile-avatar collapsed">AC</div>
      )}
      <div className="sidebar-footer-actions">
        <button type="button" className="sidebar-footer-button">
          <Sparkles size={16} />
          {!collapsed ? <span>Settings</span> : null}
        </button>
        <button type="button" className="sidebar-footer-button">
          <LogOut size={16} />
          {!collapsed ? <span>Logout</span> : null}
        </button>
      </div>
    </div>
  )
}
