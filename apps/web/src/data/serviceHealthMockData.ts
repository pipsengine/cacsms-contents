export type ServiceStatus = 'Operational' | 'Degraded' | 'Failed' | 'Starting' | 'Stopped'
export type Severity = 'Critical' | 'High' | 'Medium' | 'Low'

export type ServiceHealthKpi = {
  label: string
  value: string
  note: string
  tone: 'green' | 'blue' | 'orange' | 'red' | 'purple' | 'cyan'
}

export type ServiceHealthCard = {
  id: string
  name: string
  icon: string
  status: ServiceStatus
  health: number
  latency: string
  uptime: string
  lastChecked: string
  category: string
}

export type Incident = {
  id: string
  service: string
  severity: Severity
  status: 'Investigating' | 'Monitoring' | 'Resolved' | 'Open'
  started: string
  duration: string
  impact: string
  assignedTo: string
}

export type ServiceMetric = {
  service: string
  status: ServiceStatus
  health: number
  latency: string
  errorRate: string
  uptime: string
  cpu: string
  memory: string
  queueDepth: string
  lastRestart: string
  lastChecked: string
}

export const serviceHealthMockData = {
  kpis: [
    { label: 'Overall Health', value: '92%', note: 'All services weighted', tone: 'green' },
    { label: 'Running Services', value: '42', note: 'Across 8 domains', tone: 'blue' },
    { label: 'Degraded Services', value: '3', note: 'Needs attention', tone: 'orange' },
    { label: 'Failed Services', value: '1', note: 'Active incident', tone: 'red' },
    { label: 'Average Response Time', value: '128ms', note: 'p95 across APIs', tone: 'purple' },
    { label: 'Uptime', value: '99.94%', note: 'Last 30 days', tone: 'cyan' },
  ] satisfies ServiceHealthKpi[],

  services: [
    { id: 'core-api', name: 'Core API Gateway', icon: 'api', status: 'Operational', health: 99, latency: '82ms', uptime: '99.99%', lastChecked: '30s ago', category: 'Core' },
    { id: 'web-app', name: 'Web App', icon: 'web', status: 'Operational', health: 98, latency: '74ms', uptime: '99.98%', lastChecked: '28s ago', category: 'Core' },
    { id: 'ai-orchestrator', name: 'AI Orchestrator', icon: 'bot', status: 'Degraded', health: 84, latency: '241ms', uptime: '99.71%', lastChecked: '42s ago', category: 'AI' },
    { id: 'agent-runtime', name: 'AI Agent Runtime', icon: 'agent', status: 'Operational', health: 96, latency: '138ms', uptime: '99.93%', lastChecked: '35s ago', category: 'AI' },
    { id: 'workflow-engine', name: 'Workflow Engine', icon: 'workflow', status: 'Operational', health: 97, latency: '116ms', uptime: '99.96%', lastChecked: '25s ago', category: 'Automation' },
    { id: 'scheduler', name: 'Scheduler Service', icon: 'calendar', status: 'Starting', health: 73, latency: '190ms', uptime: '99.80%', lastChecked: '1m ago', category: 'Automation' },
    { id: 'render-engine', name: 'Render Engine', icon: 'render', status: 'Degraded', health: 78, latency: '420ms', uptime: '99.42%', lastChecked: '50s ago', category: 'Media' },
    { id: 'analytics-engine', name: 'Analytics Engine', icon: 'analytics', status: 'Operational', health: 94, latency: '133ms', uptime: '99.95%', lastChecked: '31s ago', category: 'Analytics' },
    { id: 'notifications', name: 'Notification Service', icon: 'bell', status: 'Operational', health: 95, latency: '91ms', uptime: '99.90%', lastChecked: '39s ago', category: 'Comms' },
    { id: 'publishing', name: 'Publishing Engine', icon: 'send', status: 'Operational', health: 93, latency: '147ms', uptime: '99.88%', lastChecked: '45s ago', category: 'Publishing' },
    { id: 'database', name: 'Database', icon: 'database', status: 'Operational', health: 99, latency: '18ms', uptime: '99.99%', lastChecked: '20s ago', category: 'Data' },
    { id: 'storage', name: 'Object Storage', icon: 'storage', status: 'Operational', health: 97, latency: '64ms', uptime: '99.97%', lastChecked: '34s ago', category: 'Data' },
    { id: 'vector-db', name: 'Vector Database', icon: 'vector', status: 'Operational', health: 91, latency: '156ms', uptime: '99.85%', lastChecked: '52s ago', category: 'Data' },
    { id: 'redis', name: 'Cache / Redis', icon: 'cache', status: 'Operational', health: 98, latency: '9ms', uptime: '99.99%', lastChecked: '18s ago', category: 'Data' },
    { id: 'queue-worker', name: 'Queue Worker', icon: 'queue', status: 'Degraded', health: 81, latency: '286ms', uptime: '99.62%', lastChecked: '1m ago', category: 'Workers' },
    { id: 'email', name: 'Email Service', icon: 'email', status: 'Stopped', health: 65, latency: 'n/a', uptime: '98.74%', lastChecked: '3m ago', category: 'Comms' },
    { id: 'social-apis', name: 'Social Platform APIs', icon: 'social', status: 'Operational', health: 90, latency: '212ms', uptime: '99.76%', lastChecked: '55s ago', category: 'Integrations' },
    { id: 'payments', name: 'Payment Gateway', icon: 'payment', status: 'Failed', health: 42, latency: 'timeout', uptime: '97.20%', lastChecked: '2m ago', category: 'Payments' },
  ] satisfies ServiceHealthCard[],

  dependencyFlow: [
    'Web App',
    'API Gateway',
    'Auth Service',
    'Business Services',
    'AI Orchestrator',
    'Workflow Engine',
    'Storage / Database',
    'Publishing / Analytics',
  ],

  incidents: [
    { id: 'INC-1048', service: 'Payment Gateway', severity: 'Critical', status: 'Investigating', started: '10:12 AM', duration: '18m', impact: 'Checkout and billing validation unavailable', assignedTo: 'Ops Lead' },
    { id: 'INC-1047', service: 'Render Engine', severity: 'High', status: 'Monitoring', started: '09:44 AM', duration: '46m', impact: 'Video render jobs delayed', assignedTo: 'Media Platform' },
    { id: 'INC-1046', service: 'Queue Worker', severity: 'Medium', status: 'Open', started: '09:15 AM', duration: '1h 15m', impact: 'Publishing queue processing slower than normal', assignedTo: 'Automation Team' },
    { id: 'INC-1045', service: 'AI Orchestrator', severity: 'Medium', status: 'Monitoring', started: '08:58 AM', duration: '1h 32m', impact: 'Higher AI response latency', assignedTo: 'AI Infra' },
  ] satisfies Incident[],

  metrics: [] as ServiceMetric[],

  sidePanel: {
    criticalAlerts: ['Payment Gateway failed health probe', 'Queue retry volume above threshold', 'Render Engine p95 latency over SLA'],
    degradedServices: ['AI Orchestrator', 'Render Engine', 'Queue Worker'],
    failedHealthChecks: ['payments.webhook.verify', 'email.smtp.session', 'queue.worker.backlog'],
    recommendedActions: ['Restart Payment Gateway connector', 'Scale queue workers by 2 instances', 'Open render cluster logs', 'Verify SMTP provider credentials'],
  },

  bottom: {
    statusChanges: [
      '10:24 AM - Queue Worker moved to Degraded',
      '10:12 AM - Payment Gateway moved to Failed',
      '09:58 AM - Scheduler Service moved to Starting',
      '09:44 AM - Render Engine moved to Degraded',
    ],
    healthHistory: [
      '10:30 AM - Full health check completed: 92%',
      '10:15 AM - Full health check completed: 91%',
      '10:00 AM - Full health check completed: 94%',
      '09:45 AM - Full health check completed: 93%',
    ],
    slaSummary: [
      { label: 'Core Platform', value: '99.98%' },
      { label: 'AI Services', value: '99.74%' },
      { label: 'Publishing', value: '99.88%' },
      { label: 'Integrations', value: '98.96%' },
    ],
  },
}

serviceHealthMockData.metrics = serviceHealthMockData.services.map((service, index) => ({
  service: service.name,
  status: service.status,
  health: service.health,
  latency: service.latency,
  errorRate: service.status === 'Failed' ? '12.4%' : service.status === 'Degraded' ? '2.8%' : index % 3 === 0 ? '0.4%' : '0.1%',
  uptime: service.uptime,
  cpu: service.status === 'Failed' ? '0%' : `${38 + (index % 6) * 7}%`,
  memory: `${48 + (index % 5) * 8}%`,
  queueDepth: service.id === 'queue-worker' ? '1,284' : service.category === 'Workers' ? '412' : String((index + 1) * 7),
  lastRestart: index % 4 === 0 ? 'Today 06:30' : index % 4 === 1 ? 'Yesterday' : '3 days ago',
  lastChecked: service.lastChecked,
}))
