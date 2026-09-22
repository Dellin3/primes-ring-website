import { useMemo, useState } from 'react'
import { formatRadius } from '../../content/datasets.js'
import { numericColumns, profilePoints, rowsToCsv } from '../../lib/csv.js'
import DatasetProfilePreview from './DatasetProfilePreview.jsx'

const preferredYColumns = ['normal_optical_depth', 'normalized_signal_power', 'phase_shift_deg']

export default function DatasetViewer({ dataset, rows }) {
  const availableYColumns = useMemo(
    () => numericColumns(rows).filter((column) => column !== 'ring_radius_km'),
    [rows],
  )
  const [yColumn, setYColumn] = useState(
    () => preferredYColumns.find((column) => availableYColumns.includes(column))
      || availableYColumns[0]
      || 'normal_optical_depth',
  )
  const [windowStart, setWindowStart] = useState(0)
  const windowSize = Math.min(rows.length, 20)
  const maximumStart = Math.max(0, rows.length - windowSize)
  const safeWindowStart = Math.min(windowStart, maximumStart)
  const windowRows = rows.slice(safeWindowStart, safeWindowStart + windowSize)
  const points = profilePoints(windowRows, yColumn)

  function exportWindow() {
    if (!windowRows.length) return
    const blob = new Blob([rowsToCsv(windowRows)], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const minimum = Math.round(points[0]?.x ?? 0)
    const maximum = Math.round(points.at(-1)?.x ?? 0)
    link.href = url
    link.download = `${dataset.id}_window_${minimum}_${maximum}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <section id="profile" className="dataset-section" aria-labelledby="dataset-profile-title">
      <header className="subsection-heading">
        <p>Profile</p>
        <h2 id="dataset-profile-title">Inspect the local radial window</h2>
      </header>

      <div className="viewer-controls">
        <label>
          <span>Profile variable</span>
          <select value={yColumn} onChange={(event) => setYColumn(event.target.value)}>
            {availableYColumns.map((column) => (
              <option key={column} value={column}>{column.replaceAll('_', ' ')}</option>
            ))}
          </select>
        </label>
        <label className="window-control">
          <span>
            Window {safeWindowStart + 1} of {maximumStart + 1}
          </span>
          <input
            type="range"
            min="0"
            max={maximumStart}
            step="1"
            value={safeWindowStart}
            onChange={(event) => setWindowStart(Number(event.target.value))}
            disabled={maximumStart === 0}
            aria-label="Select local radial window"
          />
        </label>
      </div>

      <DatasetProfilePreview
        key={`${dataset.slug}-${safeWindowStart}-${yColumn}`}
        dataset={dataset}
        rows={windowRows}
        yColumn={yColumn}
      />

      <div className="window-summary">
        <p>
          {points.length
            ? `${points.length} rows · ${formatRadius(points[0].x)}–${formatRadius(points.at(-1).x)} km`
            : 'The selected profile window is loading.'}
        </p>
        <button className="button button-secondary" type="button" onClick={exportWindow} disabled={!windowRows.length}>
          Export selected window CSV
        </button>
      </div>
      <p className="viewer-method-note">
        This chart displays repository CSV values directly. It does not include a reconstruction,
        physical model fit, or validation metric.
      </p>
    </section>
  )
}
