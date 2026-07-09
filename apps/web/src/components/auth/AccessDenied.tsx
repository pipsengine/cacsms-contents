'use client'

import Link from 'next/link'
import { ArrowLeft, LockKeyhole, Send } from 'lucide-react'
import { usePermissions } from '@/hooks/usePermissions'

export function AccessDenied({ permission }: { permission?: string }) {
  const { roleLabel } = usePermissions()

  return (
    <div className="access-denied-shell">
      <div className="access-denied-card">
        <div className="access-denied-icon">
          <LockKeyhole size={28} />
        </div>
        <h1>Access restricted</h1>
        <p>You do not have permission to view this page or perform this action.</p>
        <div className="access-denied-meta">
          <span>Required permission</span>
          <strong>{permission ?? 'Not specified'}</strong>
        </div>
        <div className="access-denied-meta">
          <span>Current role</span>
          <strong>{roleLabel}</strong>
        </div>
        <div className="access-denied-actions">
          <button type="button" className="primary-action-button">
            <Send size={16} />
            Request access
          </button>
          <Link href="/" className="secondary-action-button">
            <ArrowLeft size={16} />
            Back to dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}

