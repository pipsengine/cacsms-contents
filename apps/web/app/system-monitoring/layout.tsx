import { AppShell } from '@/components/layout/AppShell'

export default function SystemMonitoringLayout({ children }: { children: React.ReactNode }) {
  return <AppShell showTopbar={false}>{children}</AppShell>
}
