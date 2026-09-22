import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
} from 'react'
import { requiresContinuityNeutralPoints } from '../../lib/profileSegments.js'
import { displayUnit, isFiniteProfileSample, numericExtent } from '../../lib/profileRendering.js'
import { measuredAxisTicks } from '../../lib/profileAxes.js'
import '../../styles/profile-refinements.css'

const MAX_DEVICE_PIXEL_RATIO = 1.5

function clampedRange(range, fullRange, minimumSpan) {
  const [fullMinimum, fullMaximum] = fullRange
  let [minimum, maximum] = range
  if (maximum - minimum < minimumSpan) {
    maximum = minimum + minimumSpan
  }
  if (minimum < fullMinimum) {
    maximum += fullMinimum - minimum
    minimum = fullMinimum
  }
  if (maximum > fullMaximum) {
    minimum -= maximum - fullMaximum
    maximum = fullMaximum
  }
  return [
    Math.max(fullMinimum, minimum),
    Math.min(fullMaximum, maximum),
  ]
}

export default function ObservationNavigator({
  samples,
  variable,
  fullRange,
  selectedRange,
  minimumWindowSpan,
  onRangeChange,
  onRangeCommit,
}) {
  const instructionsId = useId()
  const valueExtent = useMemo(() => numericExtent(samples, variable.id, 0), [samples, variable.id])
  const canvasRef = useRef(null)
  const drawRef = useRef(null)
  const drawFrameRef = useRef(null)
  const pointerFrameRef = useRef(null)
  const pendingPointerXRef = useRef(null)
  const layoutRef = useRef(null)
  const interactionRef = useRef(null)
  const selectedRangeRef = useRef(selectedRange)
  const proposedRangeRef = useRef(selectedRange)
  const onRangeChangeRef = useRef(onRangeChange)
  const onRangeCommitRef = useRef(onRangeCommit)

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
    context.fillStyle = '#0a1928'
    context.fillRect(0, 0, bounds.width, bounds.height)

    const style = getComputedStyle(canvas)
    const fontSize = Number.parseFloat(style.fontSize) || 12
    const axisFont = `${fontSize}px ${style.fontFamily}`
    context.font = axisFont
    const ticks = measuredAxisTicks(...fullRange, bounds.width - 70, (text) => context.measureText(text).width, { radius: true, maxTicks: 5 })
    const sideMargin = Math.ceil(Math.max(12, Math.max(0, ...ticks.widths) / 2 + 6))
    const margins = { top: 12, right: sideMargin, bottom: fontSize * 1.5 + 8, left: sideMargin }
    const plotWidth = Math.max(1, bounds.width - margins.left - margins.right)
    const plotHeight = Math.max(1, bounds.height - margins.top - margins.bottom)
    const [fullMinimum, fullMaximum] = fullRange
    const fullSpan = fullMaximum - fullMinimum || 1
    const [yMinimum, yMaximum] = valueExtent ?? [0, 1]
    const ySpan = yMaximum - yMinimum || 1
    const xScale = (value) => (
      margins.left + ((value - fullMinimum) / fullSpan) * plotWidth
    )
    const yScale = (value) => (
      margins.top + (1 - ((value - yMinimum) / ySpan)) * plotHeight
    )
    layoutRef.current = {
      bounds,
      margins,
      plotWidth,
      fullMinimum,
      fullMaximum,
      xScale,
    }

    if (requiresContinuityNeutralPoints(variable)) {
      context.fillStyle = 'rgba(159, 213, 238, 0.58)'
      samples.forEach((sample) => {
        if (!isFiniteProfileSample(sample, variable.id)) return
        context.beginPath()
        context.arc(
          xScale(sample.ring_radius_km),
          yScale(sample[variable.id]),
          1.1,
          0,
          Math.PI * 2,
        )
        context.fill()
      })
    } else {
      context.strokeStyle = 'rgba(159, 213, 238, 0.48)'
      context.lineWidth = 1
      context.beginPath()
      let previous = null
      samples.forEach((sample) => {
        if (!isFiniteProfileSample(sample, variable.id)) {
          previous = null
          return
        }
        const x = xScale(sample.ring_radius_km)
        const y = yScale(sample[variable.id])
        // Overview intentionally keeps sparse source samples. Only an actual
        // missing value breaks this display-only line, not a source-index skip.
        if (!previous) context.moveTo(x, y)
        else context.lineTo(x, y)
        previous = sample
      })
      context.stroke()
    }

    const [selectedMinimum, selectedMaximum] = selectedRange
    const selectedLeft = xScale(selectedMinimum)
    const selectedRight = xScale(selectedMaximum)
    context.fillStyle = 'rgba(2, 10, 18, 0.48)'
    context.fillRect(
      margins.left,
      margins.top,
      selectedLeft - margins.left,
      plotHeight,
    )
    context.fillRect(
      selectedRight,
      margins.top,
      bounds.width - margins.right - selectedRight,
      plotHeight,
    )
    context.fillStyle = 'rgba(213, 185, 120, 0.18)'
    context.fillRect(
      selectedLeft,
      margins.top,
      Math.max(2, selectedRight - selectedLeft),
      plotHeight,
    )
    context.strokeStyle = '#c5a45f'
    context.lineWidth = 1.5
    context.strokeRect(
      selectedLeft,
      margins.top,
      Math.max(2, selectedRight - selectedLeft),
      plotHeight,
    )
    const handleWidth = 6
    context.fillStyle = '#e3ca91'
    context.fillRect(selectedLeft - handleWidth / 2, margins.top, handleWidth, plotHeight)
    context.fillRect(selectedRight - handleWidth / 2, margins.top, handleWidth, plotHeight)
    context.strokeStyle = '#c5a45f'
    context.lineWidth = 1
    context.strokeRect(selectedLeft - handleWidth / 2, margins.top, handleWidth, plotHeight)
    context.strokeRect(selectedRight - handleWidth / 2, margins.top, handleWidth, plotHeight)

    context.fillStyle = '#b4c8d5'
    context.font = axisFont
    context.textBaseline = 'bottom'
    context.textAlign = 'center'
    ticks.values.forEach((value, index) => context.fillText(ticks.labels[index], xScale(value), bounds.height - 3))
  }, [fullRange, samples, selectedRange, valueExtent, variable])

  const requestDraw = useCallback(() => {
    if (drawFrameRef.current !== null) return
    drawFrameRef.current = requestAnimationFrame(() => {
      drawFrameRef.current = null
      drawRef.current?.()
    })
  }, [])

  useEffect(() => {
    selectedRangeRef.current = selectedRange
    proposedRangeRef.current = selectedRange
    onRangeChangeRef.current = onRangeChange
    onRangeCommitRef.current = onRangeCommit
    drawRef.current = draw
    requestDraw()
  }, [draw, onRangeChange, onRangeCommit, requestDraw, selectedRange])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined
    const observer = new ResizeObserver(requestDraw)
    observer.observe(canvas)
    document.fonts?.addEventListener('loadingdone', requestDraw)
    return () => {
      observer.disconnect()
      document.fonts?.removeEventListener('loadingdone', requestDraw)
      if (drawFrameRef.current !== null) {
        cancelAnimationFrame(drawFrameRef.current)
        drawFrameRef.current = null
      }
      if (pointerFrameRef.current !== null) {
        cancelAnimationFrame(pointerFrameRef.current)
        pointerFrameRef.current = null
      }
    }
  }, [requestDraw])

  function radiusAtClientX(clientX) {
    const layout = layoutRef.current
    if (!layout) return fullRange[0]
    const canvasBounds = canvasRef.current.getBoundingClientRect()
    const localX = clientX - canvasBounds.left
    const ratio = Math.min(
      1,
      Math.max(
        0,
        (localX - layout.margins.left) / layout.plotWidth,
      ),
    )
    return layout.fullMinimum + ratio * (
      layout.fullMaximum - layout.fullMinimum
    )
  }

  function publishRange(nextRange) {
    const clamped = clampedRange(
      nextRange,
      fullRange,
      minimumWindowSpan,
    )
    selectedRangeRef.current = clamped
    proposedRangeRef.current = clamped
    onRangeChangeRef.current?.(clamped)
  }

  function processPointer(clientX) {
    const interaction = interactionRef.current
    if (!interaction) return
    const radius = radiusAtClientX(clientX)
    const delta = radius - interaction.startRadius
    const [startMinimum, startMaximum] = interaction.startRange
    if (interaction.mode === 'left') {
      publishRange([
        Math.min(startMaximum - minimumWindowSpan, startMinimum + delta),
        startMaximum,
      ])
    } else if (interaction.mode === 'right') {
      publishRange([
        startMinimum,
        Math.max(startMinimum + minimumWindowSpan, startMaximum + delta),
      ])
    } else {
      publishRange([
        startMinimum + delta,
        startMaximum + delta,
      ])
    }
  }

  function handlePointerDown(event) {
    const layout = layoutRef.current
    if (!layout) return
    event.currentTarget.setPointerCapture(event.pointerId)
    const radius = radiusAtClientX(event.clientX)
    const [minimum, maximum] = selectedRangeRef.current
    const leftX = layout.xScale(minimum)
    const rightX = layout.xScale(maximum)
    const localX = event.clientX
      - canvasRef.current.getBoundingClientRect().left
    const handleDistance = 14
    let mode = 'drag'
    let startRange = [minimum, maximum]
    if (Math.abs(localX - leftX) <= handleDistance) {
      mode = 'left'
    } else if (Math.abs(localX - rightX) <= handleDistance) {
      mode = 'right'
    } else if (radius < minimum || radius > maximum) {
      const span = maximum - minimum
      startRange = clampedRange(
        [radius - span / 2, radius + span / 2],
        fullRange,
        minimumWindowSpan,
      )
      publishRange(startRange)
    }
    interactionRef.current = {
      mode,
      startRadius: radius,
      startRange,
    }
  }

  function handlePointerMove(event) {
    if (!interactionRef.current) return
    pendingPointerXRef.current = event.clientX
    if (pointerFrameRef.current !== null) return
    pointerFrameRef.current = requestAnimationFrame(() => {
      pointerFrameRef.current = null
      processPointer(pendingPointerXRef.current)
    })
  }

  function handlePointerEnd(event) {
    if (!interactionRef.current) return
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    processPointer(event.clientX)
    interactionRef.current = null
    onRangeCommitRef.current?.(proposedRangeRef.current)
  }

  function updateBoundary(boundary, value) {
    const [minimum, maximum] = selectedRangeRef.current
    if (String(value).trim() === '') return
    const numericValue = Number(value)
    if (!Number.isFinite(numericValue)) return
    const nextRange = boundary === 'lower'
      ? [Math.min(numericValue, maximum - minimumWindowSpan), maximum]
      : [minimum, Math.max(numericValue, minimum + minimumWindowSpan)]
    const next = clampedRange(nextRange, fullRange, minimumWindowSpan)
    publishRange(next)
    onRangeCommitRef.current?.(next)
  }

  function handleBoundaryKey(event, boundary) {
    const direction = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1, PageUp: 10, PageDown: -10 }[event.key]
    if (direction === undefined && event.key !== 'Home' && event.key !== 'End') return
    event.preventDefault()
    const [minimum, maximum] = selectedRangeRef.current
    const current = boundary === 'lower' ? minimum : maximum
    const allowedMinimum = boundary === 'lower' ? fullRange[0] : minimum + minimumWindowSpan
    const allowedMaximum = boundary === 'lower' ? maximum - minimumWindowSpan : fullRange[1]
    const value = event.key === 'Home' ? allowedMinimum : event.key === 'End' ? allowedMaximum : current + direction * boundaryStep
    updateBoundary(boundary, Math.max(allowedMinimum, Math.min(allowedMaximum, value)))
  }

  const fullObservationSelected = (
    selectedRange[0] === fullRange[0]
    && selectedRange[1] === fullRange[1]
  )
  const format = (value) => new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
  }).format(value)
  const boundaryStep = Math.max(0.000001, minimumWindowSpan / 16)

  return (
    <div className="observation-navigator">
      <div className="observation-navigator-heading">
        <span>Full observation</span>
        <strong>
          {fullObservationSelected
            ? 'Full observation selected'
            : `Selected radial window · ${format(selectedRange[0])}–${format(selectedRange[1])} km`}
        </strong>
      </div>
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={`${variable.label} (${displayUnit(variable.unit)}) source-sample overview with selected radial window from ${format(selectedRange[0])} to ${format(selectedRange[1])} kilometers`}
        aria-describedby={instructionsId}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
      />
      {!valueExtent && (
        <p role="status">No finite {variable.label.toLowerCase()} values are available for this overview. The radius controls remain available.</p>
      )}
      <div className="observation-navigator-boundaries">
        <label>
          <span>Lower radius boundary</span>
          <input
            type="range"
            min={fullRange[0]}
            max={selectedRange[1] - minimumWindowSpan}
            step={boundaryStep}
            value={selectedRange[0]}
            aria-label="Lower radius boundary"
            aria-valuemin={fullRange[0]}
            aria-valuemax={selectedRange[1] - minimumWindowSpan}
            aria-valuenow={selectedRange[0]}
            aria-valuetext={`${format(selectedRange[0])} kilometers`}
            onKeyDown={(event) => handleBoundaryKey(event, 'lower')}
            onChange={(event) => updateBoundary('lower', event.target.value)}
          />
          <output>{format(selectedRange[0])} km</output>
        </label>
        <label>
          <span>Upper radius boundary</span>
          <input
            type="range"
            min={selectedRange[0] + minimumWindowSpan}
            max={fullRange[1]}
            step={boundaryStep}
            value={selectedRange[1]}
            aria-label="Upper radius boundary"
            aria-valuemin={selectedRange[0] + minimumWindowSpan}
            aria-valuemax={fullRange[1]}
            aria-valuenow={selectedRange[1]}
            aria-valuetext={`${format(selectedRange[1])} kilometers`}
            onKeyDown={(event) => handleBoundaryKey(event, 'upper')}
            onChange={(event) => updateBoundary('upper', event.target.value)}
          />
          <output>{format(selectedRange[1])} km</output>
        </label>
      </div>
      <p id={instructionsId}>
        Drag the window or its edges, or click to recenter. Keyboard users can
        adjust the lower and upper boundary controls independently.
      </p>
    </div>
  )
}
