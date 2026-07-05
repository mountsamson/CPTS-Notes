import { useState } from 'react'
import { MarkdownPreview } from './MarkdownPreview'
import { PropertiesPanel } from './PropertiesPanel'
import { difficultyClass } from '../lib/format'
import type { NoteFrontmatter, NoteRecord } from '../lib/types'

export type ViewMode = 'edit' | 'preview' | 'split'

interface EditorProps {
  path: string
  title: string
  dirty: boolean
  body: string
  frontmatter: NoteFrontmatter
  onBodyChange: (body: string) => void
  onFrontmatterChange: (fm: NoteFrontmatter) => void
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  notes: NoteRecord[]
  backlinks: NoteRecord[]
  onOpenWikilink: (target: string) => void
  onTagClick: (tag: string) => void
  onOpenNote: (path: string) => void
}

export function Editor({
  path,
  title,
  dirty,
  body,
  frontmatter,
  onBodyChange,
  onFrontmatterChange,
  viewMode,
  onViewModeChange,
  notes,
  backlinks,
  onOpenWikilink,
  onTagClick,
  onOpenNote,
}: EditorProps) {
  const [propsExpanded, setPropsExpanded] = useState(
    Boolean(frontmatter.country || frontmatter.difficulty || (frontmatter.tags && frontmatter.tags.length > 0)),
  )

  const diffClass = difficultyClass(frontmatter.difficulty)

  return (
    <div className="main">
      <div className="editor-toolbar">
        <div>
          <div className="editor-title">
            {title}
            {diffClass && <span className={`chip ${diffClass}`} style={{ marginLeft: 8 }}>{frontmatter.difficulty}</span>}
          </div>
          <div className="editor-path">{path}</div>
        </div>
        <div className="editor-toolbar-spacer" />
        <span className={`save-status${dirty ? ' dirty' : ''}`}>{dirty ? '● unsaved' : 'Saved'}</span>
        <div className="view-toggle">
          <button className={viewMode === 'edit' ? 'active' : ''} onClick={() => onViewModeChange('edit')}>
            Edit
          </button>
          <button className={viewMode === 'split' ? 'active' : ''} onClick={() => onViewModeChange('split')}>
            Split
          </button>
          <button className={viewMode === 'preview' ? 'active' : ''} onClick={() => onViewModeChange('preview')}>
            Preview
          </button>
        </div>
      </div>

      <PropertiesPanel
        frontmatter={frontmatter}
        onChange={onFrontmatterChange}
        expanded={propsExpanded}
        onToggleExpanded={() => setPropsExpanded((v) => !v)}
      />

      <div className={`editor-body${viewMode === 'split' ? ' split' : ''}`}>
        {(viewMode === 'edit' || viewMode === 'split') && (
          <div className="pane">
            <textarea
              className="textarea"
              value={body}
              spellCheck={false}
              onChange={(e) => onBodyChange(e.target.value)}
              placeholder="Start writing…"
            />
          </div>
        )}
        {(viewMode === 'preview' || viewMode === 'split') && (
          <div className="pane">
            <MarkdownPreview content={body} notes={notes} onOpenWikilink={onOpenWikilink} onTagClick={onTagClick} />
          </div>
        )}
      </div>

      {backlinks.length > 0 && (
        <div className="backlinks">
          <div className="backlinks-title">Linked from ({backlinks.length})</div>
          <div className="backlinks-list">
            {backlinks.map((b) => (
              <button key={b.path} className="backlink-pill" onClick={() => onOpenNote(b.path)}>
                {b.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
