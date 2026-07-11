import { agentTasksRepository, type AgentTasksQuery } from './repositories'

function n(value: unknown) { return Number(value ?? 0) }
function pct(value: unknown) { return `${n(value).toFixed(1)}%` }
function minutes(value: unknown) { return `${n(value).toFixed(1)}m` }
function money(value: unknown) { return `$${n(value).toFixed(2)}` }

function kpis(summary: Record<string, unknown>) {
  return [
    { key: 'total', label: 'Total Tasks', value: summary.totalTasks ?? 0, trend: 'all autonomous units', status: 'healthy', dataSource: 'database' },
    { key: 'queued', label: 'Queued Tasks', value: summary.queuedTasks ?? 0, trend: 'ready for workers', status: 'healthy', dataSource: 'database' },
    { key: 'running', label: 'Running Tasks', value: summary.runningTasks ?? 0, trend: 'currently executing', status: 'healthy', dataSource: 'database' },
    { key: 'completed', label: 'Completed Today', value: summary.completedToday ?? 0, trend: 'validated outputs', status: 'healthy', dataSource: 'database' },
    { key: 'blocked', label: 'Blocked Tasks', value: summary.blockedTasks ?? 0, trend: 'auto-recovery candidates', status: n(summary.blockedTasks) ? 'watch' : 'healthy', dataSource: 'database' },
    { key: 'recovered', label: 'Recovered Tasks', value: summary.recoveredTasks ?? 0, trend: 'recovery success', status: 'healthy', dataSource: 'database' },
    { key: 'time', label: 'Average Completion Time', value: minutes(summary.averageCompletionTime), trend: 'execution speed', status: 'healthy', dataSource: 'database' },
    { key: 'cost', label: 'Average Cost', value: money(summary.averageCost), trend: 'cost guardrail', status: 'healthy', dataSource: 'database' },
    { key: 'success', label: 'Task Success Rate', value: pct(summary.taskSuccessRate), trend: 'quality reliability', status: 'healthy', dataSource: 'database' },
    { key: 'attention', label: 'Human Attention Required', value: summary.humanAttentionRequired ?? 0, trend: 'exception only', status: n(summary.humanAttentionRequired) ? 'critical' : 'healthy', dataSource: 'database' },
  ]
}

function status(summary: Record<string, unknown>, health: Record<string, unknown>[]) {
  const find = (name: string) => health.find((row) => row.serviceName === name)?.serviceState ?? 'Healthy'
  return { mode: 'Fully Autonomous', planner: find('Planner'), scheduler: find('Scheduler'), prioritizer: find('Prioritizer'), dependencyEngine: find('Dependency Engine'), delegationEngine: find('Delegation Engine'), executionEngine: find('Execution Engine'), validationEngine: find('Validation Engine'), recoveryEngine: find('Recovery Engine'), costOptimizer: find('Cost Optimizer'), deadlinePredictor: find('Deadline Predictor'), taskQueue: find('Task Queue'), audit: find('Audit'), notifications: find('Notifications'), activeTasks: n(summary.runningTasks) + n(summary.queuedTasks), recoveryQueue: summary.recoveredTasks, taskSla: 'protected', dataSource: 'database' }
}

export const agentTasksService = {
  async dashboard(query: AgentTasksQuery = {}) {
    const [summary, tasks, categories, lifecycle, health, dependencies, priority, validation, recovery, recommendations, filters] = await Promise.all([
      agentTasksRepository.summary(), agentTasksRepository.tasks(query), agentTasksRepository.categories(), agentTasksRepository.lifecycle(), agentTasksRepository.health(), agentTasksRepository.dependencies(), agentTasksRepository.priority(), agentTasksRepository.validation(), agentTasksRepository.recovery(), agentTasksRepository.recommendations(), agentTasksRepository.filters(),
    ])
    return {
      summary: { ...summary, kpis: kpis(summary) },
      orchestratorStatus: status(summary, health),
      healthServices: health,
      lifecycle,
      categories,
      tasks,
      selectedTask: tasks[0] ?? {},
      taskWizard: ['Identity','Workflow','Objective','Category','Priority','Dependencies','Assignment','Execution','Validation','Recovery','Outputs','Publish'].map((step, index) => ({ step, sequence: index + 1, status: 'autonomous draft available', governance: index > 8 ? 'governed before production' : 'routine autonomous' })),
      planningModes: ['Single-step','Multi-step','Hierarchical','Dynamic','Parallel','Sequential','Recursive','Conditional','Estimated'].map((mode) => ({ mode, duration: 'estimated', cost: 'estimated', confidence: 'calculated' })),
      dependencyGraph: dependencies,
      priorityEngine: priority,
      validation,
      recovery,
      timeline: tasks.slice(0, 20).map((row) => ({ taskCode: row.taskCode, status: row.status, startedAt: row.startedAt, eta: row.eta, deadline: row.deadline, progress: row.progressPercent })),
      kanban: ['Queued','Planning','Assigned','Running','Waiting','Blocked','Retrying','Recovering','Completed'].map((state) => ({ status: state, count: tasks.filter((row) => row.status === state).length })),
      costPanel: tasks.slice(0, 20).map((row) => ({ taskCode: row.taskCode, cost: row.cost, provider: row.provider, model: row.model, category: row.category })),
      performancePanel: tasks.slice(0, 20).map((row) => ({ taskCode: row.taskCode, confidence: row.confidence, risk: row.risk, progress: row.progressPercent, output: row.outputState })),
      simulationPanel: priority.slice(0, 20).map((row) => ({ ...row, simulationStatus: n(row.finalPriority) >= 70 ? 'Passed' : 'Watch' })),
      recommendations,
      finalOutputLinkage: validation.map((row) => ({ taskCode: row.taskCode, category: row.category, impact: row.finalOutputImpact, readiness: row.outputReadiness, validation: row.validationStatus })),
      savedViews: ['All Tasks','Queued Tasks','Running Tasks','Blocked Tasks','Recovering Tasks','Completed Today','High Priority','Critical Path','Final Output at Risk','High Cost','Behind Schedule','Human Attention Required'],
      filters,
      dataSource: 'database' as const,
      realtime: { mode: 'polling', intervalSeconds: 10, stream: '/api/v1/agent-tasks/stream', queue: 'agent-tasks' },
    }
  },
  summary: agentTasksRepository.summary,
  tasks: (query: AgentTasksQuery = {}) => agentTasksRepository.tasks(query),
  categories: agentTasksRepository.categories,
  lifecycle: agentTasksRepository.lifecycle,
  health: agentTasksRepository.health,
  dependencies: agentTasksRepository.dependencies,
  priority: agentTasksRepository.priority,
  validation: agentTasksRepository.validation,
  recovery: agentTasksRepository.recovery,
  recommendations: agentTasksRepository.recommendations,
  async get(id: string) {
    const [task, dependencies, priority, validation, recovery] = await Promise.all([agentTasksRepository.get(id), agentTasksRepository.dependenciesForTask(id), agentTasksRepository.priorityForTask(id), agentTasksRepository.validationForTask(id), agentTasksRepository.recoveryForTask(id)])
    return { task, dependencies, priority, validation, recovery }
  },
  streamDescriptor() {
    return { stream: 'polling-ready', heartbeatSeconds: 10, autonomousMode: true, queue: 'agent-tasks', dataSource: 'database', events: ['task.created','task.assigned','task.started','task.progress','task.blocked','task.retry','task.recovered','task.completed','task.cancelled','task.failed','task.final_output.updated'] }
  },
}

export const AgentTasksService = agentTasksService
