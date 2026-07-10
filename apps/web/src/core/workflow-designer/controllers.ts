import type { NextRequest } from 'next/server'
import { apiDatabase, apiResponse } from '@/shared/api/apiResponse'
import { workflowDesignerService } from './services'

async function disabled() {
  return apiResponse({
    data: null,
    status: 'error',
    httpStatus: 405,
    message: 'Manual workflow designer mutations are disabled in autonomous mode. Workflow definitions are synchronized from database-backed system architecture until design editing is explicitly enabled.',
  })
}

async function idFrom(context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  return id
}

export const workflowDesignerController = {
  async dashboard(request: NextRequest) {
    return apiDatabase(await workflowDesignerService.dashboard(request.nextUrl.searchParams.get('definitionId') ?? undefined), 'Workflow designer loaded.')
  },
  async definitions() {
    return apiDatabase(await workflowDesignerService.definitions(), 'Workflow definitions loaded.')
  },
  async getDefinition(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
    return apiDatabase(await workflowDesignerService.definition(await idFrom(context)), 'Workflow definition loaded.')
  },
  async versions(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
    return apiDatabase(await workflowDesignerService.versions(await idFrom(context)), 'Workflow versions loaded.')
  },
  async canvas(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
    return apiDatabase(await workflowDesignerService.canvas(await idFrom(context)), 'Workflow canvas loaded.')
  },
  async nodeTypes() {
    return apiDatabase(await workflowDesignerService.nodeTypes(), 'Workflow node types loaded.')
  },
  async templates() {
    return apiDatabase(await workflowDesignerService.templates(), 'Workflow templates loaded.')
  },
  async validation(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
    return apiDatabase(await workflowDesignerService.validation(await idFrom(context)), 'Workflow validation loaded.')
  },
  async simulations(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
    return apiDatabase(await workflowDesignerService.simulations(await idFrom(context)), 'Workflow simulations loaded.')
  },
  async history(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
    return apiDatabase(await workflowDesignerService.history(await idFrom(context)), 'Workflow history loaded.')
  },
  async documentation(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
    return apiDatabase(await workflowDesignerService.documentation(await idFrom(context)), 'Workflow documentation loaded.')
  },
  async stream() {
    return apiDatabase(workflowDesignerService.streamDescriptor(), 'Workflow designer stream descriptor loaded.')
  },
  disabled,
}
