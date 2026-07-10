import type { NextRequest } from 'next/server'
import { apiDatabase, apiResponse } from '@/shared/api/apiResponse'
import { requireWorkflowPermission } from '@/core/workflow/policies/workflowPermissionPolicy'
import { systemControlService } from '../services/systemControlService'

async function requestedBy(request: NextRequest) {
  try {
    const body = (await request.json()) as { requestedBy?: string; instanceId?: string }
    return { requestedBy: body.requestedBy ?? 'dashboard', instanceId: body.instanceId }
  } catch {
    return { requestedBy: 'dashboard', instanceId: undefined }
  }
}

function disabledManualControl(message: string) {
  return apiResponse({ data: null, status: 'error', httpStatus: 405, message })
}

export const systemControlController = {
  async start(request: NextRequest) {
    requireWorkflowPermission(request, 'system.start')
    const body = await requestedBy(request)
    return apiDatabase(await systemControlService.start(body.requestedBy), 'System startup workflow queued.')
  },

  async stop(request: NextRequest) {
    requireWorkflowPermission(request, 'system.stop')
    const body = await requestedBy(request)
    return apiDatabase(await systemControlService.stop(body.requestedBy), 'System shutdown workflow queued.')
  },

  async pause(request: NextRequest) {
    requireWorkflowPermission(request, 'system.pause')
    await requestedBy(request)
    return disabledManualControl('Manual system pause is disabled. The only operator controls are Start and Stop.')
  },

  async resume(request: NextRequest) {
    requireWorkflowPermission(request, 'system.resume')
    await requestedBy(request)
    return disabledManualControl('Manual system resume is disabled. The only operator controls are Start and Stop.')
  },

  async status() {
    return apiDatabase(await systemControlService.status(), 'System status loaded.')
  },
}
