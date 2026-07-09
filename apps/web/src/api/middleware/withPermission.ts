import { requirePermission, type Principal } from '@/permissions/rbac'

export function withPermission<TArgs extends unknown[]>(
  permission: string,
  getPrincipal: () => Principal | null | undefined,
  handler: (...args: TArgs) => Promise<Response>
) {
  return async (...args: TArgs) => {
    requirePermission(getPrincipal(), permission)
    return handler(...args)
  }
}
