import type { NextRequest } from 'next/server'
import { apiDatabase, apiResponse } from '@/shared/api/apiResponse'
import { knowledgeBaseService } from './services'
import type { KnowledgeBaseQuery } from './repositories'

function queryFromUrl(request: NextRequest): KnowledgeBaseQuery {
  const p = request.nextUrl.searchParams
  return { q: p.get('q') ?? undefined, category: p.get('category') ?? undefined, sourceType: p.get('sourceType') ?? undefined, status: p.get('status') ?? undefined, scope: p.get('scope') ?? undefined, trustLevel: p.get('trustLevel') ?? undefined, brand: p.get('brand') ?? undefined, environment: p.get('environment') ?? undefined, ocr: p.get('ocr') ?? undefined, graph: p.get('graph') ?? undefined, citation: p.get('citation') ?? undefined }
}
async function idFrom(context: { params: Promise<{ id: string }> }) { return (await context.params).id }
async function objectIdFrom(context: { params: Promise<{ objectId: string }> }) { return (await context.params).objectId }
async function disabled() { return apiResponse({ data: null, status: 'error', httpStatus: 405, message: 'Knowledge Base mutations are disabled in autonomous build mode. Source registration, ingestion, upload, validation, reindexing, embedding, synchronization, resolution, and emergency operations run through governed knowledge-base-operations jobs.' }) }

export const knowledgeBaseController = {
  async dashboard(request: NextRequest) { return apiDatabase(await knowledgeBaseService.dashboard(queryFromUrl(request)), 'Knowledge base dashboard loaded.') },
  async summary() { return apiDatabase(await knowledgeBaseService.summary(), 'Knowledge base summary loaded.') },
  async sources(request: NextRequest) { return apiDatabase(await knowledgeBaseService.sources(queryFromUrl(request)), 'Knowledge sources loaded.') },
  async source(_request: NextRequest, context: { params: Promise<{ id: string }> }) { return apiDatabase(await knowledgeBaseService.sourceDetail(await idFrom(context)), 'Knowledge source detail loaded.') },
  async sourceObjects(_request: NextRequest, context: { params: Promise<{ id: string }> }) { return apiDatabase((await knowledgeBaseService.sourceDetail(await idFrom(context))).objects, 'Knowledge source objects loaded.') },
  async sourceHealth(_request: NextRequest, context: { params: Promise<{ id: string }> }) { return apiDatabase((await knowledgeBaseService.sourceDetail(await idFrom(context))).health, 'Knowledge source health loaded.') },
  async sourceIngestion(_request: NextRequest, context: { params: Promise<{ id: string }> }) { return apiDatabase((await knowledgeBaseService.sourceDetail(await idFrom(context))).ingestionRuns, 'Knowledge source ingestion runs loaded.') },
  async objects(request: NextRequest) { return apiDatabase(await knowledgeBaseService.objects(queryFromUrl(request)), 'Knowledge objects loaded.') },
  async object(_request: NextRequest, context: { params: Promise<{ objectId: string }> }) { return apiDatabase(await knowledgeBaseService.objectDetail(await objectIdFrom(context)), 'Knowledge object detail loaded.') },
  async objectVersions(_request: NextRequest, context: { params: Promise<{ objectId: string }> }) { return apiDatabase((await knowledgeBaseService.objectDetail(await objectIdFrom(context))).versions, 'Knowledge object versions loaded.') },
  async objectCitations(_request: NextRequest, context: { params: Promise<{ objectId: string }> }) { return apiDatabase((await knowledgeBaseService.objectDetail(await objectIdFrom(context))).citations, 'Knowledge object citations loaded.') },
  async objectProvenance(_request: NextRequest, context: { params: Promise<{ objectId: string }> }) { return apiDatabase((await knowledgeBaseService.objectDetail(await objectIdFrom(context))).provenance, 'Knowledge object provenance loaded.') },
  async objectRelationships(_request: NextRequest, context: { params: Promise<{ objectId: string }> }) { return apiDatabase((await knowledgeBaseService.objectDetail(await objectIdFrom(context))).relationships, 'Knowledge object relationships loaded.') },
  async objectUsage(_request: NextRequest, context: { params: Promise<{ objectId: string }> }) { return apiDatabase((await knowledgeBaseService.objectDetail(await objectIdFrom(context))).usage, 'Knowledge object usage loaded.') },
  async ingestion() { return apiDatabase(await knowledgeBaseService.ingestion(), 'Knowledge ingestion loaded.') },
  async validation() { return apiDatabase(await knowledgeBaseService.validation(), 'Knowledge validation loaded.') },
  async duplicates() { return apiDatabase(await knowledgeBaseService.duplicates(), 'Knowledge duplicates loaded.') },
  async contradictions() { return apiDatabase(await knowledgeBaseService.contradictions(), 'Knowledge contradictions loaded.') },
  async entities() { return apiDatabase(await knowledgeBaseService.entities(), 'Knowledge entities loaded.') },
  async graph() { return apiDatabase(await knowledgeBaseService.graph(), 'Knowledge graph loaded.') },
  async embeddings() { return apiDatabase(await knowledgeBaseService.embeddings(), 'Knowledge embeddings loaded.') },
  async indexes() { return apiDatabase(await knowledgeBaseService.indexes(), 'Knowledge indexes loaded.') },
  async search(request: NextRequest) { return apiDatabase(await knowledgeBaseService.objects(queryFromUrl(request)), 'Knowledge search loaded.') },
  async retrievalTests() { return apiDatabase(await knowledgeBaseService.retrievalTests(), 'Knowledge retrieval tests loaded.') },
  async citations() { return apiDatabase(await knowledgeBaseService.citations(), 'Knowledge citations loaded.') },
  async taxonomies() { return apiDatabase([{ name: 'Brand taxonomy', state: 'active' }, { name: 'Audience taxonomy', state: 'active' }], 'Knowledge taxonomies loaded.') },
  async ontologies() { return apiDatabase([{ name: 'Content ontology', state: 'active' }, { name: 'Workflow ontology', state: 'active' }], 'Knowledge ontologies loaded.') },
  async synchronization() { return apiDatabase(await knowledgeBaseService.sync(), 'Knowledge synchronization loaded.') },
  async analytics() { return apiDatabase(await knowledgeBaseService.analytics(), 'Knowledge analytics loaded.') },
  async gaps() { return apiDatabase(await knowledgeBaseService.gaps(), 'Knowledge gaps loaded.') },
  async recommendations() { return apiDatabase(await knowledgeBaseService.recommendations(), 'Knowledge recommendations loaded.') },
  async finalOutputTraceability() { return apiDatabase(await knowledgeBaseService.finalOutput(), 'Knowledge final-output traceability loaded.') },
  async stream() { return apiDatabase(knowledgeBaseService.streamDescriptor(), 'Knowledge stream descriptor loaded.') },
  disabled,
}

export const KnowledgeBaseController = knowledgeBaseController
