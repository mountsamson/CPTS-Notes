export function difficultyClass(difficulty?: string | null): string {
  const d = (difficulty || '').toLowerCase()
  if (d === 'easy') return 'status-easy'
  if (d === 'medium') return 'status-medium'
  if (d === 'hard') return 'status-hard'
  return ''
}

export function basename(relPath: string): string {
  const parts = relPath.split('/')
  return parts[parts.length - 1]
}

export function dirname(relPath: string): string {
  const idx = relPath.lastIndexOf('/')
  return idx === -1 ? '' : relPath.slice(0, idx)
}

export function joinPath(dir: string, name: string): string {
  return dir ? `${dir}/${name}` : name
}
