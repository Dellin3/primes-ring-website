import { useId } from 'react'

const VIEWBOX_WIDTH = 360
const VIEWBOX_HEIGHT = 200
const CENTER_X = 180
const CENTER_Y = 108
const MINIMUM_RX = 42
const MAXIMUM_RX = 158
const ELLIPSE_RATIO = 0.28

function formatRadius(value) {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 1,
  }).format(value)
}

function mappedRadius(radius, domain) {
  const [minimum, maximum] = domain
  const normalized = (radius - minimum) / (maximum - minimum || 1)
  return MINIMUM_RX + Math.min(1, Math.max(0, normalized)) * (
    MAXIMUM_RX - MINIMUM_RX
  )
}

function ellipsePath(rx) {
  const ry = rx * ELLIPSE_RATIO
  return [
    `M ${CENTER_X - rx} ${CENTER_Y}`,
    `A ${rx} ${ry} 0 1 0 ${CENTER_X + rx} ${CENTER_Y}`,
    `A ${rx} ${ry} 0 1 0 ${CENTER_X - rx} ${CENTER_Y}`,
    'Z',
  ].join(' ')
}

function annularPath(minimumRadius, maximumRadius, domain) {
  const innerRx = mappedRadius(minimumRadius, domain)
  const outerRx = Math.max(innerRx + 1.5, mappedRadius(maximumRadius, domain))
  return `${ellipsePath(outerRx)} ${ellipsePath(innerRx)}`
}

export default function ObservationRadialScene({
  radialDomain,
  observationRange,
  selectedRange,
  inspectedRadius = null,
  compact = false,
}) {
  const titleId = useId()
  const descriptionId = useId()
  const domain = [radialDomain.minimum, radialDomain.maximum]
  const windowed = (
    selectedRange[0] !== observationRange[0]
    || selectedRange[1] !== observationRange[1]
  )
  const guideRadii = Array.from({ length: 4 }, (_, index) => (
    MINIMUM_RX + ((MAXIMUM_RX - MINIMUM_RX) * (index + 1)) / 5
  ))
  const sampleRx = inspectedRadius === null
    ? null
    : mappedRadius(inspectedRadius, domain)
  const sampleAngle = -0.28
  const sampleX = sampleRx === null
    ? null
    : CENTER_X + Math.cos(sampleAngle) * sampleRx
  const sampleY = sampleRx === null
    ? null
    : CENTER_Y + Math.sin(sampleAngle) * sampleRx * ELLIPSE_RATIO

  return (
    <figure
      className={`observation-radial-scene${compact ? ' is-compact' : ''}${windowed ? ' is-windowed' : ''}`}
    >
      <div className="radial-scene-heading">
        <span>Global reference scale</span>
        <strong>Conceptual radial locator; not to scale. Current coverage and selected window are highlighted.</strong>
      </div>
      <svg
        viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
        role="img"
        aria-labelledby={`${titleId} ${descriptionId}`}
      >
        <title id={titleId}>Observation radial coverage locator</title>
        <desc id={descriptionId}>
          Complete observation spans {formatRadius(observationRange[0])} to{' '}
          {formatRadius(observationRange[1])} kilometers.
          Selected window spans {formatRadius(selectedRange[0])} to{' '}
          {formatRadius(selectedRange[1])} kilometers.
          {inspectedRadius !== null && (
            <> Exact inspected sample is at {formatRadius(inspectedRadius)} kilometers.</>
          )}
        </desc>
        <g className="radial-scene-plane" transform={`rotate(-11 ${CENTER_X} ${CENTER_Y})`}>
          <ellipse
            className="radial-scene-plane-fill"
            cx={CENTER_X}
            cy={CENTER_Y}
            rx={MAXIMUM_RX}
            ry={MAXIMUM_RX * ELLIPSE_RATIO}
          />
          {guideRadii.map((rx) => (
            <ellipse
              key={rx}
              className="radial-scene-guide"
              cx={CENTER_X}
              cy={CENTER_Y}
              rx={rx}
              ry={rx * ELLIPSE_RATIO}
            />
          ))}
          <path
            className="radial-scene-coverage"
            d={annularPath(observationRange[0], observationRange[1], domain)}
            fillRule="evenodd"
          />
          <path
            className="radial-scene-window"
            d={annularPath(selectedRange[0], selectedRange[1], domain)}
            fillRule="evenodd"
          />
          <ellipse
            className="radial-scene-planet"
            cx={CENTER_X}
            cy={CENTER_Y}
            rx="18"
            ry="17"
          />
          {sampleX !== null && sampleY !== null && (
            <g className="radial-scene-sample">
              <line x1={CENTER_X} y1={CENTER_Y} x2={sampleX} y2={sampleY} />
              <circle cx={sampleX} cy={sampleY} r="4.5" />
            </g>
          )}
        </g>
        <text className="radial-scene-minimum" x="8" y={VIEWBOX_HEIGHT - 8}>
          {formatRadius(domain[0])} km
        </text>
        <text
          className="radial-scene-maximum"
          x={VIEWBOX_WIDTH - 8}
          y={VIEWBOX_HEIGHT - 8}
          textAnchor="end"
        >
          {formatRadius(domain[1])} km
        </text>
      </svg>
      <ul className="radial-scene-legend" aria-label="Radial locator legend">
        <li>
          <span className="is-coverage" aria-hidden="true" />
          <span>Complete observation coverage</span>
        </li>
        <li>
          <span className="is-window" aria-hidden="true" />
          <span>Selected radial window</span>
        </li>
        <li className={inspectedRadius === null ? 'is-inactive' : undefined}>
          <span className="is-sample" aria-hidden="true" />
          <span>
            Exact inspected sample
            {inspectedRadius !== null && ` · ${formatRadius(inspectedRadius)} km`}
          </span>
        </li>
      </ul>
    </figure>
  )
}
