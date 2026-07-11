import { AppShell } from '@/components/layout/AppShell'

export default function SystemMonitoringLayout({ children }: { children: React.ReactNode }) {
  return <AppShell showTopbar={false} sidebarVariant="landing">{children}</AppShell>
}
