import type { NextRequest } from 'next/server'
import { apiDatabase, apiResponse } from '@/shared/api/apiResponse'
import { autonomousLearningService } from './services'
import type { LearningQuery } from './repositories'

function queryFromUrl(request: NextRequest): LearningQuery {
  const p = request.nextUrl.searchParams
  return { q: p.get('q') ?? undefined, domain: p.get('domain') ?? undefined, status: p.get('status') ?? undefined, severity: p.get('severity') ?? undefined, type: p.get('type') ?? undefined }
}

async function disabled() {
  return apiResponse({ data: null, status: 'error', httpStatus: 405, message: 'Autonomous Learning Engine mutations are disabled in build mode. Learning cycles, recommendations, simulations, experiments, deployments, rollbacks, model retraining, drift resolution, reports, documentation, and emergency controls run through governed autonomous-learning jobs.' })
}

export const autonomousLearningController = {
  async dashboard(request: NextRequest) { return apiDatabase(await autonomousLearningService.dashboard(queryFromUrl(request)), 'Autonomous learning dashboard loaded.') },
  async summary() { return apiDatabase(await autonomousLearningService.summary(), 'Autonomous learning summary loaded.') },
  async status() { return apiDatabase(await autonomousLearningService.status(), 'Autonomous learning status loaded.') },
  async domains() { return apiDatabase(await autonomousLearningService.domains(), 'Learning domains loaded.') },
  async signals(request: NextRequest) { return apiDatabase(await autonomousLearningService.signals(queryFromUrl(request)), 'Learning signals loaded.') },
  async insights(request: NextRequest) { return apiDatabase(await autonomousLearningService.insights(queryFromUrl(request)), 'Learning insights loaded.') },
  async recommendations(request: NextRequest) { return apiDatabase(await autonomousLearningService.recommendations(queryFromUrl(request)), 'Learning recommendations loaded.') },
  async experiments() { return apiDatabase(await autonomousLearningService.experiments(), 'Learning experiments loaded.') },
  async improvements() { return apiDatabase(await autonomousLearningService.improvements(), 'Learning improvements loaded.') },
  async rollbacks() { return apiDatabase(await autonomousLearningService.rollbacks(), 'Learning rollbacks loaded.') },
  async patterns() { return apiDatabase(await autonomousLearningService.patterns(), 'Learning patterns loaded.') },
  async sourceMatrix() { return apiDatabase(await autonomousLearningService.sourceMatrix(), 'Learning source matrix loaded.') },
  async businessImpact() { return apiDatabase(await autonomousLearningService.businessImpact(), 'Learning business impact loaded.') },
  async finalOutput() { return apiDatabase(await autonomousLearningService.finalOutput(), 'Learning final-output traceability loaded.') },
  async drift() { return apiDatabase(await autonomousLearningService.drift(), 'Learning drift loaded.') },
  async models() { return apiDatabase(await autonomousLearningService.models(), 'Learning models loaded.') },
  async memory() { return apiDatabase(await autonomousLearningService.memory(), 'Learning memory loaded.') },
  async stream() { return apiDatabase(autonomousLearningService.streamDescriptor(), 'Autonomous learning stream descriptor loaded.') },
  disabled,
}

export const AutonomousLearningController = autonomousLearningController
