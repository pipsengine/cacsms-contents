import { withErrorHandling } from '@/api/middleware/withErrorHandling'
import { workflowTemplatesController } from '@/core/workflow-templates/controllers'

export const GET = withErrorHandling(() => workflowTemplatesController.finalOutputReadiness())
