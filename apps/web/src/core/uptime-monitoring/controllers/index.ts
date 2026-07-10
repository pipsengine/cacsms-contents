import type { NextRequest } from 'next/server'
import { apiDatabase, apiResponse } from '@/shared/api/apiResponse'
import { uptimeMonitoringService } from '../services'

async function body(request: NextRequest) {
  try {
    return (await request.json()) as Record<string, unknown>
  } catch {
    return {}
  }
}

export const uptimeMonitoringController = {
  async dashboard() {
    return apiDatabase(await uptimeMonitoringService.dashboard(), 'Uptime monitoring loaded.')
  },
  async summary() {
    return apiDatabase(await uptimeMonitoringService.summary(), 'Uptime summary loaded.')
  },
  async monitors() {
    return apiDatabase(await uptimeMonitoringService.monitors(), 'Uptime monitors loaded.')
  },
  async monitor(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params
    return apiDatabase(await uptimeMonitoringService.monitor(id), 'Uptime monitor loaded.')
  },
  async history(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params
    return apiDatabase(await uptimeMonitoringService.history(id), 'Uptime history loaded.')
  },
  async incidents() {
    return apiDatabase(await uptimeMonitoringService.incidents(), 'Uptime incidents loaded.')
  },
  async sla() {
    return apiDatabase(await uptimeMonitoringService.sla(), 'Uptime SLA loaded.')
  },
  async maintenance() {
    return apiDatabase(await uptimeMonitoringService.maintenance(), 'Uptime maintenance loaded.')
  },
  async runCheck(request: NextRequest) {
    const input = await body(request)
    return apiResponse({ data: await uptimeMonitoringService.runCheck(input.monitorId ? String(input.monitorId) : undefined), message: 'Availability check completed.', metadata: { source: 'database' }, httpStatus: 201 })
  },
  async runMonitor(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params
    return apiResponse({ data: await uptimeMonitoringService.runCheck(id), message: 'Monitor check completed.', metadata: { source: 'database' }, httpStatus: 201 })
  },
  async pause(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params
    return apiDatabase(await uptimeMonitoringService.pause(id), 'Monitor paused.')
  },
  async resume(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params
    return apiDatabase(await uptimeMonitoringService.resume(id), 'Monitor resumed.')
  },
  async stream() {
    return apiResponse({ data: { stream: 'polling-ready', events: ['monitor.check.started', 'monitor.check.completed', 'monitor.degraded', 'monitor.offline', 'monitor.recovered', 'sla.at_risk', 'sla.breached'] }, message: 'Uptime stream endpoint registered.', metadata: { source: 'database' } })
  },
}
