'use client'

import { cloneElement, isValidElement, type MouseEventHandler } from 'react'
import { useAuth } from './AuthProvider'

export function ActionGuard({
  permission,
  children,
  mode = 'hide',
}: {
  permission?: string
  children: React.ReactNode
  mode?: 'hide' | 'disable'
}) {
  const { canAccess, loading, audit } = useAuth()
  const allowed = canAccess(permission)

  if (loading) return null
  if (allowed) return <>{children}</>
  if (mode === 'hide') return null

  if (isValidElement<{ disabled?: boolean; title?: string; onClick?: MouseEventHandler }>(children)) {
    return cloneElement(children, {
      disabled: true,
      title: permission ? `Requires ${permission}` : 'Permission required',
      onClick: (event) => {
        event.preventDefault()
        event.stopPropagation()
        void audit({
          action: 'action.blocked',
          resource: 'action_guard',
          permission,
          status: 'blocked',
        })
      },
    })
  }

  return (
    <span
      className="action-guard-disabled"
      title={permission ? `Requires ${permission}` : 'Permission required'}
      onClick={() => {
        void audit({
          action: 'action.blocked',
          resource: 'action_guard',
          permission,
          status: 'blocked',
        })
      }}
    >
      {children}
    </span>
  )
}
