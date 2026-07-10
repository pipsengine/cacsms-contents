import { apiResponse } from '@/shared/api/apiResponse'

function disabled(message: string) {
  return apiResponse({ data: null, status: 'error', httpStatus: 405, message })
}

export const workflowApprovalController = {
  async approve(...args: unknown[]) {
    void args
    return disabled('Manual workflow approval is disabled. Workflows run autonomously after Start and can only be stopped by an operator.')
  },

  async reject(...args: unknown[]) {
    void args
    return disabled('Manual workflow rejection is disabled. Workflows run autonomously after Start and can only be stopped by an operator.')
  },

  async requestChanges(...args: unknown[]) {
    void args
    return disabled('Manual change requests are disabled. Workflows run autonomously after Start and can only be stopped by an operator.')
  },
}
