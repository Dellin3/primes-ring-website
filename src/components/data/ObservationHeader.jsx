import { Link } from 'react-router-dom'
import ObservationRadialScene from './ObservationRadialScene.jsx'
import { formatObservationPrimaryLabel } from '../../lib/observationLabels.js'

function formatRadius(value, maximumFractionDigits = 2) {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits,
  }).format(value)
}

export default function ObservationHeader({
  metadata,
  fullRange,
  selectedRange,
  inspectedRadius,
  catalogRadialDomain,
  productDescriptor,
}) {
  const observation = metadata.observation
  const identity = metadata.pds_identity

  return (
    <header className="observation-identity">
      <div className="observation-identity-copy">
        <Link className="observation-back-link" to="/data">
          ← Cassini Data Observatory
        </Link>
        <p className="eyebrow">Conversion-verified complete DLP profile product</p>
        <h1>{formatObservationPrimaryLabel({
          revolution_number: observation.revolution_number,
          ring_profile_direction: observation.ring_profile_direction,
          band: observation.band,
          dsn_station_number: observation.dsn_station_number,
        })}
        </h1>
        <p className="observation-identity-subtitle">
          Cassini RSS diffraction-limited profile
        </p>
        <p className="observation-product-line">{identity.ring_observation_id}</p>
        <p className="observation-product-id">{identity.product_id}</p>
      </div>
      <div className="observation-identity-context">
        <ObservationRadialScene
          radialDomain={catalogRadialDomain ?? {
            minimum: fullRange[0],
            maximum: fullRange[1],
          }}
          observationRange={fullRange}
          selectedRange={selectedRange}
          inspectedRadius={inspectedRadius}
          compact
        />
        <dl>
          <div>
            <dt>Exact converted records</dt>
            <dd>{observation.record_count.toLocaleString('en-US')}</dd>
          </div>
          <div>
            <dt>Radial coverage</dt>
            <dd>
              {formatRadius(fullRange[0])}–{formatRadius(fullRange[1])} km
            </dd>
          </div>
          <div>
            <dt>Profile direction</dt>
            <dd>{observation.ring_profile_direction}</dd>
          </div>
          <div>
            <dt>PDS product type</dt>
            <dd>{identity.product_type} · {productDescriptor}</dd>
          </div>
        </dl>
      </div>
    </header>
  )
}
