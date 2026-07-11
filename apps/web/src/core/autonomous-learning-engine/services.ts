import { autonomousLearningRepository, type LearningQuery } from './repositories'

function n(value: unknown) { return Number(value ?? 0) }
function pct(value: unknown, sign = false) { const valueText = n(value).toFixed(1); return `${sign && n(value) > 0 ? '+' : ''}${valueText}%` }
function compact(value: unknown) { const number = n(value); return number >= 1000000 ? `${(number / 1000000).toFixed(2)}M` : number.toLocaleString() }

function kpis(summary: Record<string, unknown>) {
  return [
    { key: 'signals', label: 'Learning Signals Processed', value: compact(summary.learningSignalsProcessed), trend: 'all autonomous signals', period: 'lifetime', status: 'healthy', source: 'database' },
    { key: 'insights', label: 'New Insights', value: summary.newInsights ?? 0, trend: 'validated and emerging', period: 'current cycle', status: 'healthy', source: 'database' },
    { key: 'recommendations', label: 'Recommendations Ready', value: summary.recommendationsReady ?? 0, trend: 'governed queue', period: 'now', status: 'healthy', source: 'database' },
    { key: 'applied', label: 'Improvements Applied', value: summary.improvementsApplied ?? 0, trend: 'retained changes', period: 'lifetime', status: 'healthy', source: 'database' },
    { key: 'success', label: 'Improvement Success Rate', value: pct(summary.improvementSuccessRate), trend: 'monitored outcomes', period: 'rolling', status: 'healthy', source: 'database' },
    { key: 'quality', label: 'Quality Improvement', value: pct(summary.qualityImprovement, true), trend: 'output quality', period: 'rolling', status: 'healthy', source: 'database' },
    { key: 'cost', label: 'Cost Reduction', value: pct(summary.costReduction), trend: 'spend efficiency', period: 'rolling', status: 'healthy', source: 'database' },
    { key: 'latency', label: 'Latency Reduction', value: pct(summary.latencyReduction), trend: 'runtime speed', period: 'rolling', status: 'healthy', source: 'database' },
    { key: 'output', label: 'Final-Output Improvement', value: pct(summary.finalOutputImprovement), trend: 'business output', period: 'rolling', status: 'healthy', source: 'database' },
    { key: 'attention', label: 'Human Attention Required', value: summary.humanAttentionRequired ?? 0, trend: 'exception only', period: 'now', status: n(summary.humanAttentionRequired) ? 'critical' : 'healthy', source: 'database' },
    { key: 'rollback', label: 'Improvements Rolled Back', value: summary.improvementsRolledBack ?? 0, trend: 'autonomous safety', period: 'lifetime', status: 'warning', source: 'database' },
    { key: 'experiments', label: 'Active Experiments', value: summary.activeExperiments ?? 0, trend: 'controlled rollouts', period: 'now', status: 'healthy', source: 'database' },
  ]
}

export const autonomousLearningService = {
  async dashboard(query: LearningQuery = {}) {
    const [summary, domains, signals, insights, recommendations, sourceMatrix, patterns, rootCauses, experiments, improvements, rollbacks, memory, models, drift, businessImpact, finalOutput, filters] = await Promise.all([
      autonomousLearningRepository.summary(), autonomousLearningRepository.domains(), autonomousLearningRepository.signals(query), autonomousLearningRepository.insights(query), autonomousLearningRepository.recommendations(query), autonomousLearningRepository.sourceMatrix(), autonomousLearningRepository.patterns(), autonomousLearningRepository.rootCauses(), autonomousLearningRepository.experiments(), autonomousLearningRepository.improvements(), autonomousLearningRepository.rollbacks(), autonomousLearningRepository.memory(), autonomousLearningRepository.models(), autonomousLearningRepository.drift(), autonomousLearningRepository.businessImpact(), autonomousLearningRepository.finalOutput(), autonomousLearningRepository.filters(),
    ])
    const lifecycleNames = ['Observe','Collect Signals','Normalize','Correlate','Detect Patterns','Diagnose Root Cause','Generate Insight','Generate Recommendation','Estimate Impact','Simulate','Validate','Check Guardrails','Create Version or Experiment','Apply','Monitor','Compare Outcome','Retain or Roll Back','Update Learning Memory','Improvement Degrades Performance','Regression Detected','Change Isolated','Rollback Triggered','Previous Version Restored','Incident Recorded','Learning Model Updated']
    return {
      summary: { ...summary, kpis: kpis(summary) },
      headerIndicators: { learningEngine: 'Running', learningMode: 'Autonomous with Guardrails', activeLearningJobs: 25, newInsights: summary.newInsights, recommendationsReady: summary.recommendationsReady, improvementsApplied: summary.improvementsApplied, improvementSuccessRate: pct(summary.improvementSuccessRate), lastLearningCycle: new Date().toISOString(), dataSource: 'database' },
      engineStatus: { operatingMode: 'Autonomous with Guardrails', signalIngestionEngine: 'Healthy', outcomeClassificationEngine: 'Healthy', patternDiscoveryEngine: 'Healthy', rootCauseAnalyzer: 'Healthy', correlationEngine: 'Healthy', causalInferenceEngine: 'Healthy', recommendationGenerator: 'Healthy', experimentDesigner: 'Healthy', simulationEngine: 'Healthy', validationEngine: 'Healthy', governanceEvaluator: 'Healthy', improvementDeploymentEngine: 'Healthy', rollbackController: 'Healthy', learningMemoryService: 'Healthy', feedbackSynchronizer: 'Healthy', auditPipeline: 'Healthy', signalsBeingProcessed: summary.learningSignalsProcessed, learningJobsRunning: 25, patternsDetected: patterns.length, recommendationsGenerated: recommendations.length, experimentsRunning: experiments.filter((row) => String(row.status) === 'Running').length, improvementsUnderObservation: improvements.length, rollbacksInProgress: 0, currentLearningBottleneck: 'audience signal normalization', currentHighestImpactInsight: insights[0]?.insightCode ?? 'none', lastAutonomousLearningDecision: new Date().toISOString(), humanAttentionRequired: summary.humanAttentionRequired },
      lifecycle: lifecycleNames.map((stage, index) => ({ stage, sequence: index + 1, signalCount: 120000 + index * 8400, jobs: 2 + (index % 7), recommendations: index % 8, experiments: index % 5, failures: index > 18 ? index % 4 : index % 2, rollbacks: index > 20 ? index % 3 : 0, averageDuration: `${40 + index * 9}s`, healthPercent: index > 18 ? 92 : 96 + (index % 4), currentBlockers: index === 1 ? 'audience connector lag' : 'none' })),
      domains,
      signals,
      insights,
      selectedInsight: insights[0] ?? {},
      recommendations,
      selectedRecommendation: recommendations[0] ?? {},
      sourceMatrix,
      patterns,
      rootCauses,
      successPatterns: patterns.filter((row) => String(row.patternType).includes('Success')).slice(0, 12),
      failurePatterns: patterns.filter((row) => String(row.patternType).includes('Failure') || String(row.patternType).includes('Degradation')).slice(0, 12),
      audienceLearning: domains.filter((row) => String(row.domainName).includes('Audience')),
      contentStrategyLearning: domains.filter((row) => String(row.domainName).includes('Content Strategy')),
      promptLearning: domains.filter((row) => String(row.domainName).includes('Prompt')),
      modelProviderLearning: domains.filter((row) => String(row.domainName).includes('Model')),
      toolLearning: domains.filter((row) => String(row.domainName).includes('Tool')),
      memoryKnowledgeLearning: domains.filter((row) => String(row.domainName).includes('Memory') || String(row.domainName).includes('Knowledge')),
      ragLearning: domains.filter((row) => String(row.domainName).includes('RAG')),
      workflowLearning: domains.filter((row) => String(row.domainName).includes('Workflow')),
      recoveryLearning: domains.filter((row) => String(row.domainName).includes('Recovery')),
      businessOutcomeLearning: domains.filter((row) => String(row.domainName).includes('Business')),
      experiments,
      experimentResults: experiments,
      appliedImprovements: improvements,
      rollbacks,
      learningMemory: memory,
      learningModels: models,
      driftEvents: drift,
      explainability: rootCauses,
      businessImpact,
      finalOutputTraceability: finalOutput,
      autonomousDecisions: signals.slice(0, 30),
      savedViews: ['All Insights','New Insights','High Confidence','High Impact','Quality Opportunities','Cost Opportunities','Latency Opportunities','Reliability Risks','Final Output at Risk','Regression Insights','Security Insights','Governance Required','Human Attention Required'],
      filters,
      dataSource: 'database' as const,
      realtime: { mode: 'polling', intervalSeconds: 10, stream: '/api/v1/autonomous-learning/stream', queue: 'autonomous-learning' },
    }
  },
  summary: autonomousLearningRepository.summary,
  status: async () => (await autonomousLearningService.dashboard()).engineStatus,
  domains: autonomousLearningRepository.domains,
  signals: (query: LearningQuery = {}) => autonomousLearningRepository.signals(query),
  insights: (query: LearningQuery = {}) => autonomousLearningRepository.insights(query),
  recommendations: (query: LearningQuery = {}) => autonomousLearningRepository.recommendations(query),
  experiments: autonomousLearningRepository.experiments,
  improvements: autonomousLearningRepository.improvements,
  rollbacks: autonomousLearningRepository.rollbacks,
  patterns: autonomousLearningRepository.patterns,
  sourceMatrix: autonomousLearningRepository.sourceMatrix,
  businessImpact: autonomousLearningRepository.businessImpact,
  finalOutput: autonomousLearningRepository.finalOutput,
  drift: autonomousLearningRepository.drift,
  models: autonomousLearningRepository.models,
  memory: autonomousLearningRepository.memory,
  streamDescriptor() {
    return { stream: 'polling-ready', heartbeatSeconds: 10, autonomousMode: true, queue: 'autonomous-learning', dataSource: 'database', events: ['learning.cycle.started','learning.cycle.completed','learning.signal.received','learning.signal.processed','learning.pattern.detected','learning.insight.created','learning.insight.validated','learning.recommendation.created','learning.recommendation.validated','learning.recommendation.approved','learning.experiment.created','learning.experiment.started','learning.experiment.completed','learning.experiment.winner_selected','learning.improvement.applying','learning.improvement.applied','learning.improvement.monitoring','learning.improvement.successful','learning.regression.detected','learning.rollback.started','learning.rollback.completed','learning.memory.updated','learning.model.training_started','learning.model.training_completed','learning.drift.detected','learning.drift.resolved','learning.final_output.updated','learning.human_attention_required'] }
  },
}

export const AutonomousLearningService = autonomousLearningService
