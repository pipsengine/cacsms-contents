'use client'

import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Menu } from 'lucide-react'
import { SidebarHeader } from './SidebarHeader'
import { SidebarSearch } from './SidebarSearch'
import { SidebarFooter } from './SidebarFooter'
import { Topbar } from './Topbar'
import { useSidebarState } from '@/hooks/useSidebarState'
import { useNavigation } from '@/hooks/useNavigation'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { useCurrentOrganization } from '@/hooks/useCurrentOrganization'
import { PermissionAwareSidebar } from './PermissionAwareSidebar'

export function AppShell({
  children,
  showTopbar = true,
  sidebarVariant = 'default',
}: {
  children: React.ReactNode
  showTopbar?: boolean
  sidebarVariant?: 'default' | 'landing'
}) {
  const { collapsed, toggleCollapsed } = useSidebarState()
  const [manualExpandedItems, setManualExpandedItems] = useState<string[] | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { sections, loading: navigationLoading } = useNavigation()
  const { user } = useCurrentUser()
  const { organization } = useCurrentOrganization()
  const mainRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

  const activeParentId = useMemo(() => {
    for (const section of sections) {
      const activeItem = section.items.find((item) => {
        const itemActive = pathname === item.href || pathname?.startsWith(`${item.href}/`)
        const childActive = item.children?.some((child) => pathname === child.href)

        return itemActive || childActive
      })

      if (activeItem) {
        return activeItem.id
      }
    }

    return 'executive-office'
  }, [pathname, sections])

  const autoExpandedItems = sidebarVariant === 'landing' && pathname === '/' ? [] : [activeParentId]
  const expandedItems = manualExpandedItems ?? autoExpandedItems

  useLayoutEffect(() => {
    mainRef.current?.scrollTo({ top: 0, left: 0 })
  }, [pathname])

  const toggleItem = (id: string) => {
    setManualExpandedItems((current) =>
      (current ?? autoExpandedItems).includes(id)
        ? (current ?? autoExpandedItems).filter((itemId) => itemId !== id)
        : [id]
    )
  }

  const handleNavigate = () => {
    setManualExpandedItems(null)
    setMobileOpen(false)
  }

  return (
    <div className={`app-shell ${collapsed ? 'sidebar-collapsed' : ''} ${sidebarVariant === 'landing' ? 'landing-sidebar-shell' : ''}`}>
      <aside className={`app-sidebar ${mobileOpen ? 'open' : ''}`}>
        <SidebarHeader collapsed={collapsed} onToggle={toggleCollapsed} variant={sidebarVariant} organization={organization} />
        {sidebarVariant === 'landing' ? (
          <Link href="/" className={`sidebar-dashboard-link ${pathname === '/' ? 'active' : ''}`} onClick={handleNavigate}>
            <LayoutDashboard size={15} />
            {!collapsed ? <span>Dashboard</span> : null}
          </Link>
        ) : (
          <SidebarSearch collapsed={collapsed} />
        )}
        <div className="app-sidebar-body">
          <PermissionAwareSidebar
            sections={sections}
            loading={sidebarVariant !== 'landing' && navigationLoading}
            collapsed={collapsed}
            expandedItems={expandedItems}
            onToggleItem={toggleItem}
            onNavigate={handleNavigate}
          />
        </div>
        <SidebarFooter collapsed={collapsed} variant={sidebarVariant} user={user} />
      </aside>
      {mobileOpen ? (
        <button
          type="button"
          className="sidebar-scrim"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}
      <div ref={mainRef} className="app-main">
        {!showTopbar ? (
          <button
            type="button"
            className="standalone-mobile-menu-button"
            aria-label="Open navigation"
            onClick={() => setMobileOpen(true)}
          >
            <Menu size={18} />
          </button>
        ) : null}
        {showTopbar ? <Topbar onOpenSidebar={() => setMobileOpen(true)} /> : null}
        <main className="app-content">{children}</main>
      </div>
    </div>
  )
}
