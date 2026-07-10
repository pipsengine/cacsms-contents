import { apiDatabase } from '@/shared/api/apiResponse'

export async function GET() {
  return apiDatabase({
    service: 'cacsms-contents',
    status: 'ok',
    uptime: process.uptime(),
  }, 'Application process health loaded.')
}
