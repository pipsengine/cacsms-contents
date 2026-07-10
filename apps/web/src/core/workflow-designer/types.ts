export type WorkflowDesignerData = {
  definitions: Array<Record<string, unknown>>
  selectedDefinition: Record<string, unknown> | null
  versions: Array<Record<string, unknown>>
  canvas: {
    nodes: Array<Record<string, unknown>>
    connections: Array<Record<string, unknown>>
    groups: Array<Record<string, unknown>>
    annotations: Array<Record<string, unknown>>
    variables: Array<Record<string, unknown>>
    inputSchemas: Array<Record<string, unknown>>
    outputSchemas: Array<Record<string, unknown>>
  }
  nodeTypes: Array<Record<string, unknown>>
  templates: Array<Record<string, unknown>>
  validation: Array<Record<string, unknown>>
  simulations: Array<Record<string, unknown>>
  history: Array<Record<string, unknown>>
  documentation: Record<string, unknown>
  estimates: Record<string, unknown>
  summary: Record<string, unknown>
  dataSource: 'database'
}
