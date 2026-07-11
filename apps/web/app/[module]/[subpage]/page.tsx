import { AppShell } from '@/components/layout/AppShell'
import { moduleMap } from '../../data'
import { notFound } from 'next/navigation'

export default function SubpagePage({ params }: { params: { module: string; subpage: string } }) {
  const moduleInfo = moduleMap.get(params.module)
  if (!moduleInfo) {
    notFound()
  }

  const subpage = moduleInfo.subpages.find((item) => item.id === params.subpage)
  if (!subpage) {
    notFound()
  }

  return (
    <AppShell sidebarVariant="landing">
      <section className="module-page">
        <p className="home-eyebrow">{moduleInfo.label}</p>
        <h1>{subpage.label}</h1>
        <p>
          This is the page for {subpage.label} inside the {moduleInfo.label} module.
        </p>
        <p>Use the sidebar to navigate between modules and sub-pages.</p>
      </section>
    </AppShell>
  )
}
