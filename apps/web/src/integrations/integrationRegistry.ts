export type IntegrationConnection = {
  id: string
  provider: string
  status: 'connected' | 'degraded' | 'failed' | 'disabled'
}

const connections = new Map<string, IntegrationConnection>()

export const integrationRegistry = {
  register(connection: IntegrationConnection) {
    connections.set(connection.id, connection)
  },

  list() {
    return Array.from(connections.values())
  },
}
