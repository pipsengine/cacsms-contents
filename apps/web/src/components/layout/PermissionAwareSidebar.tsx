'use client'

import type { NavSection } from '@/config/navigation'
import { SidebarSection } from './SidebarSection'

export function PermissionAwareSidebar({
  sections,
  loading,
  collapsed,
  expandedItems,
  onToggleItem,
  onNavigate,
}: {
  sections: NavSection[]
  loading: boolean
  collapsed: boolean
  expandedItems: string[]
  onToggleItem: (id: string) => void
  onNavigate?: () => void
}) {
  if (loading) {
    return (
      <div className="sidebar-loading">
        {Array.from({ length: 8 }).map((_, index) => (
          <div className="sidebar-loading-row" key={index} />
        ))}
      </div>
    )
  }

  return (
    <>
      {sections.map((section) => (
        <SidebarSection
          key={section.id}
          section={section}
          collapsed={collapsed}
          expandedItems={expandedItems}
          onToggleItem={onToggleItem}
          onNavigate={onNavigate}
        />
      ))}
    </>
  )
}

