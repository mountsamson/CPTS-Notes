import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import 'highlight.js/styles/github-dark.css'
import { transformWikilinksAndTags } from '../lib/markdown-transform'
import { resolveWikilink } from '../lib/vaultIndex'
import type { NoteRecord } from '../lib/types'

interface MarkdownPreviewProps {
  content: string
  notes: NoteRecord[]
  onOpenWikilink: (target: string) => void
  onTagClick: (tag: string) => void
}

export function MarkdownPreview({ content, notes, onOpenWikilink, onTagClick }: MarkdownPreviewProps) {
  const transformed = transformWikilinksAndTags(content)

  return (
    <div className="preview">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          a: ({ href, children, ...props }) => {
            if (href?.startsWith('wikilink:')) {
              const target = decodeURIComponent(href.slice('wikilink:'.length))
              const resolved = resolveWikilink(notes, target)
              return (
                <a
                  {...props}
                  href="#"
                  className={`wikilink${resolved ? '' : ' broken'}`}
                  title={resolved ? target : `"${target}" doesn't exist yet — click to create it`}
                  onClick={(e) => {
                    e.preventDefault()
                    onOpenWikilink(target)
                  }}
                >
                  {children}
                </a>
              )
            }
            if (href?.startsWith('tag:')) {
              const tag = decodeURIComponent(href.slice('tag:'.length))
              return (
                <a
                  {...props}
                  href="#"
                  className="tag-chip"
                  onClick={(e) => {
                    e.preventDefault()
                    onTagClick(tag)
                  }}
                >
                  #{tag}
                </a>
              )
            }
            return (
              <a
                {...props}
                href={href}
                onClick={(e) => {
                  e.preventDefault()
                  if (href) window.vaultAPI.openExternal(href)
                }}
              >
                {children}
              </a>
            )
          },
        }}
      >
        {transformed}
      </ReactMarkdown>
    </div>
  )
}
