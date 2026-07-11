import type { NextRequest } from 'next/server'
import { apiDatabase, apiResponse } from '@/shared/api/apiResponse'
import { agentCapabilitiesService } from './services'
import type { AgentCapabilitiesQuery } from './repositories'

function queryFromUrl(request: NextRequest): AgentCapabilitiesQuery {
  const params = request.nextUrl.searchParams
  return { q: params.get('q') ?? undefined, domain: params.get('domain') ?? undefined, status: params.get('status') ?? undefined, validationStatus: params.get('validationStatus') ?? undefined, organizationScope: params.get('organizationScope') ?? undefined, provider: params.get('provider') ?? undefined, model: params.get('model') ?? undefined, tool: params.get('tool') ?? undefined, assignedAgent: params.get('assignedAgent') ?? undefined, memoryRequired: params.get('memoryRequired') ?? undefined, ragRequired: params.get('ragRequired') ?? undefined, finalOutputLinked: params.get('finalOutputLinked') ?? undefined, healthRange: params.get('healthRange') ?? undefined }
}

async function idFrom(context: { params: Promise<{ id: string }> }) { return (await context.params).id }
async function disabled() { return apiResponse({ data: null, status: 'error', httpStatus: 405, message: 'Agent capability mutations are disabled in autonomous build mode. Creation, validation, testing, simulation, publishing, optimization, deprecation, and governance changes run through governed agent-capabilities jobs.' }) }

export const agentCapabilitiesController = {
  async dashboard(request: NextRequest) { return apiDatabase(await agentCapabilitiesService.dashboard(queryFromUrl(request)), 'Agent capabilities dashboard loaded.') },
  async summary() { return apiDatabase(await agentCapabilitiesService.summary(), 'Agent capabilities summary loaded.') },
  async list(request: NextRequest) { return apiDatabase(await agentCapabilitiesService.list(queryFromUrl(request)), 'Agent capabilities loaded.') },
  async domains() { return apiDatabase(await agentCapabilitiesService.domains(), 'Agent capability domains loaded.') },
  async health() { return apiDatabase(await agentCapabilitiesService.health(), 'Agent capability health loaded.') },
  async assignments() { return apiDatabase(await agentCapabilitiesService.assignments(), 'Agent capability assignments loaded.') },
  async workflowUsage() { return apiDatabase(await agentCapabilitiesService.workflowUsage(), 'Agent capability workflow usage loaded.') },
  async providerModels() { return apiDatabase(await agentCapabilitiesService.providerModels(), 'Agent capability provider models loaded.') },
  async tools() { return apiDatabase(await agentCapabilitiesService.tools(), 'Agent capability tools loaded.') },
  async memoryRag() { return apiDatabase(await agentCapabilitiesService.memoryRag(), 'Agent capability memory and RAG loaded.') },
  async validations() { return apiDatabase(await agentCapabilitiesService.validations(), 'Agent capability validations loaded.') },
  async tests() { return apiDatabase(await agentCapabilitiesService.tests(), 'Agent capability tests loaded.') },
  async overlaps() { return apiDatabase(await agentCapabilitiesService.overlaps(), 'Agent capability overlaps loaded.') },
  async recommendations() { return apiDatabase(await agentCapabilitiesService.recommendations(), 'Agent capability recommendations loaded.') },
  async finalOutputLinkage() { return apiDatabase(await agentCapabilitiesService.finalOutputLinkage(), 'Agent capability final-output linkage loaded.') },
  async get(_request: NextRequest, context: { params: Promise<{ id: string }> }) { return apiDatabase(await agentCapabilitiesService.get(await idFrom(context)), 'Agent capability detail loaded.') },
  async versions(_request: NextRequest, context: { params: Promise<{ id: string }> }) { return apiDatabase(await agentCapabilitiesService.versions(await idFrom(context)), 'Agent capability versions loaded.') },
  async assignmentsForCapability(_request: NextRequest, context: { params: Promise<{ id: string }> }) { return apiDatabase(await agentCapabilitiesService.assignmentsForCapability(await idFrom(context)), 'Agent capability assignments loaded.') },
  async workflowUsageForCapability(_request: NextRequest, context: { params: Promise<{ id: string }> }) { return apiDatabase(await agentCapabilitiesService.workflowUsageForCapability(await idFrom(context)), 'Agent capability workflow usage loaded.') },
  async providerModelsForCapability(_request: NextRequest, context: { params: Promise<{ id: string }> }) { return apiDatabase(await agentCapabilitiesService.providerModelsForCapability(await idFrom(context)), 'Agent capability provider model mappings loaded.') },
  async toolsForCapability(_request: NextRequest, context: { params: Promise<{ id: string }> }) { return apiDatabase(await agentCapabilitiesService.toolsForCapability(await idFrom(context)), 'Agent capability tool requirements loaded.') },
  async memoryRagForCapability(_request: NextRequest, context: { params: Promise<{ id: string }> }) { return apiDatabase(await agentCapabilitiesService.memoryRagForCapability(await idFrom(context)), 'Agent capability memory and RAG loaded.') },
  async validationForCapability(_request: NextRequest, context: { params: Promise<{ id: string }> }) { return apiDatabase(await agentCapabilitiesService.validationsForCapability(await idFrom(context)), 'Agent capability validation loaded.') },
  async testsForCapability(_request: NextRequest, context: { params: Promise<{ id: string }> }) { return apiDatabase(await agentCapabilitiesService.testsForCapability(await idFrom(context)), 'Agent capability tests loaded.') },
  async finalOutputForCapability(_request: NextRequest, context: { params: Promise<{ id: string }> }) { return apiDatabase(await agentCapabilitiesService.finalOutputForCapability(await idFrom(context)), 'Agent capability final-output linkage loaded.') },
  async stream() { return apiDatabase(agentCapabilitiesService.streamDescriptor(), 'Agent capabilities stream descriptor loaded.') },
  disabled,
}

export const AgentCapabilitiesController = agentCapabilitiesController
