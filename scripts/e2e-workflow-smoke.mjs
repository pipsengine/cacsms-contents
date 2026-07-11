const baseUrl = process.env.CACSMS_BASE_URL || 'http://localhost:3333'
const timeoutMs = Number(process.env.CACSMS_E2E_TIMEOUT_MS || 90000)

function url(path) {
  return new URL(path, baseUrl).toString()
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

async function parseResponse(response, path) {
  const text = await response.text()
  let payload
  try {
    payload = text ? JSON.parse(text) : null
  } catch {
    throw new Error(`${path} returned non-JSON: ${text.slice(0, 200)}`)
  }
  if (!response.ok || payload?.success === false) {
    throw new Error(`${path} failed (${response.status}): ${payload?.message || text}`)
  }
  return payload
}

async function getJson(path) {
  const response = await fetch(url(path), { cache: 'no-store' })
  return parseResponse(response, path)
}

async function postJson(path, body, headers = {}) {
  const response = await fetch(url(path), {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
  })
  return parseResponse(response, path)
}

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function waitForWorkflow(instanceId, terminal = ['completed', 'failed', 'cancelled', 'stopped']) {
  const started = Date.now()
  let snapshot = null
  while (Date.now() - started < timeoutMs) {
    const payload = await getJson(`/api/v1/workflows/instances/${instanceId}`)
    snapshot = payload.data
    if (terminal.includes(String(snapshot.instance.status).toLowerCase())) return snapshot
    await wait(1500)
  }
  throw new Error(`Workflow ${instanceId} did not reach terminal state within ${timeoutMs}ms. Last status: ${snapshot?.instance?.status}`)
}

async function waitForSystemStatus(expectedStatuses) {
  const started = Date.now()
  let status = null
  while (Date.now() - started < timeoutMs) {
    const payload = await getJson('/api/v1/system/status')
    status = String(payload.data?.status || '').toLowerCase()
    if (expectedStatuses.includes(status)) return payload
    await wait(1000)
  }
  throw new Error(`System status did not become ${expectedStatuses.join(' or ')} within ${timeoutMs}ms. Last status: ${status}`)
}

async function main() {
  const before = await getJson('/api/v1/system/status')
  assert(before.data, 'system status must return data')

  const stopStartedAt = Date.now()
  const stopped = await postJson('/api/v1/system/stop', { requestedBy: 'e2e-workflow-smoke' })
  assert(Date.now() - stopStartedAt < 5000, 'stop endpoint must return quickly and let the workflow continue asynchronously')
  assert(stopped.data?.instance?.workflowCode === 'SYSTEM_SHUTDOWN', 'stop must create or return SYSTEM_SHUTDOWN workflow')
  const repeatedStop = await postJson('/api/v1/system/stop', { requestedBy: 'e2e-workflow-smoke' })
  assert(repeatedStop.data?.instance?.id === stopped.data?.instance?.id, 'repeated stop should return the active shutdown workflow')
  const stoppedStatus = await waitForSystemStatus(['stopped', 'shutdown', 'offline'])
  assert(['stopped', 'shutdown', 'offline'].includes(String(stoppedStatus.data.status).toLowerCase()), `system should be stopped, got ${stoppedStatus.data.status}`)

  const startStartedAt = Date.now()
  const started = await postJson('/api/v1/system/start', { requestedBy: 'e2e-workflow-smoke' })
  assert(Date.now() - startStartedAt < 5000, 'start endpoint must return quickly and let the workflow continue asynchronously')
  assert(started.data?.instance?.workflowCode === 'SYSTEM_STARTUP', 'start must create or return SYSTEM_STARTUP workflow')
  const repeatedStart = await postJson('/api/v1/system/start', { requestedBy: 'e2e-workflow-smoke' })
  assert(repeatedStart.data?.instance?.id === started.data?.instance?.id, 'repeated start should return the active startup workflow')
  const startedStatus = await waitForSystemStatus(['operational'])
  assert(String(startedStatus.data.status).toLowerCase() === 'operational', `system should be started, got ${startedStatus.data.status}`)

  const created = await postJson(
    '/api/v1/workflows/instances',
    {
      workflowCode: 'CONTENT_LIFECYCLE',
      requestedBy: 'e2e-workflow-smoke',
      context: { source: 'e2e-workflow-smoke', finalOutputRequired: true },
    },
    { 'x-cacsms-permissions': '*' }
  )
  const instanceId = created.data?.instance?.id
  assert(instanceId, 'content workflow must return an instance id')

  const finalSnapshot = await waitForWorkflow(instanceId)
  assert(finalSnapshot.steps?.length > 0, 'content workflow must create stage rows')
  assert(finalSnapshot.logs?.length > 0, 'content workflow must create log rows')
  assert(Number(finalSnapshot.instance.progressPercent) >= 0, 'content workflow must persist progress')
  const finalStatus = String(finalSnapshot.instance.status).toLowerCase()
  assert(finalStatus === 'completed', `content workflow should complete, got ${finalSnapshot.instance.status}`)

  const persisted = await getJson(`/api/v1/workflows/instances/${instanceId}`)
  assert(persisted.data.instance.status === finalSnapshot.instance.status, 'workflow status must persist across reload')
  const hasFinalOutput = persisted.data.logs.some((log) => String(log.message || '').toLowerCase().includes('completed'))
  assert(hasFinalOutput, 'workflow logs must include a final completed output reference')

  const queues = await getJson('/api/v1/workflows/queues')
  assert(queues.data, 'queue endpoint must return live data')

  console.log(JSON.stringify({
    ok: true,
    baseUrl,
    systemStatus: startedStatus.data.status,
    contentWorkflow: {
      id: instanceId,
      status: persisted.data.instance.status,
      progressPercent: persisted.data.instance.progressPercent,
      steps: persisted.data.steps.length,
      logs: persisted.data.logs.length,
    },
    queuesLoaded: true,
  }, null, 2))
}

main().catch((error) => {
  console.error(error.stack || error.message)
  process.exit(1)
})
