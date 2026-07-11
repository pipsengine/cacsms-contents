import { apiDatabase, apiResponse } from '@/shared/api/apiResponse'
import { aiStrategyService } from './services'

type Ctx = { params?: Promise<{ slug?: string[] }> | { slug?: string[] } }

async function slugFromContext(context?: Ctx) {
  const params = context?.params instanceof Promise ? await context.params : context?.params
  return params?.slug ?? []
}

function governed(action: string) {
  return apiResponse({ data: { action, autonomousMode: true, queue: 'ai-strategy-portfolio' }, status: 'success', httpStatus: 202, message: 'AI strategy action accepted as a governed autonomous portfolio job. Direct operational controls are not exposed from this page.' })
}

export const aiStrategyController = {
  dashboard: async () => apiDatabase(await aiStrategyService.dashboard(), 'AI Strategy & Portfolio Management loaded.'),
  section: async (_request: Request, context?: Ctx) => {
    const [section] = await slugFromContext(context)
    if (section === 'stream') return apiDatabase(aiStrategyService.streamDescriptor(), 'AI strategy stream descriptor loaded.')
    return apiDatabase(await aiStrategyService.section(section ?? ''), 'AI strategy section loaded.')
  },
  governed: async (request: Request, context?: Ctx) => {
    const slug = await slugFromContext(context)
    return governed(slug.join('/') || new URL(request.url).pathname.split('/').pop() || 'ai-strategy')
  },
}

export const AiStrategyPortfolioController = aiStrategyController
