import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { transformWikilinksAndTags, extractTags, extractWikilinks, extractHeadings } from '../src/lib/markdown-transform'
import { buildNoteRecord, buildBacklinks, resolveWikilink } from '../src/lib/vaultIndex'
import { parseFrontmatter, stringifyWithFrontmatter } from '../src/lib/frontmatter'
import { resolveCountry } from '../src/lib/countries'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const vaultRoot = path.resolve(__dirname, '..', '..')

function assert(cond: boolean, msg: string) {
  if (!cond) {
    console.error('FAIL:', msg)
    process.exitCode = 1
  } else {
    console.log('ok  :', msg)
  }
}

const knifeRaw = fs.readFileSync(path.join(vaultRoot, '_Box Write-Ups', 'Knife.md'), 'utf-8')

const tags = extractTags(knifeRaw)
assert(tags.includes('htb') && tags.includes('easy') && tags.includes('linux') && tags.includes('gtfobins'), `tags extracted: ${tags.join(',')}`)
assert(!tags.includes('info') && !tags.includes('enumeration'), `headings not mistaken for tags: ${tags.join(',')}`)

const links = extractWikilinks(knifeRaw)
assert(links.includes('Linux-Privilege-Escalation') && links.includes('GTFOBins'), `wikilinks extracted: ${links.join(',')}`)

const headings = extractHeadings(knifeRaw)
assert(headings.includes('Enumeration') && headings.includes('Privilege Escalation'), `headings extracted: ${headings.join(',')}`)

const transformed = transformWikilinksAndTags(knifeRaw)
assert(transformed.includes('[Linux-Privilege-Escalation](wikilink:Linux-Privilege-Escalation)'), 'wikilink rewritten to markdown link')
assert(transformed.includes('[#htb](tag:htb)'), 'tag rewritten to markdown link')
assert(transformed.includes('```bash') && transformed.includes("curl -s http://<IP> -H \"User-Agentt: zerodiumsystem('id');\""), 'code fence left untouched (no tag/wikilink mangling inside bash block)')
assert(!/\[#/.test(transformed.split('```bash')[1]?.split('```')[0] ?? ''), 'no tag links were created inside a bash fence')

const fmTest = parseFrontmatter('---\ntags: [htb, easy]\ncountry: Philippines\n---\n# Body\nHello #world [[Other]]')
assert(fmTest.frontmatter.country === 'Philippines', `frontmatter parsed: ${JSON.stringify(fmTest.frontmatter)}`)
assert(fmTest.body.trim().startsWith('# Body'), 'body excludes frontmatter block')

const restringified = stringifyWithFrontmatter({ country: 'Philippines', tags: ['htb'] }, '# Body\ntext')
assert(restringified.includes('country: Philippines') && restringified.includes('# Body'), 'stringifyWithFrontmatter round-trips')

const emptyFm = stringifyWithFrontmatter({ tags: [], difficulty: undefined }, '# Body only')
assert(emptyFm === '# Body only', 'empty frontmatter produces no --- block')

const coords = resolveCountry('philippines')
assert(!!coords && Math.abs(coords[0] - 120.98) < 0.1, `country lookup case-insensitive: ${JSON.stringify(coords)}`)
assert(resolveCountry('USA')?.[1] === resolveCountry('United States')?.[1], 'alias resolves to same coords as canonical name')
assert(resolveCountry('Not A Real Country') === null, 'unknown country resolves to null')

const noteA = buildNoteRecord('A.md', '# A\nlinks to [[B]] and #foo')
const noteB = buildNoteRecord('B.md', '# B\nno links here')
const backlinks = buildBacklinks([noteA, noteB])
assert((backlinks.get('B.md') ?? []).some((n) => n.path === 'A.md'), 'backlink graph built from wikilinks')
assert(resolveWikilink([noteA, noteB], 'b')?.path === 'B.md', 'wikilink resolution is case-insensitive')
assert(resolveWikilink([noteA, noteB], 'Nonexistent') === null, 'unresolved wikilink returns null')

const geoNote = buildNoteRecord('geo.md', '---\ncountry: Philippines\n---\n# Geo')
assert(geoNote.location !== null && Math.abs((geoNote.location?.lng ?? 0) - 120.98) < 0.1, `location resolved from country frontmatter: ${JSON.stringify(geoNote.location)}`)

console.log(process.exitCode ? '\nSome checks FAILED' : '\nAll checks passed')
