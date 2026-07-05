export type TreeNode =
  | { name: string; path: string; type: 'dir'; children: TreeNode[] }
  | { name: string; path: string; type: 'file'; isMarkdown: boolean }

export interface NoteFrontmatter {
  tags?: string[]
  difficulty?: string
  os?: string
  ip?: string
  country?: string
  lat?: number
  lng?: number
  [key: string]: unknown
}

export interface NoteRecord {
  path: string
  name: string
  dir: string
  raw: string
  frontmatter: NoteFrontmatter
  body: string
  tags: string[]
  wikilinks: string[]
  headings: string[]
  location: { lng: number; lat: number; label: string } | null
}
