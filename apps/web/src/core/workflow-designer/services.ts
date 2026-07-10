import { workflowDesignerRepository } from './repositories'

export const workflowDesignerService = {
  async dashboard(definitionId?: string) {
    const definitions = await workflowDesignerRepository.definitions()
    const selectedId = definitionId ?? String((definitions.find((definition) => Number(definition.nodeCount ?? 0) > 0) ?? definitions[0])?.id ?? '')
    const selectedDefinition = selectedId ? await workflowDesignerRepository.definition(selectedId) : null
    const [versions, canvas, nodeTypes, templates, validation, simulations, history, documentation] = selectedId
      ? await Promise.all([
          workflowDesignerRepository.versions(selectedId),
          workflowDesignerRepository.canvas(selectedId),
          workflowDesignerRepository.nodeTypes(),
          workflowDesignerRepository.templates(),
          workflowDesignerRepository.validation(selectedId),
          workflowDesignerRepository.simulations(selectedId),
          workflowDesignerRepository.history(selectedId),
          workflowDesignerRepository.documentation(selectedId),
        ])
      : [[], { nodes: [], connections: [], groups: [], annotations: [], variables: [], inputSchemas: [], outputSchemas: [] }, [], [], [], [], [], {}]
    return {
      definitions,
      selectedDefinition,
      versions,
      canvas,
      nodeTypes,
      templates,
      validation,
      simulations,
      history,
      documentation,
      estimates: documentation,
      summary: {
        definitionCount: definitions.length,
        nodeTypeCount: nodeTypes.length,
        templateCount: templates.length,
        nodeCount: canvas.nodes.length,
        connectionCount: canvas.connections.length,
        validationStatus: validation[0]?.status ?? 'unknown',
        simulationStatus: simulations[0]?.status ?? 'unknown',
        autosaveStatus: 'database synchronized',
      },
      dataSource: 'database' as const,
    }
  },
  definitions: workflowDesignerRepository.definitions,
  nodeTypes: workflowDesignerRepository.nodeTypes,
  templates: workflowDesignerRepository.templates,
  definition: workflowDesignerRepository.definition,
  versions: workflowDesignerRepository.versions,
  canvas: workflowDesignerRepository.canvas,
  validation: workflowDesignerRepository.validation,
  simulations: workflowDesignerRepository.simulations,
  history: workflowDesignerRepository.history,
  documentation: workflowDesignerRepository.documentation,
  streamDescriptor() {
    return {
      stream: 'polling-ready',
      events: ['workflow.design.updated', 'workflow.design.autosaved', 'workflow.validation.completed', 'workflow.simulation.completed', 'workflow.version.published'],
      heartbeatSeconds: 10,
      autonomousMode: true,
      dataSource: 'database',
    }
  },
}
