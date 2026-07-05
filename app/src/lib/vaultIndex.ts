import { parseFrontmatter } from './frontmatter'
import { extractTags, extractWikilinks, extractHeadings } from './markdown-transform'
import { resolveCountry } from './countries'
import type { NoteRecord } from './types'

export function buildNoteRecord(path: string, raw: string): NoteRecord {
  const { frontmatter, body } = parseFrontmatter(raw)
  const fileName = path.split('/').pop() ?? path
  const name = fileName.replace(/\.md$/i, '')
  const dir = path.includes('/') ? path.slice(0, path.lastIndexOf('/')) : ''

  const inlineTags = extractTags(body)
  const fmTags = Array.isArray(frontmatter.tags) ? frontmatter.tags.map((t) => String(t).toLowerCase()) : []
  const tags = [...new Set([...fmTags, ...inlineTags])]

  let location: NoteRecord['location'] = null
  const lat = Number(frontmatter.lat)
  const lng = Number(frontmatter.lng)
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    location = { lat, lng, label: frontmatter.country ? String(frontmatter.country) : name }
  } else if (frontmatter.country) {
    const coords = resolveCountry(String(frontmatter.country))
    if (coords) location = { lng: coords[0], lat: coords[1], label: String(frontmatter.country) }
  }

  return {
    path,
    name,
    dir,
    raw,
    frontmatter,
    body,
    tags,
    wikilinks: extractWikilinks(body),
    headings: extractHeadings(body),
    location,
  }
}

export function buildBacklinks(notes: NoteRecord[]): Map<string, NoteRecord[]> {
  const byName = new Map<string, NoteRecord>()
  for (const note of notes) byName.set(note.name.toLowerCase(), note)

  const backlinks = new Map<string, NoteRecord[]>()
  for (const note of notes) {
    for (const link of note.wikilinks) {
      const target = byName.get(link.toLowerCase())
      if (!target || target.path === note.path) continue
      const list = backlinks.get(target.path) ?? []
      list.push(note)
      backlinks.set(target.path, list)
    }
  }
  return backlinks
}

export function resolveWikilink(notes: NoteRecord[], target: string): NoteRecord | null {
  const lower = target.toLowerCase()
  return notes.find((n) => n.name.toLowerCase() === lower) ?? null
}
