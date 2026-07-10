import { EventEmitter } from 'node:events'
import type { WorkflowStreamEvent } from '../types/runtime'

const emitter = new EventEmitter()
emitter.setMaxListeners(200)

export const workflowStream = {
  publish(update: WorkflowStreamEvent) {
    emitter.emit(update.instanceId, update)
    emitter.emit('*', update)
  },

  subscribe(instanceId: string, handler: (update: WorkflowStreamEvent) => void) {
    emitter.on(instanceId, handler)
    return () => emitter.off(instanceId, handler)
  },

  subscribeAll(handler: (update: WorkflowStreamEvent) => void) {
    emitter.on('*', handler)
    return () => emitter.off('*', handler)
  },
}
