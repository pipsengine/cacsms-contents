import type { NextRequest } from 'next/server'
import { apiDatabase, apiResponse } from '@/shared/api/apiResponse'
import { modelProviderService } from './services'
import type { ModelProviderQuery } from './repositories'

function queryFromUrl(request: NextRequest): ModelProviderQuery {
  const p = request.nextUrl.searchParams
  return { q: p.get('q') ?? undefined, providerType: p.get('providerType') ?? undefined, providerStatus: p.get('providerStatus') ?? undefined, modelFamily: p.get('modelFamily') ?? undefined, modelStatus: p.get('modelStatus') ?? undefined, modality: p.get('modality') ?? undefined, finalOutput: p.get('finalOutput') ?? undefined }
}
async function idFrom(context: { params: Promise<{ id: string }> }) { return (await context.params).id }
async function disabled() { return apiResponse({ data: null, status: 'error', httpStatus: 405, message: 'Model and provider mutations are disabled in autonomous build mode. Registration, validation, benchmarking, routing recalculation, failover, circuit-breaker, credentials, and emergency actions run through governed ai-model-provider-operations jobs.' }) }

export const modelProviderController = {
  async dashboard(request: NextRequest) { return apiDatabase(await modelProviderService.dashboard(queryFromUrl(request)), 'Model and provider management dashboard loaded.') },
  async summary() { return apiDatabase(await modelProviderService.summary(), 'AI provider summary loaded.') },
  async providers(request: NextRequest) { return apiDatabase(await modelProviderService.providers(queryFromUrl(request)), 'AI providers loaded.') },
  async provider(_request: NextRequest, context: { params: Promise<{ id: string }> }) { return apiDatabase(await modelProviderService.provider(await idFrom(context)), 'AI provider detail loaded.') },
  async models(request: NextRequest) { return apiDatabase(await modelProviderService.models(queryFromUrl(request)), 'AI models loaded.') },
  async model(_request: NextRequest, context: { params: Promise<{ id: string }> }) { return apiDatabase(await modelProviderService.model(await idFrom(context)), 'AI model detail loaded.') },
  async policies() { return apiDatabase(await modelProviderService.policies(), 'AI model routing policies loaded.') },
  async decisions() { return apiDatabase(await modelProviderService.decisions(), 'AI model routing decisions loaded.') },
  async failovers() { return apiDatabase(await modelProviderService.failovers(), 'AI model failovers loaded.') },
  async circuitBreakers() { return apiDatabase(await modelProviderService.circuitBreakers(), 'AI model circuit breakers loaded.') },
  async recommendations() { return apiDatabase(await modelProviderService.recommendations(), 'AI model routing recommendations loaded.') },
  async finalOutputImpact() { return apiDatabase(await modelProviderService.finalOutputImpact(), 'AI model final-output impact loaded.') },
  async deprecations() { return apiDatabase(await modelProviderService.deprecations(), 'AI model deprecations loaded.') },
  async benchmarks() { return apiDatabase(await modelProviderService.benchmarks(), 'AI model benchmarks loaded.') },
  async stream() { return apiDatabase(modelProviderService.streamDescriptor(), 'AI model routing stream descriptor loaded.') },
  disabled,
}

export const ModelProviderController = modelProviderController
