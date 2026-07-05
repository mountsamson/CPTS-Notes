// Splits on fenced/inline code spans so wikilinks and #tags are only rewritten
// in prose — never inside code blocks (bash/PHP comments look like tags too).
const CODE_SPLIT = /(```[\s\S]*?```|`[^`\n]*`)/g

function transformText(text: string): string {
  let out = text.replace(/(^|[^#\w])#([A-Za-z][\w-]*)/g, (_m, pre, tag) => `${pre}[#${tag}](tag:${encodeURIComponent(tag)})`)
  out = out.replace(/\[\[([^\]|]+?)(?:\|([^\]]+?))?\]\]/g, (_m, target: string, alias?: string) => {
    const label = (alias ?? target).trim()
    return `[${label}](wikilink:${encodeURIComponent(target.trim())})`
  })
  return out
}

export function transformWikilinksAndTags(markdown: string): string {
  return markdown
    .split(CODE_SPLIT)
    .map((chunk, i) => (i % 2 === 1 ? chunk : transformText(chunk)))
    .join('')
}

export function extractTags(markdown: string): string[] {
  const tags = new Set<string>()
  for (const chunk of markdown.split(CODE_SPLIT).filter((_, i) => i % 2 === 0)) {
    const matches = chunk.matchAll(/(^|[^#\w])#([A-Za-z][\w-]*)/g)
    for (const m of matches) tags.add(m[2].toLowerCase())
  }
  return [...tags]
}

export function extractWikilinks(markdown: string): string[] {
  const links = new Set<string>()
  for (const chunk of markdown.split(CODE_SPLIT).filter((_, i) => i % 2 === 0)) {
    const matches = chunk.matchAll(/\[\[([^\]|]+?)(?:\|[^\]]+?)?\]\]/g)
    for (const m of matches) links.add(m[1].trim())
  }
  return [...links]
}

export function extractHeadings(markdown: string): string[] {
  const headings: string[] = []
  for (const line of markdown.split('\n')) {
    const m = /^#{1,6}\s+(.+)$/.exec(line.trim())
    if (m) headings.push(m[1].trim())
  }
  return headings
}
