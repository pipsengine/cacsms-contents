import { navigationRepository } from '@cacsms/database'
import { navigationSections, type NavSection } from '@/config/navigation'

type NavigationRow = {
  section_id: string
  section_title: string
  item_id: string | null
  title: string | null
  href: string | null
  required_permission?: string | null
}

export const navigationService = {
  async getNavigationTree(permissionCodes: string[] = []) {
    const rows = await navigationRepository.getNavigationTree(permissionCodes)
    return {
      source: 'database' as const,
      data: normalizeNavigation(rows as NavigationRow[]),
    }
  },
}

function normalizeNavigation(rows: NavigationRow[]): NavSection[] {
  if (!rows.length) return []
  const sections = new Map<string, NavSection>()

  for (const row of rows) {
    if (!sections.has(row.section_id)) {
      sections.set(row.section_id, {
        id: row.section_title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        title: row.section_title,
        items: [],
      })
    }

    const section = sections.get(row.section_id)
    if (!section || !row.item_id || !row.title || !row.href) continue
    const staticItem = navigationSections.flatMap((itemSection) => itemSection.items).find((item) => item.href === row.href || item.title === row.title)

    section.items.push({
      id: row.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      title: row.title,
      href: row.href,
      icon: staticItem?.icon ?? navigationSections[0].items[0].icon,
      badge: staticItem?.badge,
      children: staticItem?.children,
      requiredPermission: row.required_permission ?? staticItem?.requiredPermission,
    })
  }

  return Array.from(sections.values()).filter((section) => section.items.length)
}
