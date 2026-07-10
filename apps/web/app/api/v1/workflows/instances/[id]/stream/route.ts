import type { NextRequest } from 'next/server'
import { workflowStream } from '@/core/workflow/events/workflowStream'
import { workflowExecutionService } from '@/core/workflow/services/workflowExecutionService'

const encoder = new TextEncoder()

function sse(event: string, data: unknown) {
  return encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
}

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(sse('workflow.snapshot', await workflowExecutionService.getSnapshot(id)))
      const unsubscribe = workflowStream.subscribe(id, (update) => controller.enqueue(sse(update.event, update.payload)))
      const heartbeat = setInterval(() => controller.enqueue(sse('heartbeat', { at: new Date().toISOString() })), 15000)

      return () => {
        clearInterval(heartbeat)
        unsubscribe()
      }
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
