import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { formatRadius } from '../../content/datasets.js'
import { parseCsvText, profilePoints } from '../../lib/csv.js'

const chartDimensions = {
  full: {
    width: 820,
    height: 420,
    margin: { top: 24, right: 28, bottom: 58, left: 72 },
  },
  compact: {
    width: 620,
    height: 220,
    margin: { top: 14, right: 14, bottom: 34, left: 48 },
  },
  mobile: {
    width: 360,
    height: 286,
    margin: { top: 18, right: 30, bottom: 48, left: 60 },
  },
  compactMobile: {
    width: 360,
    height: 190,
    margin: { top: 12, right: 10, bottom: 32, left: 46 },
  },
}

function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => (
    typeof window !== 'undefined' && window.matchMedia(query).matches
  ))

  useEffect(() => {
    const media = window.matchMedia(query)
    const update = (event) => setMatches(event.matches)
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [query])

  return matches
}

function formatPlotValue(value) {
  const magnitude = Math.abs(value)
  if (magnitude !== 0 && (magnitude < 0.001 || magnitude >= 1000)) {
    return value.toExponential(2)
  }
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: magnitude < 0.1 ? 4 : 2,
  }).format(value)
}

function readableColumnName(column) {
  return column
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase())
}

function numericExtent(points, key) {
  const values = points.map((point) => point[key])
  return [Math.min(...values), Math.max(...values)]
}

function paddedExtent([minimum, maximum]) {
  if (minimum === maximum) {
    const padding = Math.abs(minimum) * 0.08 || 1
    return [minimum - padding, maximum + padding]
  }
  const padding = (maximum - minimum) * 0.08
  return [minimum - padding, maximum + padding]
}

function ticks(minimum, maximum, count) {
  return Array.from(
    { length: count },
    (_, index) => minimum + ((maximum - minimum) * index) / (count - 1),
  )
}

function nearestPointIndex(points, targetX) {
  let nearestIndex = 0
  let nearestDistance = Number.POSITIVE_INFINITY
  points.forEach((point, index) => {
    const distance = Math.abs(point.x - targetX)
    if (distance < nearestDistance) {
      nearestDistance = distance
      nearestIndex = index
    }
  })
  return nearestIndex
}

export default function DatasetProfilePreview({
  dataset,
  rows,
  yColumn = 'normal_optical_depth',
  compact = false,
  interactive = false,
  animateOnEnter = false,
  showCaption = true,
}) {
  const suppliedRows = Array.isArray(rows)
  const [request, setRequest] = useState({
    file: '',
    rows: [],
    status: 'loading',
  })
  const [inspectedIndex, setInspectedIndex] = useState(null)
  const figureRef = useRef(null)
  const descriptionId = useId()
  const titleId = useId()
  const narrowViewport = useMediaQuery('(max-width: 560px)')
  const [revealed, setRevealed] = useState(() => (
    !animateOnEnter
    || typeof window === 'undefined'
    || window.matchMedia('(prefers-reduced-motion: reduce)').matches
    || !('IntersectionObserver' in window)
  ))

  useEffect(() => {
    if (suppliedRows) return undefined

    const controller = new AbortController()
    fetch(dataset.file, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`Unable to load ${dataset.file}`)
        return response.text()
      })
      .then((text) => {
        setRequest({
          file: dataset.file,
          rows: parseCsvText(text),
          status: 'ready',
        })
      })
      .catch((error) => {
        if (error.name !== 'AbortError') {
          setRequest({ file: dataset.file, rows: [], status: 'error' })
        }
      })

    return () => controller.abort()
  }, [dataset.file, suppliedRows])

  useEffect(() => {
    if (!animateOnEnter || revealed || !figureRef.current) return undefined

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true)
          observer.disconnect()
        }
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.18 },
    )
    observer.observe(figureRef.current)
    return () => observer.disconnect()
  }, [animateOnEnter, revealed])

  const currentRequest = request.file === dataset.file
  const sourceRows = useMemo(
    () => (suppliedRows ? rows : (currentRequest ? request.rows : [])),
    [currentRequest, request.rows, rows, suppliedRows],
  )
  const status = suppliedRows ? 'ready' : (currentRequest ? request.status : 'loading')
  const points = useMemo(
    () => profilePoints(sourceRows, yColumn),
    [sourceRows, yColumn],
  )

  const geometry = useMemo(() => {
    if (!points.length) return null

    const dimensions = narrowViewport
      ? (compact ? chartDimensions.compactMobile : chartDimensions.mobile)
      : (compact ? chartDimensions.compact : chartDimensions.full)
    const { width, height, margin } = dimensions
    const plotWidth = width - margin.left - margin.right
    const plotHeight = height - margin.top - margin.bottom
    const [xMinimum, xMaximum] = numericExtent(points, 'x')
    const [yMinimum, yMaximum] = paddedExtent(numericExtent(points, 'y'))
    const xSpan = xMaximum - xMinimum || 1
    const ySpan = yMaximum - yMinimum || 1
    const xScale = (value) => margin.left + ((value - xMinimum) / xSpan) * plotWidth
    const yScale = (value) => margin.top + (1 - ((value - yMinimum) / ySpan)) * plotHeight
    const path = points
      .map((point, index) => `${index === 0 ? 'M' : 'L'}${xScale(point.x).toFixed(2)},${yScale(point.y).toFixed(2)}`)
      .join(' ')

    return {
      ...dimensions,
      plotWidth,
      plotHeight,
      xMinimum,
      xMaximum,
      yMinimum,
      yMaximum,
      xScale,
      yScale,
      path,
      xTicks: ticks(xMinimum, xMaximum, narrowViewport ? 3 : (compact ? 4 : 5)),
      yTicks: ticks(yMinimum, yMaximum, compact || narrowViewport ? 3 : 5),
    }
  }, [compact, narrowViewport, points])

  const inspectedPoint = (
    inspectedIndex === null ? null : points[inspectedIndex]
  )
  const radialSummary = points.length
    ? `${formatRadius(points[0].x)}–${formatRadius(points.at(-1).x)} km`
    : ''
  const accessibleSummary = points.length
    ? `${dataset.event}. ${points.length} repository CSV rows plotted as ${readableColumnName(yColumn)} against ring radius, spanning ${radialSummary}.`
    : `${dataset.event} profile preview.`

  function inspectPointer(event) {
    if (!interactive || !geometry || !points.length) return
    const bounds = event.currentTarget.getBoundingClientRect()
    const pointerRatio = (event.clientX - bounds.left) / bounds.width
    const viewBoxX = pointerRatio * geometry.width
    const dataRatio = Math.min(
      1,
      Math.max(0, (viewBoxX - geometry.margin.left) / geometry.plotWidth),
    )
    const targetX = geometry.xMinimum + dataRatio * (
      geometry.xMaximum - geometry.xMinimum
    )
    setInspectedIndex(nearestPointIndex(points, targetX))
  }

  function inspectWithKeyboard(event) {
    if (!interactive || !points.length) return
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
    event.preventDefault()
    const direction = event.key === 'ArrowRight' ? 1 : -1
    setInspectedIndex((current) => {
      const start = current ?? Math.floor(points.length / 2)
      return Math.min(points.length - 1, Math.max(0, start + direction))
    })
  }

  return (
    <figure
      ref={figureRef}
      className={[
        'profile-preview',
        compact ? 'is-compact' : '',
        narrowViewport ? 'is-narrow' : '',
        interactive ? 'is-interactive' : '',
        revealed || !animateOnEnter ? 'is-revealed' : '',
      ].filter(Boolean).join(' ')}
    >
      <div className="profile-plot">
        {status === 'loading' && (
          <p className="plot-status" role="status">Loading repository CSV values…</p>
        )}
        {status === 'error' && (
          <p className="plot-status is-error" role="alert">
            The repository CSV profile could not be loaded.
          </p>
        )}
        {status === 'ready' && !points.length && (
          <p className="plot-status">No plottable radius/profile values were found.</p>
        )}
        {geometry && (
          <svg
            viewBox={`0 0 ${geometry.width} ${geometry.height}`}
            role="img"
            aria-labelledby={`${titleId} ${descriptionId}`}
            tabIndex={interactive ? 0 : undefined}
            onFocus={() => {
              if (interactive && inspectedIndex === null) {
                setInspectedIndex(Math.floor(points.length / 2))
              }
            }}
            onBlur={() => setInspectedIndex(null)}
            onKeyDown={inspectWithKeyboard}
            onPointerMove={inspectPointer}
            onPointerLeave={() => setInspectedIndex(null)}
          >
            <title id={titleId}>{dataset.event} radial optical-depth profile</title>
            <desc id={descriptionId}>{accessibleSummary}</desc>

            <g aria-hidden="true">
              {geometry.yTicks.map((value) => {
                const y = geometry.yScale(value)
                return (
                  <g key={`y-${value}`}>
                    <line
                      className="plot-grid"
                      x1={geometry.margin.left}
                      x2={geometry.width - geometry.margin.right}
                      y1={y}
                      y2={y}
                    />
                    <text
                      className="plot-tick"
                      x={geometry.margin.left - 12}
                      y={y + 3}
                      textAnchor="end"
                    >
                      {formatPlotValue(value)}
                    </text>
                  </g>
                )
              })}
              {geometry.xTicks.map((value) => {
                const x = geometry.xScale(value)
                return (
                  <g key={`x-${value}`}>
                    <line
                      className="plot-grid"
                      x1={x}
                      x2={x}
                      y1={geometry.margin.top}
                      y2={geometry.height - geometry.margin.bottom}
                    />
                    <text
                      className="plot-tick"
                      x={x}
                      y={geometry.height - geometry.margin.bottom + 22}
                      textAnchor="middle"
                    >
                      {formatRadius(value)}
                    </text>
                  </g>
                )
              })}
              <path
                className="plot-axis"
                d={`M${geometry.margin.left},${geometry.margin.top}V${geometry.height - geometry.margin.bottom}H${geometry.width - geometry.margin.right}`}
              />
              <text
                className="plot-axis-label"
                x={geometry.margin.left + geometry.plotWidth / 2}
                y={geometry.height - 12}
                textAnchor="middle"
              >
                Ring radius (km)
              </text>
              {!compact && !narrowViewport && (
                <text
                  className="plot-axis-label"
                  x={16}
                  y={geometry.margin.top + geometry.plotHeight / 2}
                  textAnchor="middle"
                  transform={`rotate(-90 16 ${geometry.margin.top + geometry.plotHeight / 2})`}
                >
                  {readableColumnName(yColumn)}
                </text>
              )}
              <path className="profile-line" pathLength="1" d={geometry.path} />

              {inspectedPoint && (
                <g className="profile-inspection">
                  <line
                    x1={geometry.xScale(inspectedPoint.x)}
                    x2={geometry.xScale(inspectedPoint.x)}
                    y1={geometry.margin.top}
                    y2={geometry.height - geometry.margin.bottom}
                  />
                  <circle
                    cx={geometry.xScale(inspectedPoint.x)}
                    cy={geometry.yScale(inspectedPoint.y)}
                    r="5"
                  />
                  <text
                    x={geometry.xScale(inspectedPoint.x) > geometry.width * 0.68
                      ? geometry.xScale(inspectedPoint.x) - 10
                      : geometry.xScale(inspectedPoint.x) + 10}
                    y={Math.max(geometry.margin.top + 14, geometry.yScale(inspectedPoint.y) - 12)}
                    textAnchor={geometry.xScale(inspectedPoint.x) > geometry.width * 0.68
                      ? 'end'
                      : 'start'}
                  >
                    {formatRadius(inspectedPoint.x)} km · {formatPlotValue(inspectedPoint.y)}
                  </text>
                </g>
              )}
            </g>
          </svg>
        )}
      </div>

      {showCaption ? (
        <figcaption>
          {points.length
            ? `${points.length} source rows · ${radialSummary} · plotted directly from ${dataset.fileName}`
            : `Direct repository profile preview for ${dataset.event}`}
        </figcaption>
      ) : (
        <p className="sr-only">{accessibleSummary}</p>
      )}
      {interactive && inspectedPoint && (
        <p className="sr-only" aria-live="polite">
          Ring radius {formatRadius(inspectedPoint.x)} kilometers;{' '}
          {readableColumnName(yColumn)} {formatPlotValue(inspectedPoint.y)}.
        </p>
      )}
    </figure>
  )
}
