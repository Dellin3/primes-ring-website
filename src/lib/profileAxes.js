const STEPS = [1, 2, 2.5, 5, 10]

// Tick placement is independent of the plotted domain: no rounding of the
// domain, sample positions, inspection values, or exported source records.
export function niceAxisTicks(minimum, maximum, targetCount = 5) {
  if (!Number.isFinite(minimum) || !Number.isFinite(maximum) || minimum > maximum) {
    return { values: [], step: null }
  }
  if (minimum === maximum) return { values: [minimum], step: null }
  const intervals = Math.max(1, Math.min(11, Math.floor(targetCount) - 1))
  const roughStep = (maximum - minimum) / intervals
  const magnitude = 10 ** Math.floor(Math.log10(roughStep))
  const normalized = roughStep / magnitude
  const factor = STEPS.reduce((best, candidate) => (
    Math.abs(Math.log(candidate / normalized)) < Math.abs(Math.log(best / normalized)) ? candidate : best
  ))
  const step = factor * magnitude
  if (!Number.isFinite(step) || step <= 0) return { values: [minimum, maximum], step: null }
  const first = Math.ceil(minimum / step - 1e-10)
  const final = Math.floor(maximum / step + 1e-10)
  const values = []
  for (let multiplier = first; multiplier <= final && values.length < 12; multiplier += 1) {
    const value = Number((multiplier * step).toPrecision(15))
    // Rounding a tick must never extend the source-derived domain.
    if (value >= minimum && value <= maximum) values.push(Object.is(value, -0) ? 0 : value)
  }
  return { values: values.length ? values : [minimum, maximum], step }
}

function decimalPlaces(step) {
  if (!Number.isFinite(step) || step === 0) return 6
  for (let digits = 0; digits <= 12; digits += 1) {
    const scaled = step * 10 ** digits
    if (scaled >= 1 && Math.abs(scaled - Math.round(scaled)) < 1e-8) return digits
  }
  return 12
}

export function axisTickFormatter({ minimum, maximum, step, radius = false }) {
  const magnitude = Math.max(Math.abs(minimum), Math.abs(maximum))
  const scientific = !radius && magnitude > 0 && (
    magnitude < 0.0001 || (magnitude >= 1e7 && maximum - minimum > magnitude * 0.001)
  )
  const decimals = decimalPlaces(step)
  const numberFormat = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: decimals,
    useGrouping: true,
  })
  return (value) => {
    if (!Number.isFinite(value)) return ''
    if (value === 0) return '0'
    if (scientific) {
      const significantDigits = Number.isFinite(step) && step > 0
        ? Math.max(1, Math.min(12, Math.ceil(Math.log10(Math.abs(value) / step)) + 2))
        : 3
      return Number(value.toPrecision(significantDigits)).toExponential().replace('e+', 'e').replaceAll('-', '−')
    }
    return numberFormat.format(value).replaceAll('-', '−')
  }
}

export function measuredAxisTicks(minimum, maximum, pixelSpan, measureText, { radius = false, gap = 18, maxTicks = 8 } = {}) {
  for (let count = maxTicks; count >= 2; count -= 1) {
    const ticks = niceAxisTicks(minimum, maximum, count)
    const format = axisTickFormatter({ minimum, maximum, step: ticks.step, radius })
    const labels = ticks.values.map(format)
    const widths = labels.map((label) => measureText(label))
    const span = maximum - minimum || 1
    const separated = ticks.values.every((value, index) => (
      index === 0 || (value - ticks.values[index - 1]) / span * pixelSpan
        >= (widths[index - 1] + widths[index]) / 2 + gap
    ))
    if (separated) return { ...ticks, labels, widths }
    if (count === 2) {
      const middle = Math.floor(ticks.values.length / 2)
      return { step: ticks.step, values: [ticks.values[middle]], labels: [labels[middle]], widths: [widths[middle]] }
    }
  }
  return { values: [], labels: [], widths: [], step: null }
}

export function wrapAxisTitle(title, maximumWidth, measureText) {
  const lines = []
  for (const word of title.split(/\s+/)) {
    const previous = lines.at(-1)
    if (previous && measureText(`${previous} ${word}`) <= maximumWidth) {
      lines[lines.length - 1] = `${previous} ${word}`
    } else lines.push(word)
  }
  return lines
}

export function measuredProfileAxes({ width, height, xDomain, yDomain, fontSize, measureText, yTitle }) {
  const lineHeight = Math.ceil(fontSize * 1.45)
  const yTickCount = Math.max(2, Math.min(6, Math.floor((height - lineHeight * 4) / (lineHeight * 2.3))))
  const y = niceAxisTicks(...yDomain, yTickCount)
  const formatY = axisTickFormatter({ minimum: yDomain[0], maximum: yDomain[1], step: y.step })
  y.labels = y.values.map(formatY)
  y.widths = y.labels.map(measureText)
  const preliminaryX = measuredAxisTicks(...xDomain, width, measureText, { radius: true })
  const widestX = Math.max(0, ...preliminaryX.widths)
  const margins = {
    left: Math.ceil(Math.max(Math.max(0, ...y.widths) + 18, widestX / 2 + 8)),
    right: Math.ceil(Math.max(fontSize, widestX / 2 + 8)),
    bottom: lineHeight * 2 + 17,
    top: 0,
  }
  const plotWidth = Math.max(1, width - margins.left - margins.right)
  const titleLines = wrapAxisTitle(yTitle, plotWidth, measureText)
  margins.top = titleLines.length * lineHeight + 19
  const plotHeight = Math.max(1, height - margins.top - margins.bottom)
  const x = measuredAxisTicks(...xDomain, plotWidth, measureText, { radius: true })
  return { x, y, margins, plotWidth, plotHeight, titleLines, lineHeight }
}
