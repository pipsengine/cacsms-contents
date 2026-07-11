import type { NextRequest } from 'next/server'
import { apiDatabase, apiResponse } from '@/shared/api/apiResponse'
import { evaluationBenchmarkingService } from './services'
import type { EvaluationQuery } from './repositories'

function queryFromUrl(request: NextRequest): EvaluationQuery {
  const p = request.nextUrl.searchParams
  return { q: p.get('q') ?? undefined, type: p.get('type') ?? undefined, status: p.get('status') ?? undefined, certification: p.get('certification') ?? undefined, category: p.get('category') ?? undefined }
}

async function disabled() {
  return apiResponse({ data: null, status: 'error', httpStatus: 405, message: 'Evaluation & Benchmarking mutations are disabled in autonomous build mode. Evaluations, benchmarks, regression tests, safety tests, security tests, golden dataset tests, canaries, certifications, and reports run through governed evaluation-operations jobs.' })
}

export const evaluationBenchmarkingController = {
  async dashboard(request: NextRequest) { return apiDatabase(await evaluationBenchmarkingService.dashboard(queryFromUrl(request)), 'Evaluation benchmarking dashboard loaded.') },
  async summary() { return apiDatabase(await evaluationBenchmarkingService.summary(), 'Evaluation summary loaded.') },
  async components(request: NextRequest) { return apiDatabase(await evaluationBenchmarkingService.components(queryFromUrl(request)), 'AI components loaded.') },
  async benchmarks(request: NextRequest) { return apiDatabase(await evaluationBenchmarkingService.benchmarks(queryFromUrl(request)), 'AI benchmarks loaded.') },
  async goldenDatasets() { return apiDatabase(await evaluationBenchmarkingService.goldenDatasets(), 'Golden datasets loaded.') },
  async certifications() { return apiDatabase(await evaluationBenchmarkingService.certifications(), 'Certifications loaded.') },
  async recommendations() { return apiDatabase(await evaluationBenchmarkingService.recommendations(), 'Evaluation recommendations loaded.') },
  async leaderboards() { return apiDatabase(await evaluationBenchmarkingService.leaderboards(), 'Evaluation leaderboards loaded.') },
  async finalOutputScores() { return apiDatabase(await evaluationBenchmarkingService.finalOutputScores(), 'Final output scores loaded.') },
  async safetyTests() { return apiDatabase(await evaluationBenchmarkingService.safetyTests(), 'Safety tests loaded.') },
  async securityTests() { return apiDatabase(await evaluationBenchmarkingService.securityTests(), 'Security tests loaded.') },
  async regressionTests() { return apiDatabase(await evaluationBenchmarkingService.regressionTests(), 'Regression tests loaded.') },
  async stream() { return apiDatabase(evaluationBenchmarkingService.streamDescriptor(), 'Evaluation stream descriptor loaded.') },
  disabled,
}

export const EvaluationBenchmarkingController = evaluationBenchmarkingController
