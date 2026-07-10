import type { NextRequest } from 'next/server'
import { apiDatabase, apiResponse } from '@/shared/api/apiResponse'
import { automationRulesService } from './services'
import type { AutomationRulesQuery } from './repositories'

function queryFromUrl(request: NextRequest): AutomationRulesQuery {
  const params = request.nextUrl.searchParams
  return {
    q: params.get('q') ?? undefined,
    status: params.get('status') ?? undefined,
    category: params.get('category') ?? undefined,
    triggerType: params.get('triggerType') ?? undefined,
    environment: params.get('environment') ?? undefined,
    owner: params.get('owner') ?? undefined,
    organization: params.get('organization') ?? undefined,
    priority: params.get('priority') ?? undefined,
    executionMode: params.get('executionMode') ?? undefined,
    conflictStatus: params.get('conflictStatus') ?? undefined,
    recoveryEnabled: params.get('recoveryEnabled') ?? undefined,
    humanEscalationEnabled: params.get('humanEscalationEnabled') ?? undefined,
  }
}

async function idFrom(context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  return id
}

async function disabled() {
  return apiResponse({ data: null, status: 'error', httpStatus: 405, message: 'Manual automation-rule mutations are disabled in autonomous build mode. Rules are observed from the database-backed automation engine until governed editing is explicitly enabled.' })
}

export const automationRulesController = {
  async dashboard(request: NextRequest) { return apiDatabase(await automationRulesService.dashboard(queryFromUrl(request)), 'Automation rules dashboard loaded.') },
  async summary() { return apiDatabase(await automationRulesService.summary(), 'Automation rules summary loaded.') },
  async categories() { return apiDatabase(await automationRulesService.categories(), 'Automation rule categories loaded.') },
  async get(_request: NextRequest, context: { params: Promise<{ id: string }> }) { return apiDatabase(await automationRulesService.get(await idFrom(context)), 'Automation rule loaded.') },
  async versions(_request: NextRequest, context: { params: Promise<{ id: string }> }) { return apiDatabase(await automationRulesService.versions(await idFrom(context)), 'Automation rule versions loaded.') },
  async executions(_request: NextRequest, context: { params: Promise<{ id: string }> }) { return apiDatabase(await automationRulesService.executions(await idFrom(context)), 'Automation rule executions loaded.') },
  async decisionTrace(_request: NextRequest, context: { params: Promise<{ id: string }> }) { return apiDatabase(await automationRulesService.decisionTrace(await idFrom(context)), 'Automation rule decision trace loaded.') },
  async validation(_request: NextRequest, context: { params: Promise<{ id: string }> }) { return apiDatabase(await automationRulesService.validation(await idFrom(context)), 'Automation rule validation loaded.') },
  async simulations(_request: NextRequest, context: { params: Promise<{ id: string }> }) { return apiDatabase(await automationRulesService.simulations(await idFrom(context)), 'Automation rule simulations loaded.') },
  async conflicts() { return apiDatabase(await automationRulesService.conflicts(), 'Automation rule conflicts loaded.') },
  async performance() { return apiDatabase(await automationRulesService.performance(), 'Automation rule performance loaded.') },
  async recommendations() { return apiDatabase(await automationRulesService.recommendations(), 'Automation rule recommendations loaded.') },
  async finalOutputImpact() { return apiDatabase(await automationRulesService.finalOutputImpact(), 'Automation rule final-output impact loaded.') },
  async stream() { return apiDatabase(automationRulesService.streamDescriptor(), 'Automation rules stream descriptor loaded.') },
  disabled,
}

export const AutomationRulesController = automationRulesController
export const AutomationRuleExecutionController = automationRulesController
export const AutomationRuleValidationController = automationRulesController
export const AutomationRuleSimulationController = automationRulesController
export const AutomationRuleConflictController = automationRulesController
export const AutomationRuleRecommendationController = automationRulesController
