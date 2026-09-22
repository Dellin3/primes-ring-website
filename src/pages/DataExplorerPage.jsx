import { useEffect, useState } from 'react'
import { Navigate, useSearchParams, Link } from 'react-router-dom'
import { getExample } from '../content/explorationExamples.js'
import PageMeta from '../components/common/PageMeta.jsx'
import ObservationPreviewStage from '../components/data/ObservationPreviewStage.jsx'
import ObservationRail from '../components/data/ObservationRail.jsx'
import { getFeaturedObservation } from '../content/observations.js'
import { loadObservationCatalog } from '../lib/webObservation.js'

export default function DataExplorerPage() {
  const [params] = useSearchParams()
  const [retry, setRetry] = useState(0)
  const [request, setRequest] = useState({
    status: 'loading',
    catalog: null,
    selectedDatasetId: null,
  })

  useEffect(() => {
    let cancelled = false
    loadObservationCatalog()
      .then((catalog) => {
        if (
          catalog.validation_status !== 'pass'
          || !catalog.observations?.length
        ) {
          throw new Error('No conversion-verified complete products are registered')
        }
        if (!cancelled) {
          setRequest({
            status: 'ready',
            catalog,
            selectedDatasetId: getFeaturedObservation(catalog).dataset_id,
          })
        }
      })
      .catch(() => {
        if (!cancelled) {
          setRequest({
            status: 'error',
            catalog: null,
            selectedDatasetId: null,
          })
        }
      })
    return () => {
      cancelled = true
    }
  }, [retry])

  const selectedObservation = request.catalog?.observations.find(
    (observation) => (
      observation.dataset_id === request.selectedDatasetId
    ),
  )

  if (params.get('guide') === '1' && selectedObservation) {
    const example = getExample(selectedObservation.dataset_id)
    if (example) return <Navigate replace to={`/data/${selectedObservation.slug}?guide=1&variable=${example.variableId}&from=${example.range[0]}&to=${example.range[1]}&version=${example.webProductVersion}`} />
  }

  return (
    <>
      <PageMeta
        title="Cassini Data Observatory"
        description="Conversion-verified complete Cassini RSS diffraction-limited profile products with progressive exact converted-sample inspection."
        path="/data"
      />
      <div className="data-observatory">
        <header className="data-observatory-intro">
          <p className="eyebrow">Explore real observations</p>
          <h1>Cassini Data Observatory</h1>
          <p>
            How do the recorded signals change across Saturn’s rings? Choose an observation to see its coverage, or start with an example region.
          </p>
          {request.catalog && (
            <span>
              {request.catalog.observation_count} available Cassini observations
            </span>
          )}
          <Link className="button button-primary" to="/data?guide=1">Start with an example observation</Link>
          <details><summary>Data & processing</summary><p>Diffraction-Limited Profiles (DLP) are calibrated Cassini Radio Science Subsystem (RSS) measurements, before removing diffraction. Overview points are display reductions; individual inspection and downloads use exact converted records.</p></details>
        </header>

        {request.status === 'loading' && (
          <div className="data-observatory-loading" role="status">
            Loading observation catalog…
          </div>
        )}
        {request.status === 'error' && (
          <div className="data-observatory-loading is-error" role="alert">
            The observation catalog could not be loaded. <button type="button" onClick={() => setRetry((value) => value + 1)}>Retry catalog</button>
          </div>
        )}
        {request.catalog && selectedObservation && (
          <div className="data-observatory-workspace">
            <ObservationRail
              observations={request.catalog.observations}
              selectedDatasetId={selectedObservation.dataset_id}
              onSelect={(observation) => {
                setRequest((current) => ({
                  ...current,
                  selectedDatasetId: observation.dataset_id,
                }))
              }}
            />
            <ObservationPreviewStage
              observation={selectedObservation}
              radialDomain={request.catalog.catalog_radial_domain_km}
            />
          </div>
        )}
      </div>
    </>
  )
}
