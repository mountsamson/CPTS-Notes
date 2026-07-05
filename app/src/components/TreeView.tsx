import type { CSSProperties } from 'react'
import type { TreeNode } from '../lib/types'

export interface EntryActions {
  onOpen: (path: string) => void
  onNewNoteAt: (dir: string) => void
  onNewFolderAt: (dir: string) => void
  onRename: (node: TreeNode) => void
  onDelete: (node: TreeNode) => void
  onRevealInFinder: (path: string) => void
}

interface TreeViewProps {
  nodes: TreeNode[]
  activeFile: string | null
  expandedDirs: Set<string>
  onToggleDir: (path: string) => void
  openMenuPath: string | null
  onSetOpenMenu: (path: string | null) => void
  actions: EntryActions
}

function iconFor(node: TreeNode): string {
  if (node.type === 'dir') return '📁'
  if (node.isMarkdown) return '📝'
  const lower = node.name.toLowerCase()
  if (/\.(png|jpe?g|gif|webp)$/.test(lower)) return '🖼'
  if (/\.(ps1|sh|py|rb)$/.test(lower)) return '⚙️'
  return '📄'
}

export function TreeView({
  nodes,
  activeFile,
  expandedDirs,
  onToggleDir,
  openMenuPath,
  onSetOpenMenu,
  actions,
}: TreeViewProps) {
  return (
    <div className="tree-node">
      {nodes.map((node) => (
        <TreeRow
          key={node.path}
          node={node}
          activeFile={activeFile}
          expandedDirs={expandedDirs}
          onToggleDir={onToggleDir}
          openMenuPath={openMenuPath}
          onSetOpenMenu={onSetOpenMenu}
          actions={actions}
        />
      ))}
    </div>
  )
}

function TreeRow({
  node,
  activeFile,
  expandedDirs,
  onToggleDir,
  openMenuPath,
  onSetOpenMenu,
  actions,
}: {
  node: TreeNode
  activeFile: string | null
  expandedDirs: Set<string>
  onToggleDir: (path: string) => void
  openMenuPath: string | null
  onSetOpenMenu: (path: string | null) => void
  actions: EntryActions
}) {
  const isDir = node.type === 'dir'
  const expanded = isDir && expandedDirs.has(node.path)
  const isActive = !isDir && node.path === activeFile
  const menuOpen = openMenuPath === node.path
  const nonMd = node.type === 'file' && !node.isMarkdown

  return (
    <div>
      <div
        className={`tree-row${isActive ? ' active' : ''}${nonMd ? ' non-md' : ''}`}
        onClick={() => (isDir ? onToggleDir(node.path) : actions.onOpen(node.path))}
      >
        <span className="twisty">{isDir ? (expanded ? '▾' : '▸') : ''}</span>
        <span className="icon">{iconFor(node)}</span>
        <span className="name">{node.type === 'file' ? node.name.replace(/\.md$/i, '') : node.name}</span>
        <button
          className="row-menu-btn"
          onClick={(e) => {
            e.stopPropagation()
            onSetOpenMenu(menuOpen ? null : node.path)
          }}
        >
          ⋯
        </button>
      </div>
      {menuOpen && (
        <RowMenu
          node={node}
          onClose={() => onSetOpenMenu(null)}
          actions={actions}
        />
      )}
      {isDir && expanded && (
        <div className="tree-children">
          <TreeView
            nodes={node.children}
            activeFile={activeFile}
            expandedDirs={expandedDirs}
            onToggleDir={onToggleDir}
            openMenuPath={openMenuPath}
            onSetOpenMenu={onSetOpenMenu}
            actions={actions}
          />
        </div>
      )}
    </div>
  )
}

function RowMenu({
  node,
  onClose,
  actions,
}: {
  node: TreeNode
  onClose: () => void
  actions: EntryActions
}) {
  const isDir = node.type === 'dir'
  const dir = isDir ? node.path : node.path.slice(0, node.path.lastIndexOf('/')) || ''
  const run = (fn: () => void) => () => {
    fn()
    onClose()
  }
  return (
    <div className="filter-banner" style={{ margin: '2px 10px 6px 30px', flexDirection: 'column', alignItems: 'stretch', gap: 4 }}>
      {isDir && (
        <>
          <button style={menuBtnStyle} onClick={run(() => actions.onNewNoteAt(dir))}>
            New note here
          </button>
          <button style={menuBtnStyle} onClick={run(() => actions.onNewFolderAt(dir))}>
            New folder here
          </button>
        </>
      )}
      <button style={menuBtnStyle} onClick={run(() => actions.onRename(node))}>
        Rename
      </button>
      {node.type === 'file' && !node.isMarkdown && (
        <button style={menuBtnStyle} onClick={run(() => actions.onRevealInFinder(node.path))}>
          Reveal in Finder
        </button>
      )}
      <button style={{ ...menuBtnStyle, color: 'var(--status-critical)' }} onClick={run(() => actions.onDelete(node))}>
        Delete
      </button>
    </div>
  )
}

const menuBtnStyle: CSSProperties = {
  background: 'none',
  border: 'none',
  color: 'var(--text-secondary)',
  textAlign: 'left',
  fontSize: 11.5,
  padding: '4px 6px',
  borderRadius: 4,
}
