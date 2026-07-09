import { AppShell } from '@/components/layout/AppShell'

export default function HomePage() {
  return (
    <AppShell>
      <section className="home-hero-card">
        <div className="home-hero-copy">
          <p className="home-eyebrow">Welcome back</p>
          <h2>Run your AI media system from one enterprise command center.</h2>
          <p>Monitor workflows, inspect insights, and manage content with modern controls.</p>
        </div>
        <div className="home-hero-actions">
          <button className="home-primary-button">Create content</button>
          <button className="home-secondary-button">Open command palette</button>
        </div>
      </section>
      <div className="home-grid">
        <article className="home-card">
          <h3>Active Workflows</h3>
          <p>12 workflows currently in progress</p>
        </article>
        <article className="home-card">
          <h3>AI Credits</h3>
          <p>142 of 200 credits used</p>
        </article>
        <article className="home-card">
          <h3>Production Pipeline</h3>
          <p>39 assets in staging</p>
        </article>
        <article className="home-card">
          <h3>Insights</h3>
          <p>36 new content opportunities</p>
        </article>
      </div>
      <section className="home-links-grid">
        <button className="home-link-card">Open Creative Studio</button>
        <button className="home-link-card">Review Publishing Queue</button>
        <button className="home-link-card">Launch AI Agent</button>
        <button className="home-link-card">Monitor System Health</button>
      </section>
    </AppShell>
  )
}
