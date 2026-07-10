import { workflowDashboardRepository } from './repositories'
import type { WorkflowDashboardQuery } from './types'

function secondsToLabel(seconds: unknown) {
  const value = Math.max(0, Number(seconds ?? 0))
  const minutes = Math.floor(value / 60)
  return `${minutes}m ${Math.round(value % 60)}s`
}

function kpiSummary(summary: Record<string, unknown>) {
  return [
    { label: 'Total Workflow Definitions', value: summary.totalDefinitions ?? 0, note: 'Active workflow catalog', tone: 'blue' },
    { label: 'Active Workflow Instances', value: summary.activeInstances ?? 0, note: 'Queued, running, recovering, or blocked', tone: 'violet' },
    { label: 'Completed Today', value: summary.completedToday ?? 0, note: 'Database completed_at today', tone: 'green' },
    { label: 'In Progress', value: summary.inProgress ?? 0, note: 'Currently executing', tone: 'blue' },
    { label: 'Pending', value: summary.pending ?? 0, note: 'Waiting in queues', tone: 'amber' },
    { label: 'Failed', value: summary.failed ?? 0, note: 'Require autonomous recovery or incident link', tone: 'red' },
    { label: 'Automatically Recovered', value: summary.automaticallyRecovered ?? 0, note: 'Recovered by policy', tone: 'green' },
    { label: 'Success Rate', value: `${Number(summary.successRate ?? 0).toFixed(1)}%`, note: 'Workflow instance success ratio', tone: 'green' },
    { label: 'Average Completion Time', value: secondsToLabel(summary.avgCompletionSeconds), note: 'Completed workflows', tone: 'blue' },
    { label: 'Human Input Required', value: summary.humanInputRequired ?? 0, note: 'Fully autonomous target is zero', tone: Number(summary.humanInputRequired ?? 0) > 0 ? 'red' : 'green' },
  ]
}

export const workflowDashboardService = {
  async dashboard(query: WorkflowDashboardQuery = {}) {
    const [summary, pipeline, categories, activeInstances, recoveries, queueHealth, definitionHealth, autonomousDecisions, finalOutputReadiness, filters] = await Promise.all([
      workflowDashboardRepository.summary(),
      workflowDashboardRepository.pipeline(),
      workflowDashboardRepository.categories(),
      workflowDashboardRepository.instances(query),
      workflowDashboardRepository.recoveries(),
      workflowDashboardRepository.queues(),
      workflowDashboardRepository.definitionHealth(),
      workflowDashboardRepository.decisions(),
      workflowDashboardRepository.outputReadiness(),
      workflowDashboardRepository.filters(),
    ])
    return {
      summary: { ...summary, kpis: kpiSummary(summary) },
      engineStatus: {
        workflowEngine: 'Running',
        scheduler: 'Running',
        eventBus: 'Running',
        queueManager: queueHealth.some((queue) => String(queue.queueStatus) !== 'healthy') ? 'Degraded' : 'Healthy',
        workerFleet: 'Managed',
        aiOrchestrator: 'Connected',
        approvalEngine: 'Autonomous',
        autonomousRecovery: 'Enabled',
        learningFeedback: 'Active',
        operatingMode: 'Fully Autonomous',
        queueDepth: queueHealth.reduce((sum, queue) => sum + Number(queue.waitingJobs ?? 0), 0),
        currentBottleneck: queueHealth.sort((a, b) => Number(b.waitingJobs ?? 0) - Number(a.waitingJobs ?? 0))[0]?.queueName ?? 'None',
        decisionConfidence: autonomousDecisions[0]?.confidencePercent ?? 100,
        humanAttentionRequired: summary.humanInputRequired ?? 0,
      },
      pipeline,
      categories,
      activeInstances,
      recoveries,
      queueHealth,
      definitionHealth,
      autonomousDecisions,
      analytics: {
        successRate: summary.successRate ?? 0,
        recoverySuccessRate: recoveries.length ? Math.round((recoveries.filter((item) => ['completed', 'recovered'].includes(String(item.status))).length / recoveries.length) * 100) : 100,
        averageDuration: secondsToLabel(summary.avgCompletionSeconds),
        finalOutputSuccessRate: finalOutputReadiness.readinessPercent ?? 0,
      },
      finalOutputReadiness,
      filters,
      dataSource: 'database' as const,
    }
  },
  summary: workflowDashboardRepository.summary,
  pipeline: workflowDashboardRepository.pipeline,
  categories: workflowDashboardRepository.categories,
  recoveries: workflowDashboardRepository.recoveries,
  queues: workflowDashboardRepository.queues,
  definitionHealth: workflowDashboardRepository.definitionHealth,
  decisions: workflowDashboardRepository.decisions,
  outputReadiness: workflowDashboardRepository.outputReadiness,
  streamDescriptor() {
    return {
      stream: 'polling-ready',
      events: ['workflow.created', 'workflow.queued', 'workflow.started', 'workflow.stage.progress', 'workflow.recovering', 'workflow.recovered', 'workflow.completed', 'workflow.failed', 'workflow.final_result.ready'],
      heartbeatSeconds: 5,
      autonomousMode: true,
      dataSource: 'database',
    }
  },
}
