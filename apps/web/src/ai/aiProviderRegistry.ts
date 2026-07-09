export type AiProvider = {
  id: string
  name: string
  invoke(prompt: string, options?: Record<string, unknown>): Promise<unknown>
}

const providers = new Map<string, AiProvider>()

export const aiProviderRegistry = {
  register(provider: AiProvider) {
    providers.set(provider.id, provider)
  },

  get(id: string) {
    return providers.get(id)
  },

  list() {
    return Array.from(providers.values())
  },
}
