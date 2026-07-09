export const permissions = {
  navigationRead: 'navigation:read',
  monitoringRead: 'system-monitoring:read',
  monitoringRunDiagnostics: 'system-monitoring:diagnostics:run',
  auditRead: 'audit:read',
  adminAll: '*',
} as const

export type Permission = (typeof permissions)[keyof typeof permissions]

