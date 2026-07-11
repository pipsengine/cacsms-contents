import { PageGuard } from '@/components/auth/PageGuard'
import { AppShell } from '@/components/layout/AppShell'

export default function DashboardAIAgentsLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell showTopbar={false}>
      <PageGuard permission="ai_agent_registry.view">{children}</PageGuard>
    </AppShell>
  )
}
