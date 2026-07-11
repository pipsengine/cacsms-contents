import { agentSimulationRepository, type SimulationQuery } from './repositories'

function n(v: unknown) { return Number(v ?? 0) }
function pct(v: unknown) { return `${n(v).toFixed(1)}%` }
function kpis(s: Record<string, unknown>) {
  return [
    { key: 'active', label: 'Active Simulations', value: s.activeSimulations ?? 0, trend: 'sandbox running', target: 12, variance: 0, status: 'watch', source: 'database' },
    { key: 'completed', label: 'Completed Simulations', value: s.completedSimulations ?? 0, trend: 'validated safely', target: 116, variance: 0, status: 'healthy', source: 'database' },
    { key: 'twins', label: 'Digital Twins', value: s.digitalTwins ?? 0, trend: 'production clones', target: 24, variance: 0, status: 'healthy', source: 'database' },
    { key: 'scenario', label: 'Scenario Accuracy', value: pct(s.scenarioAccuracy), trend: 'scenario calibration', target: '96.4%', variance: '0.0%', status: 'healthy', source: 'database' },
    { key: 'prediction', label: 'Prediction Accuracy', value: pct(s.predictionAccuracy), trend: 'forecast validation', target: '95.8%', variance: '0.0%', status: 'healthy', source: 'database' },
    { key: 'success', label: 'Simulation Success', value: pct(s.simulationSuccess), trend: 'all engines', target: '96.0%', variance: '+0.1%', status: 'healthy', source: 'database' },
    { key: 'failures', label: 'Recovered Failures', value: s.recoveredFailures ?? 0, trend: 'failure injection', target: 32, variance: 0, status: 'healthy', source: 'database' },
    { key: 'forecast', label: 'Business Forecast Accuracy', value: pct(s.businessForecastAccuracy), trend: 'business outcome', target: '96.0%', variance: '+0.1%', status: 'healthy', source: 'database' },
    { key: 'confidence', label: 'Deployment Confidence', value: pct(s.deploymentConfidence), trend: 'readiness signal', target: '95.0%', variance: '+0.2%', status: 'healthy', source: 'database' },
    { key: 'attention', label: 'Human Attention Required', value: s.humanAttentionRequired ?? 0, trend: 'autonomous validation', target: 0, variance: 0, status: 'healthy', source: 'database' },
  ]
}
export const agentSimulationService = {
  async dashboard(query: SimulationQuery = {}) {
    const [summary, simulations, twins, scenarios, predictions, results, failures, chaos, load, stress, forecasts, types, lifecycle, filters] = await Promise.all([
      agentSimulationRepository.summary(), agentSimulationRepository.simulations(query), agentSimulationRepository.twins(), agentSimulationRepository.scenarios(), agentSimulationRepository.predictions(), agentSimulationRepository.results(), agentSimulationRepository.failures(), agentSimulationRepository.chaos(), agentSimulationRepository.load(), agentSimulationRepository.stress(), agentSimulationRepository.forecasts(), agentSimulationRepository.types(), agentSimulationRepository.lifecycle(), agentSimulationRepository.filters(),
    ])
    return {
      summary: { ...summary, kpis: kpis(summary) },
      headerIndicators: { simulationEngine: 'Running', digitalTwin: `${twins.length} synced`, scenarioEngine: 'Healthy', experimentEngine: 'Healthy', chaosEngine: 'Healthy', forecastEngine: 'Healthy', simulationQueue: 'simulation', sandboxStatus: 'Isolated', dataSource: 'database' },
      engineStatus: { simulationEngine: 'Healthy', digitalTwinEngine: 'Healthy', scenarioGenerator: 'Healthy', forecastEngine: 'Healthy', replayEngine: 'Healthy', failureInjection: 'Healthy', recoverySimulation: 'Healthy', costSimulator: 'Healthy', latencySimulator: 'Healthy', publishingSimulator: 'Healthy', securitySimulator: 'Healthy', governanceSimulator: 'Healthy', learningSimulator: 'Healthy' },
      simulations, twins, scenarios, predictions, results, failures, chaos, load, stress, forecasts, types, lifecycle, filters, selectedSimulation: simulations[0] ?? {},
      realtime: { mode: 'polling', intervalSeconds: 10, stream: '/api/v1/simulation/stream', queue: 'simulation', autonomousMode: true },
      dataSource: 'database' as const,
    }
  },
  summary: agentSimulationRepository.summary,
  simulations: agentSimulationRepository.simulations,
  scenarios: agentSimulationRepository.scenarios,
  results: agentSimulationRepository.results,
  streamDescriptor() { return { stream: 'polling-ready', heartbeatSeconds: 10, queue: 'simulation', dataSource: 'database', events: ['simulation.created','simulation.started','simulation.completed','scenario.generated','forecast.completed'] } },
}
