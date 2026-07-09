'use client'

import { useEffect, useMemo, useState } from 'react'
import { LayoutDashboard } from 'lucide-react'
import { navigationSections, type NavItem, type NavSection } from '@/config/navigation'
import { useAuth } from '@/components/auth/AuthProvider'

const staticNavItems = navigationSections.flatMap((section) => section.items)

function hydrateNavigationIcons(sections: NavSection[]): NavSection[] {
  return sections.map((section) => ({
    ...section,
    items: section.items.map((item) => {
      const staticItem = staticNavItems.find((candidate) => candidate.href === item.href || candidate.title === item.title)
      const hydratedItem: NavItem = {
        ...item,
        icon: staticItem?.icon ?? LayoutDashboard,
        badge: item.badge ?? staticItem?.badge,
        children: item.children?.length ? item.children : staticItem?.children,
        requiredPermission: item.requiredPermission ?? staticItem?.requiredPermission,
      }
      return hydratedItem
    }),
  }))
}

function filterSections(sections: NavSection[], canAccess: (permission?: string) => boolean) {
  return sections
    .map((section) => ({
      ...section,
      items: section.items
        .filter((item) => canAccess(item.requiredPermission))
        .map((item) => ({
          ...item,
          children: item.children?.filter((child) => canAccess(child.requiredPermission)),
        })),
    }))
    .filter((section) => section.items.length)
}

export function useNavigation() {
  const { canAccess, loading: authLoading, audit } = useAuth()
  const [sections, setSections] = useState<NavSection[]>(navigationSections)
  const [loading, setLoading] = useState(true)
  const [source, setSource] = useState<'database' | 'mock' | 'static'>('static')

  useEffect(() => {
    let mounted = true

    async function loadNavigation() {
      setLoading(true)
      try {
        const response = await fetch('/api/v1/navigation', { cache: 'no-store' })
        if (!response.ok) throw new Error('Navigation API failed')
        const payload = (await response.json()) as { data?: NavSection[]; metadata?: { source?: 'database' | 'mock' } }
        const hydrated = hydrateNavigationIcons(payload.data?.length ? payload.data : navigationSections)
        if (mounted) {
          setSections(hydrated)
          setSource(payload.metadata?.source ?? 'mock')
        }
        await audit({ action: 'navigation.loaded', resource: 'navigation', permission: 'navigation:read', status: 'success' })
      } catch {
        if (mounted) {
          setSections(navigationSections)
          setSource('static')
        }
        await audit({ action: 'navigation.loaded', resource: 'navigation', permission: 'navigation:read', status: 'fallback' })
      } finally {
        if (mounted) setLoading(false)
      }
    }

    if (!authLoading) {
      void loadNavigation()
    }

    return () => {
      mounted = false
    }
  }, [audit, authLoading])

  const filteredSections = useMemo(() => filterSections(sections, canAccess), [canAccess, sections])

  return {
    sections: filteredSections.length ? filteredSections : navigationSections,
    loading: loading || authLoading,
    source,
  }
}

