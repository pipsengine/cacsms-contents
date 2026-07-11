import { EventEmitter } from 'node:events'
import type { WorkflowStreamEvent } from '../types/runtime'

const emitter = new EventEmitter()
emitter.setMaxListeners(200)

export const workflowStream = {
  publish(update: WorkflowStreamEvent) {
    for (const eventName of [update.instanceId, '*']) {
      for (const listener of emitter.listeners(eventName)) {
        const handler = listener as (update: WorkflowStreamEvent) => void
        try {
          handler(update)
        } catch {
          emitter.off(eventName, handler)
        }
      }
    }
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
