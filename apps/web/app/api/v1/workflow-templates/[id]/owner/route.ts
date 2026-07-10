import { withErrorHandling } from '@/api/middleware/withErrorHandling'
import { workflowTemplatesController } from '@/core/workflow-templates/controllers'
export const PATCH = withErrorHandling(() => workflowTemplatesController.disabled())
