import type { NextRequest } from 'next/server'
import { apiDatabase, apiResponse } from '@/shared/api/apiResponse'
import { memoryManagementService } from './services'
import type { MemoryQuery } from './repositories'

function queryFromUrl(request: NextRequest): MemoryQuery {
  const p = request.nextUrl.searchParams
  return { q: p.get('q') ?? undefined, category: p.get('category') ?? undefined, status: p.get('status') ?? undefined, scope: p.get('scope') ?? undefined, classification: p.get('classification') ?? undefined, finalOutput: p.get('finalOutput') ?? undefined }
}
async function idFrom(context: { params: Promise<{ id: string }> }) { return (await context.params).id }
async function disabled() { return apiResponse({ data: null, status: 'error', httpStatus: 405, message: 'Memory Management mutations are disabled in autonomous build mode. Create, validate, embed, reindex, optimize, recover, and synchronize operations run through governed ai-memory-operations jobs.' }) }

export const memoryManagementController = {
  async dashboard(request: NextRequest) { return apiDatabase(await memoryManagementService.dashboard(queryFromUrl(request)), 'Memory management dashboard loaded.') },
  async summary() { return apiDatabase(await memoryManagementService.summary(), 'Memory summary loaded.') },
  async list(request: NextRequest) { return apiDatabase(await memoryManagementService.list(queryFromUrl(request)), 'Memory records loaded.') },
  async get(_request: NextRequest, context: { params: Promise<{ id: string }> }) { return apiDatabase(await memoryManagementService.detail(await idFrom(context)), 'Memory detail loaded.') },
  async search(request: NextRequest) { return apiDatabase(await memoryManagementService.list(queryFromUrl(request)), 'Memory search loaded.') },
  async retrieval() { return apiDatabase(await memoryManagementService.retrieval(), 'Memory retrieval loaded.') },
  async analytics() { return apiDatabase(await memoryManagementService.analytics(), 'Memory analytics loaded.') },
  async finalOutput() { return apiDatabase(await memoryManagementService.finalOutput(), 'Memory final-output linkage loaded.') },
  async stream() { return apiDatabase(memoryManagementService.streamDescriptor(), 'Memory stream descriptor loaded.') },
  disabled,
}

export const MemoryManagementController = memoryManagementController
