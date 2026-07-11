import type { NextRequest } from 'next/server'
import { apiDatabase, apiResponse } from '@/shared/api/apiResponse'
import { toolRegistryService } from './services'
import type { ToolRegistryQuery } from './repositories'

function queryFromUrl(request: NextRequest): ToolRegistryQuery {
  const p = request.nextUrl.searchParams
  return { q: p.get('q') ?? undefined, category: p.get('category') ?? undefined, toolType: p.get('toolType') ?? undefined, status: p.get('status') ?? undefined, scope: p.get('scope') ?? undefined, environment: p.get('environment') ?? undefined, credential: p.get('credential') ?? undefined, sensitive: p.get('sensitive') ?? undefined, finalOutput: p.get('finalOutput') ?? undefined }
}
async function idFrom(context: { params: Promise<{ id: string }> }) { return (await context.params).id }
async function disabled() { return apiResponse({ data: null, status: 'error', httpStatus: 405, message: 'Tool Registry mutations are disabled in autonomous build mode. Registration, validation, testing, simulation, recovery, fallback, circuit-breaker, credential, and emergency operations run through governed ai-tool-operations jobs.' }) }

export const toolRegistryController = {
  async dashboard(request: NextRequest) { return apiDatabase(await toolRegistryService.dashboard(queryFromUrl(request)), 'Tool registry dashboard loaded.') },
  async summary() { return apiDatabase(await toolRegistryService.summary(), 'Tool registry summary loaded.') },
  async tools(request: NextRequest) { return apiDatabase(await toolRegistryService.tools(queryFromUrl(request)), 'AI tools loaded.') },
  async get(_request: NextRequest, context: { params: Promise<{ id: string }> }) { return apiDatabase(await toolRegistryService.detail(await idFrom(context)), 'AI tool detail loaded.') },
  async categories() { return apiDatabase(await toolRegistryService.categories(), 'AI tool categories loaded.') },
  async activeCalls() { return apiDatabase(await toolRegistryService.activeCalls(), 'AI tool active calls loaded.') },
  async deprecations() { return apiDatabase(await toolRegistryService.deprecations(), 'AI tool deprecations loaded.') },
  async recommendations() { return apiDatabase(await toolRegistryService.recommendations(), 'AI tool recommendations loaded.') },
  async security() { return apiDatabase(await toolRegistryService.security(), 'AI tool security loaded.') },
  async finalOutputImpact() { return apiDatabase(await toolRegistryService.finalOutputImpact(), 'AI tool final-output impact loaded.') },
  async stream() { return apiDatabase(toolRegistryService.streamDescriptor(), 'AI tool stream descriptor loaded.') },
  disabled,
}

export const ToolRegistryController = toolRegistryController
