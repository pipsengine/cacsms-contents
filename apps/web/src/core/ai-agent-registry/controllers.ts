import type { NextRequest } from 'next/server'
import { apiDatabase, apiResponse } from '@/shared/api/apiResponse'
import { aiAgentRegistryService } from './services'
import type { AIAgentRegistryQuery } from './repositories'

function queryFromUrl(request: NextRequest): AIAgentRegistryQuery {
  const params = request.nextUrl.searchParams
  return { q: params.get('q') ?? undefined, domain: params.get('domain') ?? undefined, scope: params.get('scope') ?? undefined, status: params.get('status') ?? undefined, validationStatus: params.get('validationStatus') ?? undefined, environment: params.get('environment') ?? undefined, provider: params.get('provider') ?? undefined, model: params.get('model') ?? undefined, memoryEnabled: params.get('memoryEnabled') ?? undefined, ragEnabled: params.get('ragEnabled') ?? undefined, finalOutputLinked: params.get('finalOutputLinked') ?? undefined, owner: params.get('owner') ?? undefined, organization: params.get('organization') ?? undefined, healthRange: params.get('healthRange') ?? undefined }
}
async function idFrom(context: { params: Promise<{ id: string }> }) { return (await context.params).id }
async function disabled() { return apiResponse({ data: null, status: 'error', httpStatus: 405, message: 'AI agent registry mutations are disabled in autonomous build mode. Registration, validation, tests, publication, enablement, deprecation, overlap resolution, documentation, and governance changes run through governed ai-agent-registry jobs.' }) }

export const aiAgentRegistryController = {
  async dashboard(request: NextRequest) { return apiDatabase(await aiAgentRegistryService.dashboard(queryFromUrl(request)), 'AI agent registry dashboard loaded.') },
  async summary() { return apiDatabase(await aiAgentRegistryService.summary(), 'AI agent registry summary loaded.') },
  async domains() { return apiDatabase(await aiAgentRegistryService.domains(), 'AI agent domains loaded.') },
  async capabilities() { return apiDatabase(await aiAgentRegistryService.capabilities(), 'AI agent capabilities loaded.') },
  async get(_request: NextRequest, context: { params: Promise<{ id: string }> }) { return apiDatabase(await aiAgentRegistryService.get(await idFrom(context)), 'AI agent registry detail loaded.') },
  async versions(_request: NextRequest, context: { params: Promise<{ id: string }> }) { return apiDatabase(await aiAgentRegistryService.versions(await idFrom(context)), 'AI agent versions loaded.') },
  async validation(_request: NextRequest, context: { params: Promise<{ id: string }> }) { return apiDatabase(await aiAgentRegistryService.validation(await idFrom(context)), 'AI agent validation loaded.') },
  async tests(_request: NextRequest, context: { params: Promise<{ id: string }> }) { return apiDatabase(await aiAgentRegistryService.tests(await idFrom(context)), 'AI agent tests loaded.') },
  async workflowMappings(_request: NextRequest, context: { params: Promise<{ id: string }> }) { return apiDatabase(await aiAgentRegistryService.workflowMappingsForAgent(await idFrom(context)), 'AI agent workflow mappings loaded.') },
  async toolPermissions(_request: NextRequest, context: { params: Promise<{ id: string }> }) { return apiDatabase(await aiAgentRegistryService.toolPermissionsForAgent(await idFrom(context)), 'AI agent tool permissions loaded.') },
  async providerModelMappings(_request: NextRequest, context: { params: Promise<{ id: string }> }) { return apiDatabase(await aiAgentRegistryService.providerModelMappingsForAgent(await idFrom(context)), 'AI agent provider and model mappings loaded.') },
  async prompt(_request: NextRequest, context: { params: Promise<{ id: string }> }) { return apiDatabase(await aiAgentRegistryService.prompt(await idFrom(context)), 'AI agent prompt loaded.') },
  async memoryRag(_request: NextRequest, context: { params: Promise<{ id: string }> }) { return apiDatabase(await aiAgentRegistryService.memoryRag(await idFrom(context)), 'AI agent memory and RAG loaded.') },
  async dependencies(_request: NextRequest, context: { params: Promise<{ id: string }> }) { return apiDatabase(await aiAgentRegistryService.dependencies(await idFrom(context)), 'AI agent dependencies loaded.') },
  async impact(_request: NextRequest, context: { params: Promise<{ id: string }> }) { return apiDatabase(await aiAgentRegistryService.impact(await idFrom(context)), 'AI agent impact loaded.') },
  async overlaps() { return apiDatabase(await aiAgentRegistryService.overlaps(), 'AI agent overlap analysis loaded.') },
  async orphans() { return apiDatabase(await aiAgentRegistryService.orphans(), 'AI agent orphans loaded.') },
  async health() { return apiDatabase(await aiAgentRegistryService.health(), 'AI agent registry health loaded.') },
  async recommendations() { return apiDatabase(await aiAgentRegistryService.recommendations(), 'AI agent registry recommendations loaded.') },
  async finalOutputLinkage() { return apiDatabase(await aiAgentRegistryService.finalOutputLinkage(), 'AI agent final-output linkage loaded.') },
  async stream() { return apiDatabase(aiAgentRegistryService.streamDescriptor(), 'AI agent registry stream descriptor loaded.') },
  disabled,
}

export const AIAgentRegistryController = aiAgentRegistryController
export const AIAgentRegistrationController = aiAgentRegistryController
export const AIAgentValidationController = aiAgentRegistryController
export const AIAgentTestController = aiAgentRegistryController
export const AIAgentMappingController = aiAgentRegistryController
export const AIAgentRecommendationController = aiAgentRegistryController
export const AIAgentGovernanceController = aiAgentRegistryController
