'use client'

import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, LayoutDashboard } from 'lucide-react'
import type { NavItem } from '@/config/navigation'
import { useActiveRoute } from '@/hooks/useActiveRoute'

export function SidebarItem({ item, collapsed, expanded, onToggle, onNavigate }: {
  item: NavItem
  collapsed: boolean
  expanded: boolean
  onToggle: (id: string) => void
  onNavigate?: () => void
}) {
  const { activePath, isActiveParent } = useActiveRoute()
  const isActive = isActiveParent(item.href)
  const hasChildren = Boolean(item.children && item.children.length)
  const Icon = item.icon ?? LayoutDashboard

  return (
    <div className={`sidebar-item ${isActive ? 'active' : ''}`}>
      <div className="sidebar-item-row">
        <Link href={item.href} className={`sidebar-item-button ${isActive ? 'active' : ''}`} onClick={onNavigate}>
          <div className="sidebar-item-icon">
            <Icon size={18} />
          </div>
          {!collapsed ? (
            <>
              <span className="sidebar-item-label">{item.title}</span>
              {item.badge ? <span className="sidebar-item-badge">{item.badge}</span> : null}
            </>
          ) : (
            <span className="sidebar-tooltip">{item.title}</span>
          )}
        </Link>
        {hasChildren ? (
          <button
            type="button"
            onClick={() => onToggle(item.id)}
            aria-expanded={expanded}
            aria-label={`Toggle ${item.title} submenu`}
            className="sidebar-item-toggle"
          >
            <ChevronDown className={`sidebar-item-chevron ${expanded ? 'open' : ''}`} size={16} />
          </button>
        ) : null}
      </div>
      <AnimatePresence initial={false}>
        {hasChildren && expanded && !collapsed ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            className="sidebar-subitems"
          >
            {item.children?.map((child) => {
              const activeChild = activePath === child.href
              return (
                <Link
                  key={child.id}
                  href={child.href}
                  className={`sidebar-subitem ${activeChild ? 'active' : ''}`}
                  onClick={onNavigate}
                >
                  <span>{child.title}</span>
                </Link>
              )
            })}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
