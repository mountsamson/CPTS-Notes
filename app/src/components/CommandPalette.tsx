import { useEffect, useMemo, useState } from 'react'
import { createSearchIndex } from '../lib/search'
import type { NoteRecord } from '../lib/types'

interface CommandPaletteProps {
  notes: NoteRecord[]
  onClose: () => void
  onOpen: (path: string) => void
}

export function CommandPalette({ notes, onClose, onOpen }: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(0)
  const fuse = useMemo(() => createSearchIndex(notes), [notes])

  const results = useMemo(() => {
    if (!query.trim()) return notes.slice(0, 20)
    return fuse.search(query).slice(0, 20).map((r) => r.item)
  }, [query, fuse, notes])

  useEffect(() => setSelected(0), [query])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelected((s) => Math.min(s + 1, results.length - 1))
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelected((s) => Math.max(s - 1, 0))
      }
      if (e.key === 'Enter') {
        e.preventDefault()
        const item = results[selected]
        if (item) {
          onOpen(item.path)
          onClose()
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [results, selected, onOpen, onClose])

  return (
    <div className="palette-overlay" onClick={onClose}>
      <div className="palette" onClick={(e) => e.stopPropagation()}>
        <input
          autoFocus
          placeholder="Jump to a note by name, tag, or heading…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="palette-results">
          {results.length === 0 && <div className="empty-hint">No matches</div>}
          {results.map((note, i) => (
            <div
              key={note.path}
              className={`palette-item${i === selected ? ' selected' : ''}`}
              onMouseEnter={() => setSelected(i)}
              onClick={() => {
                onOpen(note.path)
                onClose()
              }}
            >
              <span className="name">{note.name}</span>
              <span className="path">{note.path}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
