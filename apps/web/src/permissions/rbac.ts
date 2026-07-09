export type PermissionCode = string
export type Principal = {
  userId: string
  roles: string[]
  permissions: PermissionCode[]
}

export function hasPermission(principal: Principal | null | undefined, permission: PermissionCode) {
  if (!principal) return false
  return principal.permissions.includes(permission) || principal.permissions.includes('*')
}

export function requirePermission(principal: Principal | null | undefined, permission: PermissionCode) {
  if (!hasPermission(principal, permission)) {
    throw new Error(`Missing permission: ${permission}`)
  }
}
