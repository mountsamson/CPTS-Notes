import { useState } from 'react'

interface ConfirmDialogProps {
  title: string
  message: string
  confirmLabel?: string
  danger?: boolean
  onCancel: () => void
  onConfirm: () => Promise<void>
}

export function ConfirmDialog({ title, message, confirmLabel = 'Confirm', danger, onCancel, onConfirm }: ConfirmDialogProps) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    setSubmitting(true)
    setError(null)
    try {
      await onConfirm()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" style={{ width: 380 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
        </div>
        <div className="modal-body">
          <p className="warning-text">{message}</p>
          {error && <p className="warning-text" style={{ color: 'var(--status-critical)' }}>{error}</p>}
        </div>
        <div className="modal-footer">
          <button className="btn" onClick={onCancel}>
            Cancel
          </button>
          <button className={danger ? 'btn btn-danger' : 'btn btn-primary'} disabled={submitting} onClick={submit}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
