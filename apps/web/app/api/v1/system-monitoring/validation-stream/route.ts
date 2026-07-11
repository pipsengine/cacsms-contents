import { workflowStream } from '@/core/workflow/events/workflowStream'

const encoder = new TextEncoder()

function sse(event: string, data: unknown) {
  return encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
}

export async function GET() {
  let cleanup = () => {}
  const stream = new ReadableStream({
    start(controller) {
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

      unsubscribe = workflowStream.subscribeAll((update) => {
        if (update.payload.instance.workflowCode === 'IMPLEMENTATION_VALIDATION') {
          send(update.event, update.payload)
        }
      })
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
