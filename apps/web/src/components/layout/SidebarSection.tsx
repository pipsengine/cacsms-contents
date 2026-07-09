'use client'

import type { NavSection } from '@/config/navigation'
import { SidebarItem } from './SidebarItem'

export function SidebarSection({ section, collapsed, expandedItems, onToggleItem, onNavigate }: {
  section: NavSection
  collapsed: boolean
  expandedItems: string[]
  onToggleItem: (id: string) => void
  onNavigate?: () => void
}) {
  return (
    <div className="sidebar-section">
      {!collapsed ? <div className="sidebar-section-title">{section.title}</div> : null}
      <div className="sidebar-section-items">
        {section.items.map((item) => (
          <SidebarItem
            key={item.id}
            item={item}
            collapsed={collapsed}
            expanded={expandedItems.includes(item.id)}
            onToggle={onToggleItem}
            onNavigate={onNavigate}
          />
        ))}
      </div>
    </div>
  )
}
