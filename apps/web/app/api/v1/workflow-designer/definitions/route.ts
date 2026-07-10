import { withErrorHandling } from '@/api/middleware/withErrorHandling'
import { workflowDesignerController } from '@/core/workflow-designer/controllers'

export const GET = withErrorHandling(() => workflowDesignerController.definitions())
export const POST = withErrorHandling(() => workflowDesignerController.disabled())
