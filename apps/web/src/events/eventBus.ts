export type DomainEvent<TPayload = unknown> = {
  id: string
  name: string
  payload: TPayload
  occurredAt: string
  correlationId?: string
}

type Handler<TPayload = unknown> = (event: DomainEvent<TPayload>) => void | Promise<void>

const handlers = new Map<string, Handler[]>()

export const eventBus = {
  subscribe<TPayload>(name: string, handler: Handler<TPayload>) {
    const current = handlers.get(name) ?? []
    handlers.set(name, [...current, handler as Handler])
  },

  async publish<TPayload>(name: string, payload: TPayload, correlationId?: string) {
    const event: DomainEvent<TPayload> = {
      id: crypto.randomUUID(),
      name,
      payload,
      occurredAt: new Date().toISOString(),
      correlationId,
    }

    await Promise.all((handlers.get(name) ?? []).map((handler) => handler(event)))
    await Promise.all((handlers.get('*') ?? []).map((handler) => handler(event)))
    return event
  },
}
