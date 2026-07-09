import { notFound } from 'next/navigation'

const modules = new Map([
  ['executive-office', 'Executive Office'],
  ['organization-management', 'Organization Management'],
  ['brand-management', 'Brand Management'],
  ['channel-management', 'Channel Management'],
  ['research-intelligence', 'Research Intelligence'],
  ['content-strategy', 'Content Strategy'],
  ['content-production', 'Content Production'],
  ['creative-studio', 'Creative Studio'],
  ['video-studio', 'Video Studio'],
  ['audio-voice-studio', 'Audio & Voice Studio'],
  ['seo-intelligence', 'SEO Intelligence'],
  ['publishing-center', 'Publishing Center'],
  ['marketing-automation', 'Marketing Automation'],
  ['community-management', 'Community Management'],
  ['monetization-center', 'Monetization Center'],
  ['analytics-intelligence', 'Analytics & Intelligence'],
  ['ai-learning-center', 'AI Learning Center'],
  ['ai-agents', 'AI Agents'],
  ['workflow-automation', 'Workflow Automation'],
  ['digital-asset-management', 'Digital Asset Management'],
  ['knowledge-hub', 'Knowledge Hub'],
  ['integrations', 'Integrations'],
  ['notifications', 'Notifications'],
  ['reports', 'Reports'],
  ['compliance-governance', 'Compliance & Governance'],
  ['security-center', 'Security Center'],
  ['administration', 'Administration'],
  ['developer-center', 'Developer Center'],
  ['system-monitoring', 'System Monitoring'],
  ['help-support', 'Help & Support'],
])

export default function ModulePage({ params }: { params: { module: string } }) {
  const label = modules.get(params.module)

  if (!label) {
    notFound()
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-header">
          <strong>CACSMS</strong>
          <span>Contents</span>
        </div>
      </aside>
      <main className="page-content">
        <h1>{label}</h1>
        <p>This is the module page for {label}.</p>
        <p>Select another module from the sidebar to continue.</p>
      </main>
    </div>
  )
}
