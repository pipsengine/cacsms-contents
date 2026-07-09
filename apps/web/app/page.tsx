import { AppShell } from '@/components/layout/AppShell'
import { LandingDashboard } from '@/components/landing/LandingDashboard'

export default function HomePage() {
  return (
    <AppShell showTopbar={false} sidebarVariant="landing">
      <LandingDashboard />
    </AppShell>
  )
}
