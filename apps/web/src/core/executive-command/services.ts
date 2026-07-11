import { executiveCommandRepository, type Row } from './repositories'

function n(value: unknown) {
  return Number(value ?? 0)
}

function avg(values: unknown[]) {
  const nums = values.map(n).filter((value) => Number.isFinite(value))
  return nums.length ? nums.reduce((sum, value) => sum + value, 0) / nums.length : 0
}

function pct(value: unknown) {
  return `${n(value).toFixed(1)}%`
}

function money(value: unknown) {
  return `$${n(value).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
}

function kpi(key: string, label: string, value: unknown, explanation: string, target = 'database target', status = 'watch') {
  return { key, label, value, trend: 'live period', target, variance: 'calculated', comparisonPeriod: 'current executive period', forecast: 'database forecast', confidence: 'live confidence', status, tooltip: explanation, drillDown: `/api/v1/executive-command/${key}`, executiveExplanation: explanation, source: 'database' }
}

function rowPanel(title: string, rows: Row[], status = 'database') {
  return { title, rows, status, count: rows.length, source: 'database' }
}

export const executiveCommandService = {
  async dashboard() {
    const [summary, status, valueChain, objectives, portfolio, initiatives, businessValue, attribution, roi, financial, productivity, adoption, maturity, risks, governance, security, resilience, capacity, investments, orgComparison, brandComparison, contentPortfolio, platforms, campaigns, workforce, scenarios, forecasts, recommendations, decisions, alerts, reports, reportSchedules, dataQuality, dataLineage, finalOutcomeTraceability, events, operationalSignals] = await Promise.all([
      executiveCommandRepository.summary(),
      executiveCommandRepository.intelligenceStatus(),
      executiveCommandRepository.valueChain(),
      executiveCommandRepository.objectives(),
      executiveCommandRepository.portfolio(),
      executiveCommandRepository.initiatives(),
      executiveCommandRepository.businessValue(),
      executiveCommandRepository.attribution(),
      executiveCommandRepository.roi(),
      executiveCommandRepository.financial(),
      executiveCommandRepository.productivity(),
      executiveCommandRepository.adoption(),
      executiveCommandRepository.maturity(),
      executiveCommandRepository.risks(),
      executiveCommandRepository.governance(),
      executiveCommandRepository.security(),
      executiveCommandRepository.resilience(),
      executiveCommandRepository.capacity(),
      executiveCommandRepository.investments(),
      executiveCommandRepository.organizationComparison(),
      executiveCommandRepository.brandComparison(),
      executiveCommandRepository.contentPortfolio(),
      executiveCommandRepository.platforms(),
      executiveCommandRepository.campaigns(),
      executiveCommandRepository.workforce(),
      executiveCommandRepository.scenarios(),
      executiveCommandRepository.forecasts(),
      executiveCommandRepository.recommendations(),
      executiveCommandRepository.decisions(),
      executiveCommandRepository.alerts(),
      executiveCommandRepository.reports(),
      executiveCommandRepository.reportSchedules(),
      executiveCommandRepository.dataQuality(),
      executiveCommandRepository.dataLineage(),
      executiveCommandRepository.finalOutcomeTraceability(),
      executiveCommandRepository.events(),
      executiveCommandRepository.operationalSignals(),
    ])

    const workflowSignal = (operationalSignals.workflows[0] ?? {}) as Row
    const agentSignal = (operationalSignals.agents[0] ?? {}) as Row
    const queueSignal = (operationalSignals.queues[0] ?? {}) as Row
    const businessValueGenerated = n(summary.businessValueGenerated) || businessValue.reduce((sum, row) => sum + n(row.businessValue), 0)
    const totalCost = n(summary.aiOperatingCost) || n(agentSignal.totalAgentCost) || roi.reduce((sum, row) => sum + n(row.totalAiCost), 0)
    const netValue = businessValueGenerated - totalCost
    const roiPercent = totalCost > 0 ? (netValue / totalCost) * 100 : avg(roi.map((row) => row.roiPercent))
    const objectivesOnTrack = objectives.filter((row) => ['on track', 'ahead', 'completed'].includes(String(row.status ?? '').toLowerCase())).length
    const portfolioHealth = n(summary.aiPortfolioHealth) || avg([...portfolio.map((row) => row.healthPercent), n(queueSignal.averageQueueHealth), n(agentSignal.averageConfidence)])
    const riskLevel = String(summary.executiveRiskLevel ?? (risks.some((row) => String(row.severity).toLowerCase() === 'critical') ? 'Critical' : risks.length ? 'Moderate' : 'Observation'))
    const humanAttention = n(summary.humanAttentionRequired) || decisions.length + risks.filter((row) => ['critical', 'high'].includes(String(row.severity).toLowerCase())).length

    return {
      summary: {
        ...summary,
        aiPortfolioHealth: portfolioHealth,
        strategicObjectivesOnTrack: `${objectivesOnTrack} of ${objectives.length}`,
        aiRoi: roiPercent,
        businessValueGenerated,
        aiOperatingCost: totalCost,
        netAiValue: netValue,
        humanHoursAvoided: n(summary.humanHoursAvoided) || productivity.reduce((sum, row) => sum + n(row.humanHoursAvoided), 0),
        revenueAttributedToAi: n(summary.revenueAttributedToAi) || attribution.reduce((sum, row) => sum + n(row.financialValue), 0),
        executiveRiskLevel: riskLevel,
        humanAttentionRequired: humanAttention,
      },
      headerIndicators: {
        executiveIntelligenceEngine: status.currentExecutiveIntelligenceMode ?? 'Observation Only',
        aiPortfolioHealth: pct(portfolioHealth),
        strategicObjectivesOnTrack: `${objectivesOnTrack} of ${objectives.length}`,
        aiRoi: pct(roiPercent),
        businessValueGenerated: money(businessValueGenerated),
        executiveRiskLevel: riskLevel,
        forecastConfidence: pct(avg(forecasts.map((row) => row.confidence))),
        lastExecutiveUpdate: status.lastExecutiveUpdate ?? workflowSignal.lastUpdate ?? agentSignal.lastUpdate ?? null,
        dataSource: 'database',
      },
      kpis: [
        kpi('portfolio', 'AI Portfolio Health', pct(portfolioHealth), 'Aggregated from executive portfolio rows, workflow health, queue health, and agent confidence.', '95%', portfolioHealth >= 90 ? 'healthy' : 'watch'),
        kpi('objectives', 'Strategic Objectives On Track', `${objectivesOnTrack} of ${objectives.length}`, 'Counts objectives with On Track, Ahead, or Completed status.', 'all critical objectives'),
        kpi('roi', 'AI ROI', pct(roiPercent), 'Calculated as net AI value divided by total AI cost.', 'positive ROI', roiPercent > 0 ? 'healthy' : 'watch'),
        kpi('business-value', 'Business Value Generated', money(businessValueGenerated), 'Live executive business value attribution from database rows.', 'growth'),
        kpi('financial', 'AI Operating Cost', money(totalCost), 'Total operating cost from executive ROI rows and live agent run cost.', 'within budget'),
        kpi('net-value', 'Net AI Value', money(netValue), 'Business value generated minus AI operating cost.', 'positive net value', netValue >= 0 ? 'healthy' : 'watch'),
        kpi('productivity', 'Human Hours Avoided', `${n(summary.humanHoursAvoided) || productivity.reduce((sum, row) => sum + n(row.humanHoursAvoided), 0)} hrs`, 'Automation dividend from productivity rows.', 'increase'),
        kpi('revenue', 'Revenue Attributed to AI', money(n(summary.revenueAttributedToAi) || attribution.reduce((sum, row) => sum + n(row.financialValue), 0)), 'Commercial value attributed to AI outputs.', 'increase'),
        kpi('risks', 'Executive Risk Level', riskLevel, 'Highest current strategic and business risk posture.', 'low'),
        kpi('decisions', 'Human Attention Required', humanAttention, 'Only executive exceptions and decisions requiring attention.', '0', humanAttention ? 'watch' : 'healthy'),
        kpi('adoption', 'AI Adoption Rate', pct(avg(adoption.map((row) => row.adoptionRate))), 'Adoption score by organization, business unit, and capability.', '85%'),
        kpi('maturity', 'AI Maturity Score', `${avg(maturity.map((row) => row.currentScore)).toFixed(1)} / 5`, 'Maturity across strategy, governance, security, data, technology, adoption, and business integration.', '4.0 / 5'),
      ],
      intelligenceStatus: {
        ...status,
        currentExecutiveIntelligenceMode: status.currentExecutiveIntelligenceMode ?? 'Observation Only',
        dataFreshness: status.dataFreshness ?? 'database-backed',
        organizationsReporting: status.organizationsReporting ?? orgComparison.length,
        brandsReporting: status.brandsReporting ?? brandComparison.length,
        initiativesMonitored: status.initiativesMonitored ?? initiatives.length,
        businessKpisConnected: status.businessKpisConnected ?? businessValue.length,
        forecastJobsRunning: status.forecastJobsRunning ?? forecasts.length,
        openStrategicRisks: status.openStrategicRisks ?? risks.length,
        recommendationsAwaitingReview: status.recommendationsAwaitingReview ?? recommendations.length,
        currentStrategicBottleneck: status.currentStrategicBottleneck ?? (risks[0]?.riskDomain ?? 'none'),
        lastAutonomousExecutiveInsight: status.lastAutonomousExecutiveInsight ?? (recommendations[0]?.recommendation ?? 'none'),
        humanAttentionRequired: humanAttention,
      },
      valueChain,
      strategicObjectives: objectives,
      portfolioOverview: portfolio,
      initiatives,
      selectedInitiative: initiatives[0] ?? {},
      businessValue,
      attribution,
      roi,
      financial,
      productivity,
      adoption,
      maturity,
      risks,
      governance,
      security,
      resilience,
      capacity,
      investments,
      organizationComparison: orgComparison,
      brandComparison,
      contentPortfolio,
      platforms,
      campaigns,
      workforce,
      scenarios,
      forecasts,
      recommendations,
      decisionQueue: decisions,
      alerts,
      reports,
      reportSchedules,
      dataQuality,
      dataLineage,
      finalOutcomeTraceability,
      emergencyExecutiveView: rowPanel('Emergency Executive View', risks.filter((row) => ['critical', 'high'].includes(String(row.severity).toLowerCase()))),
      timeline: events,
      operationalSignals,
      dataSource: 'database',
      realtime: executiveCommandService.streamDescriptor(),
    }
  },

  async section(section: string) {
    const dashboard = await executiveCommandService.dashboard()
    const map: Record<string, unknown> = {
      summary: dashboard.summary,
      status: dashboard.intelligenceStatus,
      'value-chain': dashboard.valueChain,
      objectives: dashboard.strategicObjectives,
      portfolio: dashboard.portfolioOverview,
      initiatives: dashboard.initiatives,
      'business-value': dashboard.businessValue,
      roi: dashboard.roi,
      financial: dashboard.financial,
      productivity: dashboard.productivity,
      adoption: dashboard.adoption,
      maturity: dashboard.maturity,
      risks: dashboard.risks,
      'governance-readiness': dashboard.governance,
      'security-readiness': dashboard.security,
      resilience: dashboard.resilience,
      'capacity-forecast': dashboard.capacity,
      investments: dashboard.investments,
      'organization-comparison': dashboard.organizationComparison,
      'brand-comparison': dashboard.brandComparison,
      'content-portfolio': dashboard.contentPortfolio,
      platforms: dashboard.platforms,
      campaigns: dashboard.campaigns,
      workforce: dashboard.workforce,
      scenarios: dashboard.scenarios,
      forecasts: dashboard.forecasts,
      recommendations: dashboard.recommendations,
      decisions: dashboard.decisionQueue,
      alerts: dashboard.alerts,
      reports: dashboard.reports,
      'report-schedules': dashboard.reportSchedules,
      'data-quality': dashboard.dataQuality,
      'final-outcome-traceability': dashboard.finalOutcomeTraceability,
    }
    return map[section] ?? dashboard
  },

  streamDescriptor() {
    return {
      stream: 'polling-ready',
      heartbeatSeconds: 10,
      autonomousMode: true,
      dataSource: 'database',
      queue: 'executive-intelligence',
      events: ['executive.intelligence.updated', 'executive.objective.status_changed', 'executive.portfolio.health_changed', 'executive.business_value.updated', 'executive.roi.updated', 'executive.risk.changed', 'executive.forecast.updated', 'executive.recommendation.created', 'executive.decision.required', 'executive.report.generated', 'executive.final_outcome.updated'],
    }
  },
}

export const ExecutiveCommandCenterService = executiveCommandService
