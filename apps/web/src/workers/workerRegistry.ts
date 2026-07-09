type WorkerHandler<TPayload = unknown> = (payload: TPayload) => Promise<void>

const workers = new Map<string, WorkerHandler>()

export const workerRegistry = {
  register<TPayload>(name: string, handler: WorkerHandler<TPayload>) {
    workers.set(name, handler as WorkerHandler)
  },

  get(name: string) {
    return workers.get(name)
  },

  list() {
    return Array.from(workers.keys())
  },
}
