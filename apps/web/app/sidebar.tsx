'use client'

import { useState } from 'react'
import Link from 'next/link'
import { moduleData } from './data'

export default function Sidebar() {
  const [openModules, setOpenModules] = useState<Record<string, boolean>>({})

  const toggleModule = (moduleId: string) => {
    setOpenModules((prev) => ({
      ...prev,
      [moduleId]: !prev[moduleId],
    }))
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <strong>CACSMS</strong>
        <span>Contents</span>
      </div>
      <nav className="sidebar-nav" aria-label="Primary">
        <ul>
          {moduleData.map((module) => {
            const isOpen = Boolean(openModules[module.id])

            return (
              <li key={module.id}>
                <div className="sidebar-module-header">
                  <Link href={`/${module.id}`} className="sidebar-link">
                    {module.label}
                  </Link>
                  <button
                    type="button"
                    className={`sidebar-toggle ${isOpen ? 'open' : ''}`}
                    aria-expanded={isOpen}
                    aria-controls={`subpages-${module.id}`}
                    onClick={() => toggleModule(module.id)}
                  >
                    <span aria-hidden="true">{isOpen ? '−' : '+'}</span>
                    <span className="sr-only">
                      {isOpen ? `Collapse ${module.label}` : `Expand ${module.label}`}
                    </span>
                  </button>
                </div>
                {module.subpages.length > 0 ? (
                  <ul
                    id={`subpages-${module.id}`}
                    className={`sidebar-subpages ${isOpen ? 'open' : 'collapsed'}`}
                    hidden={!isOpen}
                  >
                    {module.subpages.map((subpage) => (
                      <li key={subpage.id}>
                        <Link href={`/${module.id}/${subpage.id}`} className="sidebar-sublink">
                          {subpage.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            )
          })}
        </ul>
      </nav>
    </aside>
  )
}
