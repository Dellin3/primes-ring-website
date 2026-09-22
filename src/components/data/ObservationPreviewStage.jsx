import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  loadObservationOverview,
  overviewSamples,
} from '../../lib/webObservation.js'
import ObservationRadialScene from './ObservationRadialScene.jsx'
import { formatObservationPrimaryLabel } from '../../lib/observationLabels.js'
import ScientificProfileCanvas from './ScientificProfileCanvas.jsx'
import '../../styles/profile-refinements.css'

function formatRadius(value) {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
  }).format(value)
}

export default function ObservationPreviewStage({
  observation,
  radialDomain,
}) {
  const [request, setRequest] = useState({
    datasetId: '',
    status: 'loading',
    overview: null,
  })

  useEffect(() => {
    let cancelled = false
    loadObservationOverview(observation)
      .then((overview) => {
        if (overview.dataset_id !== observation.dataset_id) {
          throw new Error('Observation overview identifier mismatch')
        }
        if (!cancelled) {
          setRequest({
            datasetId: observation.dataset_id,
            status: 'ready',
            overview,
          })
        }
      })
      .catch(() => {
        if (!cancelled) {
          setRequest({
            datasetId: observation.dataset_id,
            status: 'error',
            overview: null,
          })
        }
      })
    return () => {
      cancelled = true
    }
  }, [observation])

  const current = request.datasetId === observation.dataset_id
  const status = current ? request.status : 'loading'
  const samples = useMemo(
    () => (
      current && request.overview
        ? overviewSamples(request.overview)
        : []
    ),
    [current, request.overview],
  )
  const variable = observation.principal_variables.find(
    (item) => item.id === 'optical_depth',
  ) ?? observation.principal_variables[0]
  const observationRange = [
    observation.radial_range.minimum,
    observation.radial_range.maximum,
  ]

  return (
    <>
      <section
        key={observation.dataset_id}
        className="observation-preview-main"
        aria-labelledby="selected-observation-title"
        aria-live="polite"
      >
        <header className="observation-preview-main-header">
          <p className="eyebrow">Selected observation</p>
          <h2 id="selected-observation-title">
            {formatObservationPrimaryLabel(observation)}
          </h2>
          <p className="observation-preview-subtitle">
            {observation.ring_observation_id}
            {' · '}
            {variable.label}
          </p>
        </header>

        <div className="observation-preview-profile">
          {status === 'ready' && (
            <ScientificProfileCanvas
              samples={samples}
              variable={variable}
              inspectedSample={null}
              onInspect={() => {}}
              dataMode="overview"
              scopeLabel="Full observation"
              statusMessage=""
            />
          )}
          {status === 'loading' && (
            <div className="observatory-stage-status" role="status">
              Loading the selected observation overview…
            </div>
          )}
          {status === 'error' && (
            <div className="observatory-stage-status is-error" role="alert">
              The selected overview could not be loaded.
            </div>
          )}
        </div>
      </section>

      <aside className="observation-context-rail" aria-label="Observation context">
        <ObservationRadialScene
          radialDomain={radialDomain}
          observationRange={observationRange}
          selectedRange={observationRange}
          compact
        />
        <div className="observation-context-copy">
          <span>{observation.product_type}</span>
          <p>
            Cassini RSS diffraction-limited profile. Open a region to inspect individual samples.
          </p>
        </div>
        <dl>
          <div>
            <dt>Source records</dt>
            <dd>{observation.record_count.toLocaleString('en-US')}</dd>
          </div>
          <div>
            <dt>Radial coverage</dt>
            <dd>
              <span className="observation-range-group">{formatRadius(observationRange[0])}–{formatRadius(observationRange[1])}{'\u00a0'}km</span>
            </dd>
          </div>
          <div>
            <dt>Profile direction</dt>
            <dd>{observation.ring_profile_direction}</dd>
          </div>
          <div>
            <dt>Product</dt>
            <dd>{observation.product_id}</dd>
          </div>
        </dl>
        <Link
          className="button button-primary open-profile-link"
          to={`/data/${observation.slug}`}
          aria-label={`Open profile: ${formatObservationPrimaryLabel(observation)}`}
        >
          Open profile →
        </Link>
      </aside>
    </>
  )
}
