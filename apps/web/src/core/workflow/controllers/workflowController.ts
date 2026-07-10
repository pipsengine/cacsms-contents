import type { NextRequest } from 'next/server'
import { apiDatabase, apiResponse } from '@/shared/api/apiResponse'
import { requireWorkflowPermission } from '../policies/workflowPermissionPolicy'
import { workflowExecutionService } from '../services/workflowExecutionService'

function bodyUser(body: Record<string, unknown>) {
  return typeof body.requestedBy === 'string' ? body.requestedBy : 'dashboard'
}

function disabledManualControl(message: string) {
  return apiResponse({ data: null, status: 'error', httpStatus: 405, message })
}

export const workflowController = {
  async listDefinitions() {
    return apiDatabase(await workflowExecutionService.listDefinitions(), 'Workflow definitions loaded.')
  },

  async listInstances() {
    return apiDatabase(await workflowExecutionService.listInstances(), 'Workflow instances loaded.')
  },

  async getInstance(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params
    return apiDatabase(await workflowExecutionService.getSnapshot(id), 'Workflow instance loaded.')
  },

  async createInstance(request: NextRequest) {
    requireWorkflowPermission(request, 'workflow.create')
    const body = (await request.json()) as Record<string, unknown>
    const snapshot = await workflowExecutionService.createAndStart({
      workflowCode: String(body.workflowCode),
      referenceType: body.referenceType ? String(body.referenceType) : undefined,
      referenceId: body.referenceId ? String(body.referenceId) : undefined,
      context: typeof body.context === 'object' && body.context ? (body.context as Record<string, unknown>) : undefined,
      requestedBy: bodyUser(body),
    })
    return apiResponse({ data: snapshot, message: 'Workflow instance created.', httpStatus: 201 })
  },

  async pause(_request: NextRequest, context: { params: Promise<{ instanceId: string }> }) {
    requireWorkflowPermission(_request, 'workflow.pause')
    await context.params
    return disabledManualControl('Manual workflow pause is disabled. The only operator controls are Start and Stop.')
  },

  async resume(_request: NextRequest, context: { params: Promise<{ instanceId: string }> }) {
    requireWorkflowPermission(_request, 'workflow.resume')
    await context.params
    return disabledManualControl('Manual workflow resume is disabled. The only operator controls are Start and Stop.')
  },

  async stop(_request: NextRequest, context: { params: Promise<{ instanceId: string }> }) {
    requireWorkflowPermission(_request, 'workflow.cancel')
    const { instanceId } = await context.params
    return apiDatabase(await workflowExecutionService.transition(instanceId, 'stopped', 'stopped'), 'Workflow stopped.')
  },

  async cancel(_request: NextRequest, context: { params: Promise<{ instanceId: string }> }) {
    requireWorkflowPermission(_request, 'workflow.cancel')
    await context.params
    return disabledManualControl('Manual workflow cancel is disabled. Use Stop for operator shutdown.')
  },

  async retry(_request: NextRequest, context: { params: Promise<{ instanceId: string }> }) {
    requireWorkflowPermission(_request, 'workflow.retry')
    await context.params
    return disabledManualControl('Manual workflow retry is disabled. Start a new autonomous workflow instead.')
  },
}
