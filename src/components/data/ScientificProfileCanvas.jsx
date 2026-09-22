import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { nearestSample, sampleAtOffset } from '../../lib/webObservation.js'
import { requiresContinuityNeutralPoints } from '../../lib/profileSegments.js'
import {
  displayUnit, isFiniteProfileSample, numericExtent,
  radialDisplayInterval, shouldBreakProfile,
} from '../../lib/profileRendering.js'
import { measuredProfileAxes } from '../../lib/profileAxes.js'

const MAX_DEVICE_PIXEL_RATIO = 1.5

function formatRadius(value) {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
  }).format(value)
}

function formatScientificValue(value) {
  const magnitude = Math.abs(value)
  if (magnitude !== 0 && (magnitude < 0.001 || magnitude >= 1000)) {
    return value.toExponential(2)
  }
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: magnitude < 0.1 ? 5 : 3,
  }).format(value)
}

function drawText(
  context,
  text,
  x,
  y,
  {
    align = 'center',
    baseline = 'middle',
    color = 'rgba(220, 231, 237, 0.66)',
    font = '11px SFMono-Regular, Consolas, monospace',
  } = {},
) {
  context.fillStyle = color
  context.font = font
  context.textAlign = align
  context.textBaseline = baseline
  context.fillText(text, x, y)
}

export default function ScientificProfileCanvas({
  samples,
  variable,
  inspectedSample,
  comparisonSample,
  onInspect,
  dataMode,
  scopeLabel,
  statusMessage,
  samplingInterval,
  requestedRange,
}) {
  const [modeDetailsOpen, setModeDetailsOpen] = useState(false)
  const canvasRef = useRef(null)
  const resizeFrameRef = useRef(null)
  const layoutRef = useRef(null)
  const drawRef = useRef(null)
  const samplesRef = useRef([])
  const onInspectRef = useRef(onInspect)

  const inspectableSamples = useMemo(() => (
    samples.filter((sample) => Number.isFinite(sample.ring_radius_km))
  ), [samples])
  const radiusExtent = useMemo(() => numericExtent(samples, 'ring_radius_km', 0), [samples])
  const valueExtent = useMemo(() => numericExtent(samples, variable.id), [samples, variable.id])
  const interval = useMemo(() => radialDisplayInterval(samples, samplingInterval), [samples, samplingInterval])
  const interactive = dataMode === 'exact' && inspectableSamples.length > 0
  const currentInspected = inspectedSample
    ? inspectableSamples.find((sample) => sample.sample_index === inspectedSample.sample_index) ?? null
    : null
  const accessibleSample = currentInspected
    ?? inspectableSamples[Math.floor(inspectableSamples.length / 2)]
    ?? null
  const emptyFieldMessage = samples.length && !valueExtent
    ? `No finite ${variable.label.toLowerCase()} values with a valid radius are available in this view. Missing values are not plotted.`
    : ''
  const hasRequestedRange = Array.isArray(requestedRange) && requestedRange.length === 2
    && requestedRange.every(Number.isFinite)
  const coverageDiffers = hasRequestedRange && radiusExtent && (
    requestedRange[0] !== radiusExtent[0] || requestedRange[1] !== radiusExtent[1]
  )
  const formatBoundary = (value) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 20 }).format(value)
  const ariaDescription = useMemo(() => {
    if (!radiusExtent) {
      return `${scopeLabel}. ${statusMessage || 'Profile data are loading.'}`
    }
    return (
      `${scopeLabel}. ${variable.label} (${displayUnit(variable.unit)}) plotted against ring radius from `
      + `${formatRadius(radiusExtent[0])} to `
      + `${formatRadius(radiusExtent[1])} kilometers using `
      + `${dataMode === 'exact' ? 'exact converted samples' : 'the source-sample display overview'}.`
      + (interactive ? ' Click to select a sample, or use Left and Right arrow keys; Home and End select the radius extremes.' : '')
    )
  }, [dataMode, interactive, radiusExtent, scopeLabel, statusMessage, variable.label, variable.unit])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const bounds = canvas.getBoundingClientRect()
    if (!bounds.width || !bounds.height) return

    const dpr = Math.min(
      window.devicePixelRatio || 1,
      MAX_DEVICE_PIXEL_RATIO,
    )
    const pixelWidth = Math.round(bounds.width * dpr)
    const pixelHeight = Math.round(bounds.height * dpr)
    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth
      canvas.height = pixelHeight
    }

    const context = canvas.getContext('2d')
    context.setTransform(dpr, 0, 0, dpr, 0, 0)
    context.clearRect(0, 0, bounds.width, bounds.height)
    context.fillStyle = '#0c1725'
    context.fillRect(0, 0, bounds.width, bounds.height)

    if (!radiusExtent) {
      layoutRef.current = null
      return
    }

    const compact = bounds.width < 620
    const style = getComputedStyle(canvas)
    const fontSize = Number.parseFloat(style.fontSize) || 12
    const axisFont = `${fontSize}px ${style.fontFamily}`
    context.font = axisFont
    const axes = measuredProfileAxes({
      width: bounds.width, height: bounds.height,
      xDomain: radiusExtent, yDomain: valueExtent ?? [0, 1], fontSize,
      measureText: (text) => context.measureText(text).width,
      yTitle: `${variable.label} (${displayUnit(variable.unit)})`,
    })
    const { margins, plotWidth, plotHeight } = axes
    const [xMinimum, xMaximum] = radiusExtent
    layoutRef.current = { bounds, margins, plotWidth, xMinimum, xMaximum, samples }
    if (!valueExtent) return
    const [yMinimum, yMaximum] = valueExtent
    const xSpan = xMaximum - xMinimum || 1
    const ySpan = yMaximum - yMinimum || 1
    const xScale = (value) => (
      margins.left + ((value - xMinimum) / xSpan) * plotWidth
    )
    const yScale = (value) => (
      margins.top + (1 - ((value - yMinimum) / ySpan)) * plotHeight
    )
    layoutRef.current = {
      bounds,
      margins,
      plotWidth,
      xMinimum,
      xMaximum,
      samples,
    }

    axes.titleLines.forEach((line, index) => {
      drawText(context, line, margins.left, 12 + index * axes.lineHeight, {
        align: 'left', baseline: 'top', font: axisFont, color: '#bdd0dc',
      })
    })
    context.lineWidth = 1
    context.strokeStyle = 'rgba(174, 202, 218, 0.10)'
    axes.y.values.forEach((value, tickIndex) => {
      const y = yScale(value)
      context.beginPath()
      context.moveTo(margins.left, y)
      context.lineTo(bounds.width - margins.right, y)
      context.stroke()
      drawText(context, axes.y.labels[tickIndex], margins.left - 10, y, {
        align: 'right',
        font: axisFont, color: '#b4c8d5',
      })
    })
    axes.x.values.forEach((value, tickIndex) => {
      const x = xScale(value)
      context.beginPath()
      context.moveTo(x, margins.top)
      context.lineTo(x, bounds.height - margins.bottom)
      context.stroke()
      drawText(
        context,
        axes.x.labels[tickIndex],
        x,
        bounds.height - margins.bottom + axes.lineHeight,
        { font: axisFont, color: '#b4c8d5' },
      )
    })

    context.strokeStyle = 'rgba(226, 235, 240, 0.6)'
    context.lineWidth = 1
    context.beginPath()
    context.moveTo(margins.left, margins.top)
    context.lineTo(margins.left, bounds.height - margins.bottom)
    context.lineTo(
      bounds.width - margins.right,
      bounds.height - margins.bottom,
    )
    context.stroke()

    context.strokeStyle = '#a8c9ed'
    context.lineWidth = compact ? 1.6 : 1.85
    context.lineJoin = 'round'
    context.lineCap = 'round'

    const usePhaseScatter = requiresContinuityNeutralPoints(variable)

    if (usePhaseScatter) {
      context.fillStyle = '#a8c9ed'
      samples.forEach((sample) => {
        if (!isFiniteProfileSample(sample, variable.id)) return
        const x = xScale(sample.ring_radius_km)
        const y = yScale(sample[variable.id])
        context.beginPath()
        context.arc(x, y, compact ? 1.1 : 1.35, 0, Math.PI * 2)
        context.fill()
      })
    } else {
      context.beginPath()
      let previous = null
      samples.forEach((sample) => {
        if (!isFiniteProfileSample(sample, variable.id)) {
          previous = null
          return
        }
        const x = xScale(sample.ring_radius_km)
        const y = yScale(sample[variable.id])
        if (shouldBreakProfile(previous, sample, dataMode, interval)) context.moveTo(x, y)
        else context.lineTo(x, y)
        previous = sample
      })
      context.stroke()
    }

    drawText(
      context,
      'Ring radius (km)',
      margins.left + plotWidth / 2,
      bounds.height - 12,
      { font: axisFont, color: '#bdd0dc' },
    )

    const markers = comparisonSample
      ? [{ sample: comparisonSample, color: '#e1c69c', label: 'A' }, { sample: currentInspected, color: '#a8c9ed', label: 'B' }]
      : [{ sample: currentInspected, color: '#e1c69c', label: 'A' }]
    markers.forEach(({ sample, color, label }) => {
      if (!sample || sample.ring_radius_km < xMinimum || sample.ring_radius_km > xMaximum) return
      const x = xScale(sample.ring_radius_km)
      context.strokeStyle = color
      context.setLineDash([4, 5])
      context.beginPath()
      context.moveTo(x, margins.top)
      context.lineTo(x, bounds.height - margins.bottom)
      context.stroke()
      context.setLineDash([])
      drawText(context, label, Math.max(margins.left + 7, Math.min(bounds.width - margins.right - 7, x)), margins.top - 7, { font: axisFont, color })
      if (!isFiniteProfileSample(sample, variable.id)) return
      const y = yScale(sample[variable.id])
      context.fillStyle = color
      context.beginPath()
      context.arc(x, y, 4.5, 0, Math.PI * 2)
      context.fill()
      context.strokeStyle = '#0c1725'
      context.lineWidth = 2
      context.stroke()
    })
  }, [comparisonSample, currentInspected, dataMode, interval, radiusExtent, samples, valueExtent, variable])

  const requestDraw = useCallback(() => {
    if (resizeFrameRef.current !== null) return
    resizeFrameRef.current = requestAnimationFrame(() => {
      resizeFrameRef.current = null
      drawRef.current?.()
    })
  }, [])

  useEffect(() => {
    samplesRef.current = inspectableSamples
    onInspectRef.current = onInspect
    drawRef.current = draw
    requestDraw()
  }, [draw, inspectableSamples, onInspect, requestDraw])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined
    const observer = new ResizeObserver(requestDraw)
    observer.observe(canvas)
    document.fonts?.addEventListener('loadingdone', requestDraw)
    return () => {
      observer.disconnect()
      document.fonts?.removeEventListener('loadingdone', requestDraw)
      if (resizeFrameRef.current !== null) {
        cancelAnimationFrame(resizeFrameRef.current)
        resizeFrameRef.current = null
      }
    }
  }, [requestDraw])

  function inspectAtClientX(clientX) {
    if (!interactive || !Number.isFinite(clientX)) return
    const layout = layoutRef.current
    // Ignore a click until the newly selected sample set is actually drawn.
    if (!layout || layout.samples !== samples) return
    const canvasBounds = canvasRef.current.getBoundingClientRect()
    const localX = clientX - canvasBounds.left
    const ratio = Math.min(1, Math.max(0, (localX - layout.margins.left) / layout.plotWidth))
    const radius = layout.xMinimum + ratio * (layout.xMaximum - layout.xMinimum)
    const sample = nearestSample(inspectableSamples, radius)
    if (sample && sample.sample_index !== currentInspected?.sample_index) {
      onInspect?.(sample)
    }
  }

  function handleKeyDown(event) {
    if (!interactive) return
    if (event.key === 'Escape') {
      event.preventDefault()
      onInspectRef.current?.(null)
      return
    }
    const direction = inspectableSamples[0].ring_radius_km <= inspectableSamples.at(-1).ring_radius_km ? 1 : -1
    const keyOffsets = {
      ArrowLeft: -direction,
      ArrowRight: direction,
      Home: -direction * Infinity,
      End: direction * Infinity,
    }
    if (!(event.key in keyOffsets)) return
    event.preventDefault()
    const sample = sampleAtOffset(
      samplesRef.current,
      currentInspected,
      keyOffsets[event.key],
    )
    if (sample) onInspectRef.current?.(sample)
  }

  return (
    <div className="scientific-profile">
      <div className="scientific-profile-heading">
        <span>{scopeLabel}</span>
        <div className="scientific-profile-mode">
          <strong>
            {dataMode === 'exact' && 'Exact samples'}
            {dataMode === 'overview' && 'Overview'}
            {dataMode === 'loading_exact' && 'Loading samples'}
            {dataMode === 'error' && 'Exact data unavailable'}
          </strong>
          {(dataMode === 'overview' || dataMode === 'loading_exact') && (
            <details
              onToggle={(event) => setModeDetailsOpen(event.currentTarget.open)}
            >
              <summary aria-expanded={modeDetailsOpen}>About display mode</summary>
              <p>
                Overview is a display-only reduction of exact converted source
                rows. Narrow the radial range to load exact converted samples.
              </p>
            </details>
          )}
        </div>
      </div>
      <div className="scientific-profile-frame">
        <canvas
          ref={canvasRef}
          role={interactive ? 'slider' : 'img'}
          aria-label={ariaDescription}
          aria-valuemin={interactive ? radiusExtent[0] : undefined}
          aria-valuemax={interactive ? radiusExtent[1] : undefined}
          aria-valuenow={interactive ? accessibleSample?.ring_radius_km : undefined}
          aria-valuetext={interactive && accessibleSample
            ? `Source sample ${accessibleSample.sample_index} at ${formatRadius(accessibleSample.ring_radius_km)} kilometers; ${variable.label}: ${Number.isFinite(accessibleSample[variable.id]) ? `${formatScientificValue(accessibleSample[variable.id])} ${displayUnit(variable.unit)}` : 'missing value'}`
            : undefined}
          tabIndex={interactive ? 0 : undefined}
          onPointerDown={(event) => {
            if (event.button !== 0) return
            event.currentTarget.focus()
            inspectAtClientX(event.clientX)
          }}
          onKeyDown={handleKeyDown}
        />
        {(statusMessage || emptyFieldMessage) && (
          <p className="scientific-profile-status" role="status">
            {statusMessage || emptyFieldMessage}
          </p>
        )}
      </div>
      {hasRequestedRange && radiusExtent && coverageDiffers && (
        <p className="profile-range-note">
          {coverageDiffers
            ? `${dataMode === 'exact' ? 'Loaded samples' : 'Overview points'} cover ${formatBoundary(radiusExtent[0])}–${formatBoundary(radiusExtent[1])} km within the requested ${formatBoundary(requestedRange[0])}–${formatBoundary(requestedRange[1])} km. `
            : ''}
          Tick marks label the scale; the radius inputs set the window.
        </p>
      )}
    </div>
  )
}
