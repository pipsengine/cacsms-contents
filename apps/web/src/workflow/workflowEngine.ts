import { eventBus } from '@/events/eventBus'

export type WorkflowTransition = {
  from: string
  to: string
  action: string
}

export type WorkflowExecutionState = {
  workflowId: string
  currentStage: string
  status: 'pending' | 'running' | 'completed' | 'failed'
}

export const workflowEngine = {
  async transition(state: WorkflowExecutionState, transition: WorkflowTransition) {
    if (state.currentStage !== transition.from) {
      throw new Error(`Invalid transition from ${state.currentStage} using ${transition.action}`)
    }

    const nextState = { ...state, currentStage: transition.to }
    await eventBus.publish('workflow.transitioned', { previous: state, next: nextState, transition })
    return nextState
  },
}
