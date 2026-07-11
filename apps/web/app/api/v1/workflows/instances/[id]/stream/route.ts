import type { NextRequest } from 'next/server'
import { workflowStream } from '@/core/workflow/events/workflowStream'
import { workflowExecutionService } from '@/core/workflow/services/workflowExecutionService'

const encoder = new TextEncoder()

function sse(event: string, data: unknown) {
  return encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
}

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  let cleanup = () => {}
  const stream = new ReadableStream({
    async start(controller) {
      let closed = false
      const timers: Array<ReturnType<typeof setInterval>> = []
      let unsubscribe = () => {}
      const close = () => {
        if (closed) return
        closed = true
        timers.forEach(clearInterval)
        unsubscribe()
      }
      const send = (event: string, data: unknown) => {
        if (closed) return
        try {
          controller.enqueue(sse(event, data))
        } catch {
          close()
        }
      }

      send('workflow.snapshot', await workflowExecutionService.getSnapshot(id))
      unsubscribe = workflowStream.subscribe(id, (update) => send(update.event, update.payload))
      timers.push(setInterval(() => send('heartbeat', { at: new Date().toISOString() }), 15000))
      cleanup = close
      return close
    },

    cancel() {
      cleanup()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  })
}
