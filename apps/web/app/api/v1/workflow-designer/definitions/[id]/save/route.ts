import { withErrorHandling } from '@/api/middleware/withErrorHandling'
import { workflowDesignerController } from '@/core/workflow-designer/controllers'

export const POST = withErrorHandling(() => workflowDesignerController.disabled())
