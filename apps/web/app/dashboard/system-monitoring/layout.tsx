import { AppShell } from '@/components/layout/AppShell'
import { PageGuard } from '@/components/auth/PageGuard'

export default function DashboardSystemMonitoringLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell showTopbar={false}>
      <PageGuard permission="system_monitoring.view">{children}</PageGuard>
    </AppShell>
  )
}
