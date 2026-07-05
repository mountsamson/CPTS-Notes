import { useEffect, useMemo, useState } from 'react'
import { Sidebar } from './components/Sidebar'
import { Editor, type ViewMode } from './components/Editor'
import { WorldMap } from './components/WorldMap'
import { CommandPalette } from './components/CommandPalette'
import { EntryModal, type CreateNoteResult, type CreateFolderResult } from './components/EntryModal'
import { RenameModal } from './components/RenameModal'
import { ConfirmDialog } from './components/ConfirmDialog'
import type { EntryActions } from './components/TreeView'
import { buildNoteRecord, buildBacklinks, resolveWikilink } from './lib/vaultIndex'
import { parseFrontmatter, stringifyWithFrontmatter } from './lib/frontmatter'
import { createSearchIndex } from './lib/search'
import { dirname, joinPath } from './lib/format'
import type { NoteFrontmatter, NoteRecord, TreeNode } from './lib/types'

type ModalState =
  | { type: 'newNote'; dir: string; prefillName?: string }
  | { type: 'newFolder'; dir: string }
  | { type: 'rename'; node: TreeNode }
  | { type: 'delete'; node: TreeNode }
  | null

function collectDirs(nodes: TreeNode[], acc: string[] = []): string[] {
  for (const n of nodes) {
    if (n.type === 'dir') {
      acc.push(n.path)
      collectDirs(n.children, acc)
    }
  }
  return acc
}

function collectMarkdownPaths(nodes: TreeNode[], acc: string[] = []): string[] {
  for (const n of nodes) {
    if (n.type === 'dir') collectMarkdownPaths(n.children, acc)
    else if (n.isMarkdown) acc.push(n.path)
  }
  return acc
}

export default function App() {
  const [loading, setLoading] = useState(true)
  const [vaultRoot, setVaultRoot] = useState('')
  const [tree, setTree] = useState<TreeNode[]>([])
  const [templates, setTemplates] = useState<{ name: string; path: string }[]>([])
  const [notesByPath, setNotesByPath] = useState<Map<string, NoteRecord>>(new Map())

  const [view, setView] = useState<'notes' | 'map'>('notes')
  const [activeFile, setActiveFile] = useState<string | null>(null)
  const [draftBody, setDraftBody] = useState('')
  const [draftFrontmatter, setDraftFrontmatter] = useState<NoteFrontmatter>({})
  const [dirty, setDirty] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('split')

  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set())
  const [openMenuPath, setOpenMenuPath] = useState<string | null>(null)
  const [filterQuery, setFilterQuery] = useState('')
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [modal, setModal] = useState<ModalState>(null)

  const notes = useMemo(() => [...notesByPath.values()], [notesByPath])
  const backlinksByPath = useMemo(() => buildBacklinks(notes), [notes])
  const allDirs = useMemo(() => collectDirs(tree), [tree])
  const sidebarFuse = useMemo(() => createSearchIndex(notes), [notes])

  async function loadVault() {
    const [root, treeData, templateList] = await Promise.all([
      window.vaultAPI.getRoot(),
      window.vaultAPI.listTree(),
      window.vaultAPI.listTemplates(),
    ])
    const mdPaths = collectMarkdownPaths(treeData)
    const entries = await Promise.all(
      mdPaths.map(async (p) => {
        const raw = await window.vaultAPI.readFile(p)
        return [p, buildNoteRecord(p, raw)] as const
      }),
    )
    setVaultRoot(root)
    setTree(treeData)
    setTemplates(templateList)
    setNotesByPath(new Map(entries))
    setLoading(false)
  }

  useEffect(() => {
    loadVault()
    const unsubscribe = window.vaultAPI.onRootChanged(() => {
      setActiveFile(null)
      setDirty(false)
      loadVault()
    })
    return unsubscribe
  }, [])

  // Autosave: flush the current draft ~700ms after the last edit.
  useEffect(() => {
    if (!activeFile || !dirty) return
    const t = setTimeout(() => {
      saveActive()
    }, 700)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftBody, draftFrontmatter, activeFile, dirty])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey
      if (mod && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen(true)
      }
      if (mod && e.key.toLowerCase() === 's') {
        e.preventDefault()
        saveActive()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFile, draftBody, draftFrontmatter])

  useEffect(() => {
    const handler = () => setOpenMenuPath(null)
    window.addEventListener('click', handler)
    return () => window.removeEventListener('click', handler)
  }, [])

  async function saveActive() {
    if (!activeFile) return
    const content = stringifyWithFrontmatter(draftFrontmatter, draftBody)
    await window.vaultAPI.writeFile(activeFile, content)
    setNotesByPath((prev) => {
      const next = new Map(prev)
      next.set(activeFile, buildNoteRecord(activeFile, content))
      return next
    })
    setDirty(false)
  }

  async function openFile(path: string) {
    if (activeFile && dirty) await saveActive()
    const record = notesByPath.get(path)
    if (!record) return
    setActiveFile(path)
    setDraftBody(record.body)
    setDraftFrontmatter(record.frontmatter)
    setDirty(false)
    setView('notes')
  }

  function toggleDir(path: string) {
    setExpandedDirs((prev) => {
      const next = new Set(prev)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })
  }

  function handleOpenWikilink(target: string) {
    const resolved = resolveWikilink(notes, target)
    if (resolved) {
      openFile(resolved.path)
    } else {
      setModal({ type: 'newNote', dir: activeFile ? dirname(activeFile) : '', prefillName: target })
    }
  }

  function handleTagClick(tag: string) {
    setFilterQuery(`#${tag}`)
    setView('notes')
  }

  async function handleCreateNote({ dir, name, templatePath, frontmatter }: CreateNoteResult) {
    let body = `# ${name}\n\n`
    if (templatePath) {
      const raw = await window.vaultAPI.readFile(templatePath)
      body = parseFrontmatter(raw).body
    }
    const content = stringifyWithFrontmatter(frontmatter, body)
    const relPath = joinPath(dir, `${name}.md`)
    await window.vaultAPI.createFile(relPath, content)
    if (dir) setExpandedDirs((prev) => new Set(prev).add(dir))
    setActiveFile(relPath)
    setDraftBody(body)
    setDraftFrontmatter(frontmatter)
    setDirty(false)
    setView('notes')
    setModal(null)
    loadVault()
  }

  async function handleCreateFolder({ dir, name }: CreateFolderResult) {
    const relPath = joinPath(dir, name)
    await window.vaultAPI.createFolder(relPath)
    if (dir) setExpandedDirs((prev) => new Set(prev).add(dir))
    setModal(null)
    loadVault()
  }

  async function handleRename(node: TreeNode, newBaseName: string) {
    const dir = dirname(node.path)
    const newPath = joinPath(dir, newBaseName)
    await window.vaultAPI.rename(node.path, newPath)
    if (activeFile === node.path) setActiveFile(newPath)
    if (node.type === 'dir') {
      setExpandedDirs((prev) => {
        const next = new Set<string>()
        for (const p of prev) {
          if (p === node.path) next.add(newPath)
          else if (p.startsWith(node.path + '/')) next.add(newPath + p.slice(node.path.length))
          else next.add(p)
        }
        return next
      })
    }
    setModal(null)
    loadVault()
  }

  async function handleDelete(node: TreeNode) {
    await window.vaultAPI.deleteItem(node.path)
    if (activeFile === node.path || (node.type === 'dir' && activeFile?.startsWith(node.path + '/'))) {
      setActiveFile(null)
      setDraftBody('')
      setDraftFrontmatter({})
      setDirty(false)
    }
    setModal(null)
    loadVault()
  }

  const actions: EntryActions = {
    onOpen: openFile,
    onNewNoteAt: (dir) => setModal({ type: 'newNote', dir }),
    onNewFolderAt: (dir) => setModal({ type: 'newFolder', dir }),
    onRename: (node) => setModal({ type: 'rename', node }),
    onDelete: (node) => setModal({ type: 'delete', node }),
    onRevealInFinder: (path) => window.vaultAPI.openInFinder(path),
  }

  const filteredResults = useMemo(() => {
    const q = filterQuery.trim()
    if (!q) return null
    if (q.startsWith('#')) {
      const tag = q.slice(1).toLowerCase()
      if (!tag) return notes
      return notes.filter((n) => n.tags.some((t) => t.includes(tag)))
    }
    return sidebarFuse.search(q).map((r) => r.item)
  }, [filterQuery, notes, sidebarFuse])

  if (loading) {
    return (
      <div className="app-shell" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--text-muted)' }}>Loading vault…</div>
      </div>
    )
  }

  return (
    <div className="app-shell">
      <div className="titlebar">
        <div className="brand">
          <span className="brand-mark">▓</span> Pentest Vault
        </div>
        <div className="tabs">
          <button className={`tab-btn${view === 'notes' ? ' active' : ''}`} onClick={() => setView('notes')}>
            Notes
          </button>
          <button className={`tab-btn${view === 'map' ? ' active' : ''}`} onClick={() => setView('map')}>
            World Map
          </button>
        </div>
        <div className="titlebar-search">
          <input className="input" placeholder="⌘K to search everything…" onFocus={() => setPaletteOpen(true)} readOnly />
        </div>
        <div className="titlebar-spacer" />
      </div>

      <div className="body-row">
        <Sidebar
          tree={tree}
          activeFile={activeFile}
          expandedDirs={expandedDirs}
          onToggleDir={toggleDir}
          openMenuPath={openMenuPath}
          onSetOpenMenu={setOpenMenuPath}
          actions={actions}
          vaultRoot={vaultRoot}
          onChooseRoot={() => window.vaultAPI.chooseRoot()}
          filterQuery={filterQuery}
          onFilterQueryChange={setFilterQuery}
          filteredResults={filteredResults}
          onNewNoteRoot={() => setModal({ type: 'newNote', dir: activeFile ? dirname(activeFile) : '' })}
          onNewFolderRoot={() => setModal({ type: 'newFolder', dir: '' })}
        />

        {view === 'map' ? (
          <WorldMap notes={notes} onOpenNote={openFile} />
        ) : activeFile ? (
          <Editor
            key={activeFile}
            path={activeFile}
            title={activeFile.split('/').pop()!.replace(/\.md$/i, '')}
            dirty={dirty}
            body={draftBody}
            frontmatter={draftFrontmatter}
            onBodyChange={(b) => {
              setDraftBody(b)
              setDirty(true)
            }}
            onFrontmatterChange={(fm) => {
              setDraftFrontmatter(fm)
              setDirty(true)
            }}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            notes={notes}
            backlinks={backlinksByPath.get(activeFile) ?? []}
            onOpenWikilink={handleOpenWikilink}
            onTagClick={handleTagClick}
            onOpenNote={openFile}
          />
        ) : (
          <div className="no-file">
            <div>Select a note, or create a new one to get started.</div>
            <button className="btn btn-primary" onClick={() => setModal({ type: 'newNote', dir: '' })}>
              + New Note
            </button>
          </div>
        )}
      </div>

      {paletteOpen && <CommandPalette notes={notes} onClose={() => setPaletteOpen(false)} onOpen={openFile} />}

      {modal?.type === 'newNote' && (
        <EntryModal
          mode="note"
          defaultDir={modal.dir}
          allDirs={allDirs}
          templates={templates}
          prefillName={modal.prefillName}
          onCancel={() => setModal(null)}
          onCreateNote={handleCreateNote}
        />
      )}
      {modal?.type === 'newFolder' && (
        <EntryModal
          mode="folder"
          defaultDir={modal.dir}
          allDirs={allDirs}
          templates={templates}
          onCancel={() => setModal(null)}
          onCreateFolder={handleCreateFolder}
        />
      )}
      {modal?.type === 'rename' && (
        <RenameModal node={modal.node} onCancel={() => setModal(null)} onRename={(name) => handleRename(modal.node, name)} />
      )}
      {modal?.type === 'delete' && (
        <ConfirmDialog
          title={`Delete ${modal.node.type === 'dir' ? 'Folder' : 'Note'}`}
          message={`Move "${modal.node.name}" to the OS Trash? ${modal.node.type === 'dir' ? 'This includes everything inside it.' : ''} You can recover it from Trash if this was a mistake.`}
          confirmLabel="Move to Trash"
          danger
          onCancel={() => setModal(null)}
          onConfirm={() => handleDelete(modal.node)}
        />
      )}
    </div>
  )
}
