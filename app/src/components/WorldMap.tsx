import { useMemo, useRef, useState } from 'react'
import { geoNaturalEarth1, geoPath } from 'd3-geo'
import { feature } from 'topojson-client'
import worldTopologyRaw from 'world-atlas/countries-110m.json'
import { difficultyClass } from '../lib/format'
import type { NoteRecord } from '../lib/types'

const WIDTH = 960
const HEIGHT = 500

interface PinCluster {
  key: string
  label: string
  lng: number
  lat: number
  notes: NoteRecord[]
}

function buildClusters(notes: NoteRecord[]): PinCluster[] {
  const map = new Map<string, PinCluster>()
  for (const note of notes) {
    if (!note.location) continue
    const key = `${note.location.label.toLowerCase()}|${note.location.lat.toFixed(1)}|${note.location.lng.toFixed(1)}`
    const existing = map.get(key)
    if (existing) existing.notes.push(note)
    else map.set(key, { key, label: note.location.label, lng: note.location.lng, lat: note.location.lat, notes: [note] })
  }
  return [...map.values()]
}

function pinColor(cluster: PinCluster): string {
  if (cluster.notes.length !== 1) return 'var(--accent)'
  const cls = difficultyClass(cluster.notes[0].frontmatter.difficulty as string | undefined)
  if (cls === 'status-easy') return 'var(--status-good)'
  if (cls === 'status-medium') return 'var(--status-warning)'
  if (cls === 'status-hard') return 'var(--status-critical)'
  return 'var(--accent)'
}

interface WorldMapProps {
  notes: NoteRecord[]
  onOpenNote: (path: string) => void
}

export function WorldMap({ notes, onOpenNote }: WorldMapProps) {
  const clusters = useMemo(() => buildClusters(notes), [notes])
  const [selected, setSelected] = useState<PinCluster | null>(null)
  const [hover, setHover] = useState<{ cluster: PinCluster; x: number; y: number } | null>(null)
  const wrapRef = useRef<HTMLDivElement>(null)

  const { pathGenerator, projection, countries } = useMemo(() => {
    const topo = worldTopologyRaw as any
    const fc = feature(topo, topo.objects.countries) as any
    const proj = geoNaturalEarth1().fitSize([WIDTH, HEIGHT], fc)
    return { pathGenerator: geoPath(proj), projection: proj, countries: fc.features as any[] }
  }, [])

  const withMouse = (cluster: PinCluster) => (e: React.MouseEvent) => {
    const rect = wrapRef.current?.getBoundingClientRect()
    setHover({ cluster, x: e.clientX - (rect?.left ?? 0), y: e.clientY - (rect?.top ?? 0) })
  }

  const pinnedCount = notes.filter((n) => n.location).length

  return (
    <div className="map-view">
      <div className="map-svg-wrap" ref={wrapRef}>
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} style={{ width: '92%', height: '92%' }}>
          <rect x={0} y={0} width={WIDTH} height={HEIGHT} fill="var(--surface-0)" />
          <g>
            {countries.map((c, i) => (
              <path key={i} d={pathGenerator(c) ?? ''} fill="var(--surface-2)" stroke="var(--border)" strokeWidth={0.5} />
            ))}
          </g>
          <g>
            {clusters.map((cluster) => {
              const projected = projection([cluster.lng, cluster.lat])
              if (!projected) return null
              const [x, y] = projected
              const radius = Math.min(14, 5 + Math.sqrt(Math.max(0, cluster.notes.length - 1)) * 3)
              return (
                <g
                  key={cluster.key}
                  onMouseEnter={withMouse(cluster)}
                  onMouseMove={withMouse(cluster)}
                  onMouseLeave={() => setHover(null)}
                  onClick={() => setSelected(cluster)}
                  style={{ cursor: 'pointer' }}
                >
                  <circle cx={x} cy={y} r={radius} fill={pinColor(cluster)} fillOpacity={0.88} stroke="var(--surface-0)" strokeWidth={2} />
                  {cluster.notes.length > 1 && (
                    <text x={x} y={y + 3} textAnchor="middle" fontSize={9} fill="#ffffff" fontFamily="var(--font-mono)">
                      {cluster.notes.length}
                    </text>
                  )}
                </g>
              )
            })}
          </g>
        </svg>
        {hover && (
          <div className="map-tooltip" style={{ left: hover.x, top: hover.y }}>
            <strong>{hover.cluster.label}</strong> — {hover.cluster.notes.length} note{hover.cluster.notes.length > 1 ? 's' : ''}
          </div>
        )}
      </div>
      <div className="map-side">
        {selected ? (
          <>
            <h3>📍 {selected.label}</h3>
            {selected.notes.map((n) => (
              <div key={n.path} className="pin-note-item" onClick={() => onOpenNote(n.path)}>
                <div style={{ fontWeight: 500 }}>{n.name}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>{n.path}</div>
              </div>
            ))}
          </>
        ) : (
          <>
            <h3>World Map</h3>
            <p className="hint">
              {clusters.length === 0
                ? "No notes have a location yet. Open a note's Properties panel and set a Country to pin it here."
                : `${clusters.length} location${clusters.length > 1 ? 's' : ''} pinned across ${pinnedCount} note(s). Click a pin to see notes there.`}
            </p>
          </>
        )}
      </div>
    </div>
  )
}
