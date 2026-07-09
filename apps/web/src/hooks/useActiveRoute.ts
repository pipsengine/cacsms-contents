'use client'

import { usePathname } from 'next/navigation'

export function useActiveRoute() {
  const pathname = usePathname()

  return {
    activePath: pathname,
    isActiveRoute: (href: string) => pathname === href,
    isActiveParent: (href: string) => pathname === href || pathname?.startsWith(`${href}/`),
  }
}
