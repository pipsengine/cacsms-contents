import { auditLogRepository } from '@cacsms/database'
import { logger } from '@/shared/logging/logger'

export type AuditAction = 'insert' | 'update' | 'delete' | 'publish' | 'approve' | 'reject' | string

export const auditService = {
  async log(action: AuditAction, entityName: string, metadata: Record<string, unknown> = {}) {
    try {
      return await auditLogRepository.log(action, entityName, metadata)
    } catch (error) {
      logger.warn(error, 'Audit log database write failed')
      return null
    }
  },
}
