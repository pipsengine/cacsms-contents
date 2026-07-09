'use client'

import { Search } from 'lucide-react'

export function SidebarSearch({ collapsed }: { collapsed: boolean }) {
  return (
    <div className={`sidebar-search-wrapper ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-search-icon">
        <Search size={16} />
      </div>
      {!collapsed ? (
        <input
          type="search"
          className="sidebar-search-input"
          placeholder="Search modules..."
          aria-label="Search modules"
        />
      ) : null}
      {!collapsed ? <span className="sidebar-search-shortcut">Ctrl K</span> : null}
    </div>
  )
}
