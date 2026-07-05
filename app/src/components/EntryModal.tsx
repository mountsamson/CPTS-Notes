import { useState } from 'react'
import { COUNTRY_NAMES } from '../lib/countries'
import type { NoteFrontmatter } from '../lib/types'

export interface CreateNoteResult {
  dir: string
  name: string
  templatePath?: string
  frontmatter: NoteFrontmatter
}

export interface CreateFolderResult {
  dir: string
  name: string
}

interface EntryModalProps {
  mode: 'note' | 'folder'
  defaultDir: string
  allDirs: string[]
  templates: { name: string; path: string }[]
  onCancel: () => void
  onCreateNote?: (result: CreateNoteResult) => Promise<void>
  onCreateFolder?: (result: CreateFolderResult) => Promise<void>
  prefillName?: string
}

export function EntryModal({
  mode,
  defaultDir,
  allDirs,
  templates,
  onCancel,
  onCreateNote,
  onCreateFolder,
  prefillName,
}: EntryModalProps) {
  const [dir, setDir] = useState(defaultDir)
  const [name, setName] = useState(prefillName ?? '')
  const [templatePath, setTemplatePath] = useState('')
  const [tags, setTags] = useState('')
  const [difficulty, setDifficulty] = useState('')
  const [os, setOs] = useState('')
  const [ip, setIp] = useState('')
  const [country, setCountry] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const submit = async () => {
    if (!name.trim()) {
      setError('Name is required')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      if (mode === 'note' && onCreateNote) {
        const frontmatter: NoteFrontmatter = {
          tags: tags
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean),
          difficulty: difficulty || undefined,
          os: os || undefined,
          ip: ip || undefined,
          country: country || undefined,
        }
        await onCreateNote({ dir, name: name.trim(), templatePath: templatePath || undefined, frontmatter })
      } else if (mode === 'folder' && onCreateFolder) {
        await onCreateFolder({ dir, name: name.trim() })
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{mode === 'note' ? 'New Note' : 'New Folder'}</h2>
        </div>
        <div className="modal-body">
          <div className="field-row">
            <div>
              <label className="field-label">Folder</label>
              <select className="select" value={dir} onChange={(e) => setDir(e.target.value)}>
                <option value="">(vault root)</option>
                {allDirs.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label">{mode === 'note' ? 'File name' : 'Folder name'}</label>
              <input
                className="input"
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={mode === 'note' ? 'e.g. TargetBox' : 'e.g. Client-Acme'}
                onKeyDown={(e) => e.key === 'Enter' && submit()}
              />
            </div>
          </div>

          {mode === 'note' && (
            <>
              <div>
                <label className="field-label">Template</label>
                <select className="select" value={templatePath} onChange={(e) => setTemplatePath(e.target.value)}>
                  <option value="">Blank note</option>
                  {templates.map((t) => (
                    <option key={t.path} value={t.path}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field-row">
                <div>
                  <label className="field-label">Tags</label>
                  <input className="input" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="htb, easy, linux" />
                </div>
                <div>
                  <label className="field-label">Difficulty</label>
                  <select className="select" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                    <option value="">—</option>
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
              </div>
              <div className="field-row">
                <div>
                  <label className="field-label">OS</label>
                  <input className="input" value={os} onChange={(e) => setOs(e.target.value)} placeholder="Linux" />
                </div>
                <div>
                  <label className="field-label">IP address</label>
                  <input className="input" value={ip} onChange={(e) => setIp(e.target.value)} placeholder="10.129.x.x" />
                </div>
              </div>
              <div>
                <label className="field-label">Location (world map)</label>
                <input
                  className="input"
                  list="country-list-modal"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="Country…"
                />
                <datalist id="country-list-modal">
                  {COUNTRY_NAMES.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>
            </>
          )}

          {error && <p className="warning-text" style={{ color: 'var(--status-critical)' }}>{error}</p>}
        </div>
        <div className="modal-footer">
          <button className="btn" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn btn-primary" disabled={submitting} onClick={submit}>
            Create
          </button>
        </div>
      </div>
    </div>
  )
}
