import { apiDatabase, apiResponse } from '@/shared/api/apiResponse'
import { sessionService, type AuditActivityInput } from '@/services/sessionService'

export const activityAuditController = {
  async create(request: Request) {
    try {
      const body = (await request.json()) as AuditActivityInput
      const payload = await sessionService.logActivity({
        ...body,
        ipAddress: request.headers.get('x-forwarded-for') ?? body.ipAddress,
        userAgent: request.headers.get('user-agent') ?? body.userAgent,
      })
      return apiDatabase(payload, 'Audit activity accepted with live session context.')
    } catch {
      return apiResponse({
        data: null,
        message: 'Invalid audit activity payload.',
        status: 'error',
        httpStatus: 400,
      })
    }
  },
}
