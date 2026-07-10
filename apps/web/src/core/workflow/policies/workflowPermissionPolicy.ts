import type { NextRequest } from 'next/server'

export function requireWorkflowPermission(request: NextRequest, permission: string) {
  const permissionHeader = request.headers.get('x-cacsms-permissions')
  if (!permissionHeader) return

  const permissions = permissionHeader.split(',').map((item) => item.trim())
  const hasPermission = permissions.includes('*') || permissions.includes(permission)

  if (hasPermission) return

  throw new Error(`Missing permission: ${permission}`)
}
