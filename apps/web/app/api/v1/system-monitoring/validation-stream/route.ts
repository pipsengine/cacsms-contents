import { workflowStream } from '@/core/workflow/events/workflowStream'

const encoder = new TextEncoder()

function sse(event: string, data: unknown) {
  return encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
}

export async function GET() {
  const stream = new ReadableStream({
    start(controller) {
      const unsubscribe = workflowStream.subscribeAll((update) => {
        if (update.payload.instance.workflowCode === 'IMPLEMENTATION_VALIDATION') {
          controller.enqueue(sse(update.event, update.payload))
        }
      })
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
