import type { NextRequest } from 'next/server'
import { apiDatabase, apiResponse } from '@/shared/api/apiResponse'
import { promptsService } from './services'
import type { PromptsQuery } from './repositories'

function queryFromUrl(request: NextRequest): PromptsQuery {
  const p = request.nextUrl.searchParams
  return { q: p.get('q') ?? undefined, category: p.get('category') ?? undefined, status: p.get('status') ?? undefined, provider: p.get('provider') ?? undefined, model: p.get('model') ?? undefined, finalOutput: p.get('finalOutput') ?? undefined, security: p.get('security') ?? undefined }
}
async function idFrom(context: { params: Promise<{ id: string }> }) { return (await context.params).id }
async function disabled() { return apiResponse({ data: null, status: 'error', httpStatus: 405, message: 'Prompt mutations are disabled in autonomous build mode. Create, validate, test, simulate, optimize, deploy, rollback, and generate actions run through governed prompt-management jobs.' }) }

export const promptsController = {
  async dashboard(request: NextRequest) { return apiDatabase(await promptsService.dashboard(queryFromUrl(request)), 'Prompt management dashboard loaded.') },
  async list(request: NextRequest) { return apiDatabase(await promptsService.dashboard(queryFromUrl(request)), 'Prompt management dashboard loaded.') },
  async get(_request: NextRequest, context: { params: Promise<{ id: string }> }) { return apiDatabase(await promptsService.get(await idFrom(context)), 'Prompt detail loaded.') },
  async analytics() { return apiDatabase(await promptsService.analytics(), 'Prompt analytics loaded.') },
  async tests() { return apiDatabase(await promptsService.tests(), 'Prompt tests loaded.') },
  async versions() { return apiDatabase(await promptsService.versions(), 'Prompt versions loaded.') },
  async finalOutput() { return apiDatabase(await promptsService.finalOutput(), 'Prompt final-output linkage loaded.') },
  async stream() { return apiDatabase(promptsService.streamDescriptor(), 'Prompt stream descriptor loaded.') },
  disabled,
}

export const PromptsController = promptsController
