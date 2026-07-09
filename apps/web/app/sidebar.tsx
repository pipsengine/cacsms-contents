import Link from 'next/link'

const modules = [
  { id: 'executive-office', label: 'Executive Office' },
  { id: 'organization-management', label: 'Organization Management' },
  { id: 'brand-management', label: 'Brand Management' },
  { id: 'channel-management', label: 'Channel Management' },
  { id: 'research-intelligence', label: 'Research Intelligence' },
  { id: 'content-strategy', label: 'Content Strategy' },
  { id: 'content-production', label: 'Content Production' },
  { id: 'creative-studio', label: 'Creative Studio' },
  { id: 'video-studio', label: 'Video Studio' },
  { id: 'audio-voice-studio', label: 'Audio & Voice Studio' },
  { id: 'seo-intelligence', label: 'SEO Intelligence' },
  { id: 'publishing-center', label: 'Publishing Center' },
  { id: 'marketing-automation', label: 'Marketing Automation' },
  { id: 'community-management', label: 'Community Management' },
  { id: 'monetization-center', label: 'Monetization Center' },
  { id: 'analytics-intelligence', label: 'Analytics & Intelligence' },
  { id: 'ai-learning-center', label: 'AI Learning Center' },
  { id: 'ai-agents', label: 'AI Agents' },
  { id: 'workflow-automation', label: 'Workflow Automation' },
  { id: 'digital-asset-management', label: 'Digital Asset Management' },
  { id: 'knowledge-hub', label: 'Knowledge Hub' },
  { id: 'integrations', label: 'Integrations' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'reports', label: 'Reports' },
  { id: 'compliance-governance', label: 'Compliance & Governance' },
  { id: 'security-center', label: 'Security Center' },
  { id: 'administration', label: 'Administration' },
  { id: 'developer-center', label: 'Developer Center' },
  { id: 'system-monitoring', label: 'System Monitoring' },
  { id: 'help-support', label: 'Help & Support' },
]

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <strong>CACSMS</strong>
        <span>Contents</span>
      </div>
      <nav className="sidebar-nav" aria-label="Primary">
        <ul>
          {modules.map((module) => (
            <li key={module.id}>
              <Link href={`/${module.id}`} className="sidebar-link">
                {module.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}
