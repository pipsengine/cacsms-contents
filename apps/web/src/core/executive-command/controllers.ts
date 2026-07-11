import { apiDatabase, apiResponse } from '@/shared/api/apiResponse'
import { executiveCommandService } from './services'

type Ctx = { params?: Promise<{ slug?: string[] }> | { slug?: string[] } }

async function slugFromContext(context?: Ctx) {
  const params = context?.params instanceof Promise ? await context.params : context?.params
  return params?.slug ?? []
}

function governed(action: string) {
  return apiResponse({
    data: { action, autonomousMode: true, queue: 'executive-intelligence' },
    status: 'success',
    httpStatus: 202,
    message: 'Executive command action accepted as a governed autonomous job. Manual production control is not exposed from this page.',
  })
}

export const executiveCommandController = {
  async dashboard() {
    return apiDatabase(await executiveCommandService.dashboard(), 'AI Executive Command Center loaded.')
  },

  async section(_request: Request, context?: Ctx) {
    const [section] = await slugFromContext(context)
    if (section === 'stream') return executiveCommandController.stream()
    return apiDatabase(await executiveCommandService.section(section ?? ''), 'Executive command section loaded.')
  },

  async stream() {
    return apiDatabase(executiveCommandService.streamDescriptor(), 'Executive command stream descriptor loaded.')
  },

  async governed(request: Request, context?: Ctx) {
    const slug = await slugFromContext(context)
    return governed(slug.join('/') || new URL(request.url).pathname.split('/').pop() || 'executive-command')
  },
}

export const ExecutiveCommandCenterController = executiveCommandController
