import { dashboardResponse } from '@/lib/apiResponse'

export async function GET() {
  return dashboardResponse('mock', {
    service: 'cacsms-contents',
    status: 'ok',
    uptime: process.uptime(),
  })
}
