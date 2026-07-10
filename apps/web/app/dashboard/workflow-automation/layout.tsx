import { PageGuard } from '@/components/auth/PageGuard'
import { AppShell } from '@/components/layout/AppShell'

export default function DashboardWorkflowAutomationLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell showTopbar={false}>
      <PageGuard permission="workflow.view">{children}</PageGuard>
    </AppShell>
  )
}
