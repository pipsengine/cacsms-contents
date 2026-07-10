import type { WorkflowStage, WorkflowStep } from '../types/runtime'

export function calculateWorkflowProgress(stages: WorkflowStage[], steps: WorkflowStep[]) {
  const stepByStage = new Map(steps.map((step) => [step.workflowStageId, step]))
  const totalWeight = stages.reduce((sum, stage) => sum + stage.weightPercent, 0) || 1
  const weightedProgress = stages.reduce((sum, stage) => {
    const step = stepByStage.get(stage.id)
    const stageProgress = step?.status === 'completed' ? 100 : step?.progressPercent ?? 0
    return sum + stage.weightPercent * (stageProgress / 100)
  }, 0)

  return Math.round((weightedProgress / totalWeight) * 10000) / 100
}
