import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AppShell } from '@/components/layout/AppShell'
import { moduleMap } from '../data'

export default function ModulePage({ params }: { params: { module: string } }) {
  const moduleInfo = moduleMap.get(params.module)

  if (!moduleInfo) {
    notFound()
  }

  return (
    <AppShell sidebarVariant="landing">
      <section className="module-page">
        <h1>{moduleInfo.label}</h1>
        <p>This is the module page for {moduleInfo.label}.</p>
        {moduleInfo.subpages.length > 0 ? (
          <div className="module-subpages-panel">
            <h2>Sub-pages</h2>
            <ul className="module-subpage-grid">
              {moduleInfo.subpages.map((subpage) => (
                <li key={subpage.id}>
                  <Link href={`/${moduleInfo.id}/${subpage.id}`} className="module-subpage-link">
                    {subpage.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>
    </AppShell>
  )
}
