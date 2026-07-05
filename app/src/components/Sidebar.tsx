import type { NoteRecord, TreeNode } from '../lib/types'
import { TreeView, type EntryActions } from './TreeView'

interface SidebarProps {
  tree: TreeNode[]
  activeFile: string | null
  expandedDirs: Set<string>
  onToggleDir: (path: string) => void
  openMenuPath: string | null
  onSetOpenMenu: (path: string | null) => void
  actions: EntryActions
  vaultRoot: string
  onChooseRoot: () => void
  filterQuery: string
  onFilterQueryChange: (q: string) => void
  filteredResults: NoteRecord[] | null
  onNewNoteRoot: () => void
  onNewFolderRoot: () => void
}

export function Sidebar({
  tree,
  activeFile,
  expandedDirs,
  onToggleDir,
  openMenuPath,
  onSetOpenMenu,
  actions,
  vaultRoot,
  onChooseRoot,
  filterQuery,
  onFilterQueryChange,
  filteredResults,
  onNewNoteRoot,
  onNewFolderRoot,
}: SidebarProps) {
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="vault-path" title={vaultRoot} onClick={onChooseRoot}>
          🗂 {vaultRoot}
        </div>
        <input
          className="input"
          placeholder="Filter notes… (#tag for tags)"
          value={filterQuery}
          onChange={(e) => onFilterQueryChange(e.target.value)}
        />
        <div className="sidebar-actions">
          <button className="btn btn-primary" onClick={onNewNoteRoot}>
            + Note
          </button>
          <button className="btn" onClick={onNewFolderRoot}>
            + Folder
          </button>
        </div>
      </div>
      <div className="sidebar-scroll">
        {filteredResults ? (
          filteredResults.length === 0 ? (
            <div className="empty-hint">No notes match "{filterQuery}"</div>
          ) : (
            filteredResults.map((note) => (
              <div key={note.path} className="result-item" onClick={() => actions.onOpen(note.path)}>
                <div className="result-title">{note.name}</div>
                <div className="result-path">{note.path}</div>
                {note.tags.length > 0 && (
                  <div className="result-tags">
                    {note.tags.slice(0, 6).map((t) => (
                      <span key={t} className="chip">
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))
          )
        ) : (
          <TreeView
            nodes={tree}
            activeFile={activeFile}
            expandedDirs={expandedDirs}
            onToggleDir={onToggleDir}
            openMenuPath={openMenuPath}
            onSetOpenMenu={onSetOpenMenu}
            actions={actions}
          />
        )}
      </div>
    </div>
  )
}
