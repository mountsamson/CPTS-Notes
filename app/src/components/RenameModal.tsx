import { useState } from 'react'
import type { TreeNode } from '../lib/types'

interface RenameModalProps {
  node: TreeNode
  onCancel: () => void
  onRename: (newBaseName: string) => Promise<void>
}

export function RenameModal({ node, onCancel, onRename }: RenameModalProps) {
  const isMd = node.type === 'file' && node.isMarkdown
  const stem = isMd ? node.name.replace(/\.md$/i, '') : node.name
  const [value, setValue] = useState(stem)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const submit = async () => {
    if (!value.trim()) {
      setError('Name is required')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      await onRename(isMd ? `${value.trim()}.md` : value.trim())
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" style={{ width: 360 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Rename {node.type === 'dir' ? 'Folder' : 'Note'}</h2>
        </div>
        <div className="modal-body">
          <input
            className="input"
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
          />
          {isMd && <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>.md</span>}
          {error && <p className="warning-text" style={{ color: 'var(--status-critical)' }}>{error}</p>}
        </div>
        <div className="modal-footer">
          <button className="btn" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn btn-primary" disabled={submitting} onClick={submit}>
            Rename
          </button>
        </div>
      </div>
    </div>
  )
}
