import type { NextRequest } from 'next/server'
import { apiDatabase, apiResponse } from '@/shared/api/apiResponse'
import { ragManagementService } from './services'
import type { RagQuery } from './repositories'

function queryFromUrl(request: NextRequest): RagQuery {
  const p = request.nextUrl.searchParams
  return { q: p.get('q') ?? undefined, category: p.get('category') ?? undefined, scope: p.get('scope') ?? undefined, status: p.get('status') ?? undefined, retrievalMode: p.get('retrievalMode') ?? undefined, retriever: p.get('retriever') ?? undefined, embeddingModel: p.get('embeddingModel') ?? undefined, vectorCollection: p.get('vectorCollection') ?? undefined, reranker: p.get('reranker') ?? undefined, citation: p.get('citation') ?? undefined, grounding: p.get('grounding') ?? undefined, environment: p.get('environment') ?? undefined }
}
async function idFrom(context: { params: Promise<{ id: string }> }) { return (await context.params).id }
async function disabled() { return apiResponse({ data: null, status: 'error', httpStatus: 405, message: 'RAG Management mutations are disabled in autonomous build mode. Pipeline creation, validation, evaluation, query tests, recovery, index rebuilds, embedding migrations, comparisons, recommendations, and emergency controls run through governed rag-operations jobs.' }) }

export const ragManagementController = {
  async dashboard(request: NextRequest) { return apiDatabase(await ragManagementService.dashboard(queryFromUrl(request)), 'RAG management dashboard loaded.') },
  async summary() { return apiDatabase(await ragManagementService.summary(), 'RAG summary loaded.') },
  async pipelines(request: NextRequest) { return apiDatabase(await ragManagementService.pipelines(queryFromUrl(request)), 'RAG pipelines loaded.') },
  async pipeline(_request: NextRequest, context: { params: Promise<{ id: string }> }) { return apiDatabase(await ragManagementService.pipelineDetail(await idFrom(context)), 'RAG pipeline detail loaded.') },
  async activeRetrievals(request: NextRequest) { return apiDatabase(await ragManagementService.retrievals(queryFromUrl(request)), 'Active RAG retrievals loaded.') },
  async retrieval(_request: NextRequest, context: { params: Promise<{ id: string }> }) { return apiDatabase(await ragManagementService.retrievalDetail(await idFrom(context)), 'RAG retrieval detail loaded.') },
  async retrievers() { return apiDatabase(await ragManagementService.retrievers(), 'RAG retrievers loaded.') },
  async embeddings() { return apiDatabase(await ragManagementService.embeddings(), 'RAG embeddings loaded.') },
  async vectorCollections() { return apiDatabase(await ragManagementService.vectorCollections(), 'RAG vector collections loaded.') },
  async rerankers() { return apiDatabase(await ragManagementService.rerankers(), 'RAG rerankers loaded.') },
  async queryIntelligence() { return apiDatabase(await ragManagementService.queryIntelligence(), 'RAG query intelligence loaded.') },
  async failures() { return apiDatabase(await ragManagementService.failures(), 'RAG failures loaded.') },
  async recoveries() { return apiDatabase(await ragManagementService.recoveries(), 'RAG recoveries loaded.') },
  async evaluations() { return apiDatabase(await ragManagementService.evaluations(), 'RAG evaluations loaded.') },
  async analytics() { return apiDatabase(await ragManagementService.analytics(), 'RAG analytics loaded.') },
  async recommendations() { return apiDatabase(await ragManagementService.recommendations(), 'RAG recommendations loaded.') },
  async finalOutputTraceability() { return apiDatabase(await ragManagementService.finalOutput(), 'RAG final-output traceability loaded.') },
  async stream() { return apiDatabase(ragManagementService.streamDescriptor(), 'RAG stream descriptor loaded.') },
  disabled,
}

export const RagManagementController = ragManagementController
