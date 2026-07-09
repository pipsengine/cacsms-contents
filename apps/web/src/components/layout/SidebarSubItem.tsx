'use client'

import Link from 'next/link'

export function SidebarSubItem({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link href={href} className={`sidebar-subitem ${active ? 'active' : ''}`}>
      <span>{label}</span>
    </Link>
  )
}
