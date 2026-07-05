import Fuse from 'fuse.js'
import type { NoteRecord } from './types'

export function createSearchIndex(notes: NoteRecord[]): Fuse<NoteRecord> {
  return new Fuse(notes, {
    keys: [
      { name: 'name', weight: 0.4 },
      { name: 'tags', weight: 0.25 },
      { name: 'headings', weight: 0.2 },
      { name: 'body', weight: 0.15 },
    ],
    threshold: 0.35,
    ignoreLocation: true,
    minMatchCharLength: 2,
  })
}
