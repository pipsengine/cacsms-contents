import { aiStrategyRepository } from './repositories'

function n(value: unknown) { return Number(value ?? 0) }
function avg(values: unknown[]) { const nums = values.map(n).filter(Number.isFinite); return nums.length ? nums.reduce((sum, value) => sum + value, 0) / nums.length : 0 }
function pct(value: unknown) { return `${n(value).toFixed(1)}%` }
function money(value: unknown) { return `$${n(value).toLocaleString(undefined, { maximumFractionDigits: 0 })}` }
function kpi(key: string, label: string, value: unknown, explanation: string, target = 'database target', status = 'watch') {
  return { key, label, value, trend: 'live planning cycle', target, variance: 'calculated', comparisonPeriod: 'current portfolio period', forecast: 'database forecast', confidence: 'live confidence', status, tooltip: explanation, drillDown: `/api/v1/ai-strategy/${key}`, executiveExplanation: explanation, source: 'database' }
}

export const aiStrategyService = {
  async dashboard() {
    const [summary, status, valueChain, themes, objectives, portfolios, programs, initiatives, prioritization, portfolioBalance, funding, capacity, demandForecast, roadmap, milestones, stageGates, dependencies, duplicates, benefits, benefitReviews, risks, assumptions, constraints, scenarios, decisions, retirements, maturityRoadmap, alignment, analytics, recommendations, finalOutcomeTraceability, reports, events, operationalSignals] = await Promise.all([
      aiStrategyRepository.summary(), aiStrategyRepository.status(), aiStrategyRepository.valueChain(), aiStrategyRepository.themes(), aiStrategyRepository.objectives(), aiStrategyRepository.portfolios(), aiStrategyRepository.programs(), aiStrategyRepository.initiatives(), aiStrategyRepository.prioritization(), aiStrategyRepository.portfolioBalance(), aiStrategyRepository.funding(), aiStrategyRepository.capacity(), aiStrategyRepository.demandForecast(), aiStrategyRepository.roadmap(), aiStrategyRepository.milestones(), aiStrategyRepository.stageGates(), aiStrategyRepository.dependencies(), aiStrategyRepository.duplicates(), aiStrategyRepository.benefits(), aiStrategyRepository.benefitReviews(), aiStrategyRepository.risks(), aiStrategyRepository.assumptions(), aiStrategyRepository.constraints(), aiStrategyRepository.scenarios(), aiStrategyRepository.decisions(), aiStrategyRepository.retirements(), aiStrategyRepository.maturityRoadmap(), aiStrategyRepository.alignment(), aiStrategyRepository.analytics(), aiStrategyRepository.recommendations(), aiStrategyRepository.finalOutcomeTraceability(), aiStrategyRepository.reports(), aiStrategyRepository.events(), aiStrategyRepository.operationalSignals(),
    ])
    const plannedInvestment = n(summary.totalPlannedInvestment) || initiatives.reduce((sum, row) => sum + n(row.plannedInvestment), 0)
    const expectedValue = n(summary.expectedPortfolioValue) || initiatives.reduce((sum, row) => sum + n(row.expectedValue), 0)
    const realizedValue = benefits.reduce((sum, row) => sum + n(row.realizedValue), 0)
    const roi = plannedInvestment > 0 ? ((expectedValue - plannedInvestment) / plannedInvestment) * 100 : avg(initiatives.map((row) => row.forecastRoi))
    const health = n(summary.portfolioHealth) || avg([...portfolios.map((row) => row.portfolioHealth), ...programs.map((row) => row.programHealth), ...initiatives.map((row) => row.finalOutcomeReadiness)])
    const fundingGap = n(summary.fundingGap) || funding.reduce((sum, row) => sum + n(row.fundingGap), 0)
    const capacityGap = n(summary.capacityGap) || avg(capacity.map((row) => row.capacityGap))
    const atRiskObjectives = n(summary.strategicObjectivesAtRisk) || objectives.filter((row) => ['at risk', 'behind', 'blocked'].includes(String(row.status).toLowerCase())).length
    const humanAttention = n(summary.humanAttentionRequired) || decisions.length + risks.filter((row) => ['critical', 'high'].includes(String(row.severity).toLowerCase())).length

    return {
      summary: { ...summary, portfolioHealth: health, totalPlannedInvestment: plannedInvestment, expectedPortfolioValue: expectedValue, forecastPortfolioRoi: roi, benefitsRealized: expectedValue > 0 ? (realizedValue / expectedValue) * 100 : avg(benefits.map((row) => row.realizationPercent)), strategicObjectivesAtRisk: atRiskObjectives, humanAttentionRequired: humanAttention, fundingGap, capacityGap },
      headerIndicators: { strategyEngine: status.currentStrategyMode ?? 'Observation Only', activeStrategicThemes: themes.length, activePrograms: programs.length, activeInitiatives: initiatives.length, portfolioHealth: pct(health), expectedPortfolioValue: money(expectedValue), benefitsRealization: pct(expectedValue > 0 ? (realizedValue / expectedValue) * 100 : 0), strategicRisk: risks.length ? risks[0]?.severity ?? 'Observation' : 'Observation', lastPortfolioUpdate: status.lastPortfolioUpdate ?? events[0]?.createdAt ?? null, dataSource: 'database' },
      kpis: [
        kpi('portfolio-health', 'Portfolio Health', pct(health), 'Aggregated from portfolio, program, initiative, and final-outcome readiness.', '95%', health >= 90 ? 'healthy' : 'watch'),
        kpi('objectives', 'Active Strategic Objectives', objectives.length, 'Active strategy objective registry rows.', 'approved objectives'),
        kpi('programs', 'Active Programs', programs.length, 'Programs linked to portfolios and objectives.', 'funded programs'),
        kpi('initiatives', 'Active Initiatives', initiatives.length, 'Initiatives under assessment, production, scaling, optimization, or review.', 'prioritized initiatives'),
        kpi('funding', 'Total Planned Investment', money(plannedInvestment), 'Planned investment across initiatives and portfolio funding rows.', 'approved budget'),
        kpi('value', 'Expected Portfolio Value', money(expectedValue), 'Forecast value across strategy initiatives.', 'positive value'),
        kpi('roi', 'Forecast Portfolio ROI', pct(roi), 'Expected portfolio value minus planned investment divided by planned investment.', 'positive ROI', roi > 0 ? 'healthy' : 'watch'),
        kpi('benefits', 'Benefits Realized', pct(expectedValue > 0 ? (realizedValue / expectedValue) * 100 : avg(benefits.map((row) => row.realizationPercent))), 'Realized benefit value against expected portfolio value.', 'on plan'),
        kpi('risks', 'Strategic Objectives at Risk', atRiskObjectives, 'Objectives with At Risk, Behind, or Blocked status.', '0', atRiskObjectives ? 'watch' : 'healthy'),
        kpi('decisions', 'Human Attention Required', humanAttention, 'Only governance, funding, risk, or executive strategy decisions.', '0', humanAttention ? 'watch' : 'healthy'),
        kpi('funding-gap', 'Funding Gap', money(fundingGap), 'Unfunded strategy and portfolio demand.', '$0', fundingGap ? 'watch' : 'healthy'),
        kpi('capacity-gap', 'Capacity Gap', pct(capacityGap), 'Average capacity gap across strategy capacity rows.', '0%', capacityGap ? 'watch' : 'healthy'),
      ],
      operatingStatus: { ...status, currentStrategyMode: status.currentStrategyMode ?? 'Observation Only', objectivesBeingMonitored: status.objectivesBeingMonitored ?? objectives.length, programsBeingEvaluated: status.programsBeingEvaluated ?? programs.length, initiativesBeingScored: status.initiativesBeingScored ?? initiatives.length, fundingRequestsOpen: status.fundingRequestsOpen ?? funding.length, portfolioScenariosRunning: status.portfolioScenariosRunning ?? scenarios.length, benefitsReviewsDue: status.benefitsReviewsDue ?? benefitReviews.length, strategicRisksOpen: status.strategicRisksOpen ?? risks.length, currentPortfolioBottleneck: status.currentPortfolioBottleneck ?? risks[0]?.riskName ?? 'none', currentHighestPriorityRecommendation: status.currentHighestPriorityRecommendation ?? recommendations[0]?.recommendation ?? 'none', lastAutonomousStrategyDecision: status.lastAutonomousStrategyDecision ?? events[0]?.message ?? 'none', humanAttentionRequired: humanAttention },
      valueChain, themes, objectives, portfolios, programs, initiatives, selectedObjective: objectives[0] ?? {}, selectedPortfolio: portfolios[0] ?? {}, selectedProgram: programs[0] ?? {}, selectedInitiative: initiatives[0] ?? {},
      prioritization, portfolioBalance, funding, capacity, demandForecast, roadmap, milestones, stageGates, dependencies, duplicates, benefits, benefitAttribution: benefits, benefitReviews, risks, assumptions, constraints, scenarios, decisions, retirements, maturityRoadmap, alignment, analytics, recommendations, finalOutcomeTraceability, reports, timeline: events, operationalSignals, dataSource: 'database', realtime: aiStrategyService.streamDescriptor(),
    }
  },

  async section(section: string) {
    const data = await aiStrategyService.dashboard()
    const map: Record<string, unknown> = { summary: data.summary, status: data.operatingStatus, 'value-chain': data.valueChain, themes: data.themes, objectives: data.objectives, portfolios: data.portfolios, programs: data.programs, initiatives: data.initiatives, prioritization: data.prioritization, 'portfolio-balance': data.portfolioBalance, funding: data.funding, capacity: data.capacity, 'demand-forecast': data.demandForecast, roadmap: data.roadmap, milestones: data.milestones, 'stage-gates': data.stageGates, dependencies: data.dependencies, duplicates: data.duplicates, benefits: data.benefits, 'benefit-reviews': data.benefitReviews, risks: data.risks, assumptions: data.assumptions, constraints: data.constraints, scenarios: data.scenarios, decisions: data.decisions, retirements: data.retirements, 'maturity-roadmap': data.maturityRoadmap, alignment: data.alignment, analytics: data.analytics, recommendations: data.recommendations, 'final-outcome-traceability': data.finalOutcomeTraceability, reports: data.reports }
    return map[section] ?? data
  },

  streamDescriptor() {
    return { stream: 'polling-ready', heartbeatSeconds: 10, autonomousMode: true, dataSource: 'database', queue: 'ai-strategy-portfolio', events: ['strategy.objective.created','strategy.objective.updated','strategy.objective.at_risk','strategy.portfolio.health_changed','strategy.initiative.scored','strategy.funding.gap_detected','strategy.capacity.gap_detected','strategy.dependency.blocked','strategy.duplicate.detected','strategy.benefit.realized','strategy.risk.changed','strategy.scenario.completed','strategy.recommendation.created','strategy.decision.required','strategy.final_outcome.updated'] }
  },
}

export const AiStrategyPortfolioService = aiStrategyService
