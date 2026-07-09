import { activityAuditController } from '@/api/controllers/activityAuditController'

export async function POST(request: Request) {
  return activityAuditController.create(request)
}

