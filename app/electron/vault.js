const fs = require('node:fs')
const path = require('node:path')
const { app, shell } = require('electron')

const CONFIG_PATH = path.join(app.getPath('userData'), 'vault-config.json')
// app/electron -> app -> vault root (the Notes folder itself)
const DEFAULT_VAULT_PATH = path.resolve(__dirname, '..', '..')

const SKIP_NAMES = new Set(['node_modules'])

function isHidden(name) {
  return name.startsWith('.')
}

function loadConfig() {
  try {
    const raw = fs.readFileSync(CONFIG_PATH, 'utf-8')
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

function saveConfig(config) {
  fs.mkdirSync(path.dirname(CONFIG_PATH), { recursive: true })
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8')
}

class Vault {
  constructor() {
    const config = loadConfig()
    if (config.vaultPath && fs.existsSync(config.vaultPath)) {
      this.root = config.vaultPath
    } else {
      this.root = DEFAULT_VAULT_PATH
    }
  }

  getRoot() {
    return this.root
  }

  setRoot(newPath) {
    if (!fs.existsSync(newPath) || !fs.statSync(newPath).isDirectory()) {
      throw new Error('Selected path is not a valid directory')
    }
    this.root = newPath
    saveConfig({ vaultPath: newPath })
    return this.root
  }

  // Resolves a vault-relative path and guarantees it stays inside the vault root.
  resolveSafe(relPath) {
    const cleaned = (relPath || '').replace(/^[/\\]+/, '')
    const resolved = path.resolve(this.root, cleaned)
    const rootWithSep = this.root.endsWith(path.sep) ? this.root : this.root + path.sep
    if (resolved !== this.root && !resolved.startsWith(rootWithSep)) {
      throw new Error('Path escapes vault root')
    }
    return resolved
  }

  listTree() {
    const walk = (dirAbs, relSoFar) => {
      let entries
      try {
        entries = fs.readdirSync(dirAbs, { withFileTypes: true })
      } catch {
        return []
      }
      const nodes = entries
        .filter((e) => !isHidden(e.name) && !SKIP_NAMES.has(e.name))
        .filter((e) => !(relSoFar === '' && e.name === 'app'))
        .map((e) => {
          const relPath = relSoFar ? `${relSoFar}/${e.name}` : e.name
          const absPath = path.join(dirAbs, e.name)
          if (e.isDirectory()) {
            return {
              name: e.name,
              path: relPath,
              type: 'dir',
              children: walk(absPath, relPath),
            }
          }
          return {
            name: e.name,
            path: relPath,
            type: 'file',
            isMarkdown: e.name.toLowerCase().endsWith('.md'),
          }
        })
      nodes.sort((a, b) => {
        if (a.type !== b.type) return a.type === 'dir' ? -1 : 1
        return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
      })
      return nodes
    }
    return walk(this.root, '')
  }

  readFile(relPath) {
    const abs = this.resolveSafe(relPath)
    return fs.readFileSync(abs, 'utf-8')
  }

  writeFile(relPath, content) {
    const abs = this.resolveSafe(relPath)
    fs.mkdirSync(path.dirname(abs), { recursive: true })
    fs.writeFileSync(abs, content, 'utf-8')
  }

  createFile(relPath, content) {
    const abs = this.resolveSafe(relPath)
    if (fs.existsSync(abs)) {
      throw new Error('A file already exists at that path')
    }
    fs.mkdirSync(path.dirname(abs), { recursive: true })
    fs.writeFileSync(abs, content, 'utf-8')
    return relPath
  }

  createFolder(relPath) {
    const abs = this.resolveSafe(relPath)
    if (fs.existsSync(abs)) {
      throw new Error('A folder already exists at that path')
    }
    fs.mkdirSync(abs, { recursive: true })
    return relPath
  }

  rename(oldRelPath, newRelPath) {
    const oldAbs = this.resolveSafe(oldRelPath)
    const newAbs = this.resolveSafe(newRelPath)
    if (fs.existsSync(newAbs)) {
      throw new Error('A file or folder already exists at the destination')
    }
    fs.mkdirSync(path.dirname(newAbs), { recursive: true })
    fs.renameSync(oldAbs, newAbs)
    return newRelPath
  }

  async deleteToTrash(relPath) {
    const abs = this.resolveSafe(relPath)
    await shell.trashItem(abs)
  }

  openInFinder(relPath) {
    const abs = this.resolveSafe(relPath)
    shell.showItemInFolder(abs)
  }

  listTemplates() {
    const templatesAbs = path.join(this.root, '_Templates')
    if (!fs.existsSync(templatesAbs)) return []
    return fs
      .readdirSync(templatesAbs, { withFileTypes: true })
      .filter((e) => e.isFile() && e.name.toLowerCase().endsWith('.md'))
      .map((e) => ({ name: e.name.replace(/\.md$/i, ''), path: `_Templates/${e.name}` }))
  }
}

module.exports = { Vault, DEFAULT_VAULT_PATH }
