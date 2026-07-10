import { AppShell } from '@/components/layout/AppShell'

export default function HomePage() {
  return (
    <AppShell>
      <section className="home-hero-card">
        <div className="home-hero-copy">
          <p className="home-eyebrow">Live database mode</p>
          <h2>CACSMS Contents requires production database data.</h2>
          <p>Configure MSSQL and run migrations to populate this workspace.</p>
        </div>
      </section>
    </AppShell>
  )
}
