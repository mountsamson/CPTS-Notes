import type { TreeNode } from './lib/types'

export interface VaultAPI {
  getRoot(): Promise<string>
  chooseRoot(): Promise<string>
  listTree(): Promise<TreeNode[]>
  readFile(relPath: string): Promise<string>
  writeFile(relPath: string, content: string): Promise<void>
  createFile(relPath: string, content: string): Promise<string>
  createFolder(relPath: string): Promise<string>
  rename(oldRelPath: string, newRelPath: string): Promise<string>
  deleteItem(relPath: string): Promise<void>
  openInFinder(relPath: string): Promise<void>
  listTemplates(): Promise<{ name: string; path: string }[]>
  openExternal(url: string): Promise<void>
  onRootChanged(callback: (newRoot: string) => void): () => void
}

declare global {
  interface Window {
    vaultAPI: VaultAPI
  }
}
