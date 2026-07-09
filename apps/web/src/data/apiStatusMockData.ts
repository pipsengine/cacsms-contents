export type ApiStatus = 'Operational' | 'Degraded' | 'Failed' | 'Rate Limited' | 'Unauthorized' | 'Timeout'
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export type ApiKpi = {
  label: string
  value: string
  note: string
  tone: 'green' | 'blue' | 'orange' | 'red' | 'purple' | 'cyan'
}

export type ApiHealthCard = {
  id: string
  name: string
  status: ApiStatus
  health: number
  latency: string
  errorRate: string
  requests: string
  lastChecked: string
  sparkline: number[]
}

export type ApiEndpoint = {
  group: string
  endpoint: string
  method: HttpMethod
  status: ApiStatus
  health: number
  avgLatency: string
  p95Latency: string
  errorRate: string
  requestsToday: string
  authRequired: 'Yes' | 'No'
  rateLimit: string
  lastFailure: string
  ownerModule: string
}

export const apiStatusMockData = {
  kpis: [
    { label: 'Total APIs', value: '186', note: 'Registered endpoints', tone: 'blue' },
    { label: 'Healthy APIs', value: '172', note: 'Operational now', tone: 'green' },
    { label: 'Degraded APIs', value: '10', note: 'Above warning threshold', tone: 'orange' },
    { label: 'Failed APIs', value: '4', note: 'Active failures', tone: 'red' },
    { label: 'Avg Latency', value: '142ms', note: 'Across all APIs', tone: 'purple' },
    { label: 'Error Rate', value: '0.84%', note: 'Last 24 hours', tone: 'cyan' },
  ] satisfies ApiKpi[],

  apis: [
    { id: 'core-gateway', name: 'Core API Gateway', status: 'Operational', health: 99, latency: '84ms', errorRate: '0.08%', requests: '1.8M', lastChecked: '20s ago', sparkline: [58, 62, 60, 68, 72, 70, 76] },
    { id: 'auth', name: 'Authentication API', status: 'Operational', health: 98, latency: '96ms', errorRate: '0.12%', requests: '824K', lastChecked: '18s ago', sparkline: [52, 56, 61, 60, 65, 69, 71] },
    { id: 'rbac', name: 'User & RBAC API', status: 'Operational', health: 97, latency: '104ms', errorRate: '0.18%', requests: '412K', lastChecked: '25s ago', sparkline: [48, 52, 54, 58, 55, 64, 66] },
    { id: 'org', name: 'Organization API', status: 'Operational', health: 96, latency: '118ms', errorRate: '0.21%', requests: '288K', lastChecked: '27s ago', sparkline: [42, 47, 49, 50, 56, 57, 61] },
    { id: 'brand', name: 'Brand API', status: 'Operational', health: 95, latency: '121ms', errorRate: '0.24%', requests: '192K', lastChecked: '32s ago', sparkline: [40, 42, 47, 45, 50, 53, 56] },
    { id: 'channel', name: 'Channel API', status: 'Degraded', health: 84, latency: '242ms', errorRate: '1.42%', requests: '338K', lastChecked: '44s ago', sparkline: [56, 53, 48, 51, 45, 43, 46] },
    { id: 'content', name: 'Content API', status: 'Operational', health: 94, latency: '136ms', errorRate: '0.34%', requests: '621K', lastChecked: '29s ago', sparkline: [50, 55, 57, 54, 61, 63, 66] },
    { id: 'ai-orchestrator', name: 'AI Orchestrator API', status: 'Degraded', health: 82, latency: '318ms', errorRate: '2.10%', requests: '154K', lastChecked: '39s ago', sparkline: [54, 50, 52, 44, 43, 40, 42] },
    { id: 'agent-runtime', name: 'Agent Runtime API', status: 'Operational', health: 93, latency: '148ms', errorRate: '0.41%', requests: '118K', lastChecked: '33s ago', sparkline: [45, 49, 51, 55, 53, 57, 60] },
    { id: 'workflow', name: 'Workflow API', status: 'Operational', health: 92, latency: '156ms', errorRate: '0.48%', requests: '304K', lastChecked: '31s ago', sparkline: [44, 48, 50, 53, 57, 55, 59] },
    { id: 'publishing', name: 'Publishing API', status: 'Rate Limited', health: 76, latency: '384ms', errorRate: '2.74%', requests: '92K', lastChecked: '1m ago', sparkline: [50, 46, 42, 38, 36, 34, 39] },
    { id: 'analytics', name: 'Analytics API', status: 'Operational', health: 96, latency: '112ms', errorRate: '0.19%', requests: '980K', lastChecked: '22s ago', sparkline: [60, 63, 65, 67, 66, 70, 73] },
    { id: 'notification', name: 'Notification API', status: 'Operational', health: 95, latency: '102ms', errorRate: '0.20%', requests: '261K', lastChecked: '30s ago', sparkline: [45, 49, 52, 51, 56, 58, 59] },
    { id: 'storage', name: 'Storage API', status: 'Operational', health: 97, latency: '72ms', errorRate: '0.09%', requests: '514K', lastChecked: '24s ago', sparkline: [55, 57, 62, 64, 63, 68, 70] },
    { id: 'reporting', name: 'Reporting API', status: 'Timeout', health: 61, latency: 'timeout', errorRate: '5.12%', requests: '44K', lastChecked: '2m ago', sparkline: [46, 41, 37, 31, 28, 24, 26] },
    { id: 'billing', name: 'Billing API', status: 'Unauthorized', health: 68, latency: '210ms', errorRate: '4.30%', requests: '26K', lastChecked: '3m ago', sparkline: [44, 39, 35, 36, 32, 30, 29] },
    { id: 'webhook', name: 'Webhook API', status: 'Failed', health: 48, latency: 'timeout', errorRate: '8.90%', requests: '71K', lastChecked: '2m ago', sparkline: [40, 35, 31, 26, 22, 19, 21] },
    { id: 'external-providers', name: 'External Provider APIs', status: 'Degraded', health: 79, latency: '432ms', errorRate: '2.88%', requests: '133K', lastChecked: '1m ago', sparkline: [48, 45, 43, 38, 41, 39, 42] },
  ] satisfies ApiHealthCard[],

  dependencyFlow: ['Frontend', 'API Gateway', 'Auth/RBAC', 'Business APIs', 'AI APIs', 'Workflow APIs', 'Storage APIs', 'Publishing APIs', 'Analytics APIs', 'Learning APIs'],

  endpoints: [
    ['Core', 'GET /api/health', 'GET', 'Operational', 100, '42ms', '88ms', '0.00%', '1.2M', 'No', '10k/min', '-', 'System Monitoring'],
    ['Auth', 'POST /api/auth/login', 'POST', 'Operational', 98, '94ms', '180ms', '0.14%', '82K', 'No', '2k/min', 'Yesterday', 'Authentication'],
    ['Navigation', 'GET /api/navigation', 'GET', 'Operational', 97, '76ms', '141ms', '0.09%', '311K', 'Yes', '5k/min', '-', 'App Shell'],
    ['Monitoring', 'GET /api/system-monitoring/api-status', 'GET', 'Operational', 96, '118ms', '220ms', '0.18%', '24K', 'Yes', '1k/min', '-', 'System Monitoring'],
    ['AI Agents', 'POST /api/ai-agents/run', 'POST', 'Degraded', 82, '352ms', '910ms', '2.30%', '18K', 'Yes', '400/min', '10:12 AM', 'AI Agents'],
    ['Workflows', 'POST /api/workflows/execute', 'POST', 'Operational', 92, '164ms', '340ms', '0.46%', '41K', 'Yes', '800/min', '-', 'Workflow Automation'],
    ['Content', 'POST /api/content/generate-script', 'POST', 'Operational', 91, '188ms', '420ms', '0.62%', '35K', 'Yes', '500/min', '-', 'Content Production'],
    ['Video', 'POST /api/video/render', 'POST', 'Timeout', 60, 'timeout', '2.4s', '5.80%', '8K', 'Yes', '120/min', '10:21 AM', 'Video Studio'],
    ['Publishing', 'POST /api/publishing/youtube', 'POST', 'Rate Limited', 74, '412ms', '1.1s', '3.20%', '12K', 'Yes', '100/min', '10:05 AM', 'Publishing Center'],
    ['Analytics', 'GET /api/analytics/content', 'GET', 'Operational', 96, '104ms', '212ms', '0.12%', '198K', 'Yes', '4k/min', '-', 'Analytics'],
    ['Learning', 'POST /api/learning/feedback', 'POST', 'Degraded', 80, '288ms', '720ms', '2.10%', '9K', 'Yes', '300/min', '09:48 AM', 'AI Learning Center'],
    ['Webhooks', 'POST /api/webhooks/social', 'POST', 'Failed', 42, 'timeout', 'timeout', '8.90%', '6K', 'Yes', '200/min', '10:18 AM', 'Integrations'],
  ].map(([group, endpoint, method, status, health, avgLatency, p95Latency, errorRate, requestsToday, authRequired, rateLimit, lastFailure, ownerModule]) => ({
    group,
    endpoint,
    method,
    status,
    health,
    avgLatency,
    p95Latency,
    errorRate,
    requestsToday,
    authRequired,
    rateLimit,
    lastFailure,
    ownerModule,
  })) as ApiEndpoint[],

  failures: {
    timeoutErrors: ['POST /api/video/render', 'GET /api/reporting/export', 'POST /api/webhooks/social'],
    unauthorizedErrors: ['Billing provider token expired', 'OAuth refresh failed for channel sync'],
    rateLimitWarnings: ['YouTube publishing API', 'External Provider APIs', 'OpenAI batch completions'],
    providerFailures: ['Stripe billing health check', 'TikTok publishing callback'],
    brokenWebhooks: ['social.delivery.created', 'youtube.publish.completed'],
    failedRetries: ['webhook-social retry batch #184', 'video-render retry batch #092'],
  },

  intelligence: {
    criticalAlerts: ['Webhook API failed delivery probe', 'Billing API unauthorized responses elevated', 'Video Render API timeout spike'],
    slowestApis: ['External Provider APIs - 432ms', 'Publishing API - 384ms', 'AI Orchestrator API - 318ms'],
    mostUsedApis: ['Core API Gateway - 1.8M', 'Analytics API - 980K', 'Authentication API - 824K'],
    failedExternalApis: ['Stripe billing', 'YouTube publish', 'Social webhook callback'],
    recommendedFixes: ['Rotate billing provider token', 'Back off publishing retries', 'Scale video render API workers', 'Replay failed webhook deliveries'],
  },

  trends: {
    requestTrend: [42, 52, 49, 64, 70, 78, 84, 80, 92, 96],
    latencyTrend: [122, 128, 135, 132, 141, 148, 142, 152, 146, 142],
    errorTrend: [0.42, 0.44, 0.50, 0.62, 0.58, 0.76, 0.84, 0.78, 0.88, 0.84],
    webhookStatus: [
      { label: 'Delivered', value: '94.2%' },
      { label: 'Retrying', value: '3.8%' },
      { label: 'Failed', value: '2.0%' },
    ],
  },
}
