// Exercises electron/vault.js's filesystem logic against a throwaway temp
// vault, with `electron` mocked out — lets us test file CRUD + path-safety
// without a real Electron process (which this sandbox can't launch headless).
const path = require('node:path')
const Module = require('node:module')
const os = require('node:os')
const fs = require('node:fs')

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'vault-test-'))
const userDataDir = path.join(tmpRoot, 'userData')
fs.mkdirSync(userDataDir, { recursive: true })

const vaultDir = path.join(tmpRoot, 'vault')
fs.mkdirSync(path.join(vaultDir, 'sub'), { recursive: true })
fs.writeFileSync(path.join(vaultDir, 'root.md'), '# Root note')
fs.writeFileSync(path.join(vaultDir, 'sub', 'child.md'), '# Child')

const trashCalls = []
const fakeElectron = {
  app: { getPath: (name) => (name === 'userData' ? userDataDir : tmpRoot) },
  shell: {
    trashItem: (p) => {
      trashCalls.push(p)
      return Promise.resolve()
    },
    showItemInFolder: () => {},
  },
}

const origLoad = Module._load
Module._load = function (request, parent, isMain) {
  if (request === 'electron') return fakeElectron
  return origLoad.apply(this, arguments)
}

const { Vault } = require('../electron/vault.js')

let failures = 0
function assert(cond, msg) {
  if (!cond) {
    console.error('FAIL:', msg)
    failures++
  } else {
    console.log('ok  :', msg)
  }
}

async function main() {
  const vault = new Vault()
  vault.setRoot(vaultDir)

  const tree = vault.listTree()
  assert(tree.some((n) => n.name === 'root.md'), 'listTree finds root-level file')
  assert(tree.some((n) => n.name === 'sub' && n.type === 'dir'), 'listTree finds subdirectory')
  const sub = tree.find((n) => n.name === 'sub')
  assert(sub.children.some((n) => n.name === 'child.md'), 'listTree recurses into subdirectory')

  vault.createFile('new.md', '# New')
  assert(fs.existsSync(path.join(vaultDir, 'new.md')), 'createFile writes a new file')

  let threw = false
  try {
    vault.createFile('new.md', 'x')
  } catch {
    threw = true
  }
  assert(threw, 'createFile throws if the file already exists')

  threw = false
  try {
    vault.resolveSafe('../../etc/passwd')
  } catch {
    threw = true
  }
  assert(threw, 'resolveSafe rejects a path-traversal attempt')

  threw = false
  try {
    vault.resolveSafe('../outside.md')
  } catch {
    threw = true
  }
  assert(threw, 'resolveSafe rejects a relative escape via ..')

  vault.rename('new.md', 'renamed.md')
  assert(
    fs.existsSync(path.join(vaultDir, 'renamed.md')) && !fs.existsSync(path.join(vaultDir, 'new.md')),
    'rename moves the file on disk',
  )

  vault.createFolder('newfolder')
  assert(fs.existsSync(path.join(vaultDir, 'newfolder')) && fs.statSync(path.join(vaultDir, 'newfolder')).isDirectory(), 'createFolder makes a directory')

  await vault.deleteToTrash('renamed.md')
  assert(trashCalls.length === 1 && trashCalls[0] === path.join(vaultDir, 'renamed.md'), 'deleteToTrash calls shell.trashItem with the correct absolute path')

  const configRaw = fs.readFileSync(path.join(userDataDir, 'vault-config.json'), 'utf-8')
  assert(JSON.parse(configRaw).vaultPath === vaultDir, 'setRoot persists the chosen vault path to userData config')

  console.log(failures ? `\n${failures} check(s) FAILED` : '\nAll vault-fs checks passed')
  process.exitCode = failures ? 1 : 0
}

main()
