import matter from 'gray-matter'
import type { NoteFrontmatter } from './types'

export function parseFrontmatter(raw: string): { frontmatter: NoteFrontmatter; body: string } {
  try {
    const parsed = matter(raw)
    return { frontmatter: (parsed.data as NoteFrontmatter) ?? {}, body: parsed.content }
  } catch {
    return { frontmatter: {}, body: raw }
  }
}

export function stringifyWithFrontmatter(frontmatter: NoteFrontmatter, body: string): string {
  const hasMeta = Object.keys(frontmatter).some((k) => {
    const v = frontmatter[k]
    return v !== undefined && v !== null && v !== '' && !(Array.isArray(v) && v.length === 0)
  })
  if (!hasMeta) return body
  return matter.stringify(body, frontmatter)
}
