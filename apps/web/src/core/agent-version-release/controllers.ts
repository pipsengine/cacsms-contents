import type { NextRequest } from 'next/server'
import { apiDatabase, apiResponse } from '@/shared/api/apiResponse'
import { agentVersionReleaseService } from './services'
import type { VersionReleaseQuery } from './repositories'

function queryFromUrl(request: NextRequest): VersionReleaseQuery {
  const p = request.nextUrl.searchParams
  return { q: p.get('q') ?? undefined, type: p.get('type') ?? undefined, status: p.get('status') ?? undefined, environment: p.get('environment') ?? undefined, risk: p.get('risk') ?? undefined }
}

async function disabled() {
  return apiResponse({
    data: null,
    status: 'error',
    httpStatus: 405,
    message: 'Agent Version & Release Management mutations are disabled in build mode. Create, validate, promote, deploy, rollback, emergency, and export actions run through governed version-release-operations queue jobs with audit logging.',
  })
}

export const agentVersionReleaseController = {
  async dashboard(request: NextRequest) { return apiDatabase(await agentVersionReleaseService.dashboard(queryFromUrl(request)), 'Agent Version & Release Management loaded from database.') },
  async summary() { return apiDatabase(await agentVersionReleaseService.summary(), 'Version release summary loaded.') },
  async versions(request: NextRequest) { return apiDatabase(await agentVersionReleaseService.componentVersions(queryFromUrl(request)), 'Component versions loaded.') },
  async releases(request: NextRequest) { return apiDatabase(await agentVersionReleaseService.releases(queryFromUrl(request)), 'Releases loaded.') },
  async stream() { return apiDatabase(agentVersionReleaseService.streamDescriptor(), 'Version release stream descriptor loaded.') },
  disabled,
}
