import { COUNTRY_NAMES } from '../lib/countries'
import type { NoteFrontmatter } from '../lib/types'

interface PropertiesPanelProps {
  frontmatter: NoteFrontmatter
  onChange: (fm: NoteFrontmatter) => void
  expanded: boolean
  onToggleExpanded: () => void
}

export function PropertiesPanel({ frontmatter, onChange, expanded, onToggleExpanded }: PropertiesPanelProps) {
  const tagsValue = Array.isArray(frontmatter.tags) ? frontmatter.tags.join(', ') : ''

  const set = (patch: Partial<NoteFrontmatter>) => onChange({ ...frontmatter, ...patch })

  return (
    <div className="properties">
      <button className="properties-toggle" onClick={onToggleExpanded}>
        {expanded ? '▾' : '▸'} Properties
        {frontmatter.country ? ` · 📍 ${frontmatter.country}` : ''}
      </button>
      {expanded && (
        <div className="properties-grid">
          <div>
            <label className="field-label">Tags</label>
            <input
              className="input"
              placeholder="htb, easy, linux"
              value={tagsValue}
              onChange={(e) =>
                set({
                  tags: e.target.value
                    .split(',')
                    .map((t) => t.trim())
                    .filter(Boolean),
                })
              }
            />
          </div>
          <div>
            <label className="field-label">Difficulty</label>
            <select
              className="select"
              value={frontmatter.difficulty ?? ''}
              onChange={(e) => set({ difficulty: e.target.value || undefined })}
            >
              <option value="">—</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>
          <div>
            <label className="field-label">OS</label>
            <input
              className="input"
              placeholder="Linux"
              value={frontmatter.os ?? ''}
              onChange={(e) => set({ os: e.target.value || undefined })}
            />
          </div>
          <div>
            <label className="field-label">IP address</label>
            <input
              className="input"
              placeholder="10.129.x.x"
              value={frontmatter.ip ?? ''}
              onChange={(e) => set({ ip: e.target.value || undefined })}
            />
          </div>
          <div>
            <label className="field-label">Location (world map)</label>
            <input
              className="input"
              list="country-list"
              placeholder="Country…"
              value={frontmatter.country ?? ''}
              onChange={(e) => set({ country: e.target.value || undefined })}
            />
            <datalist id="country-list">
              {COUNTRY_NAMES.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
        </div>
      )}
    </div>
  )
}
