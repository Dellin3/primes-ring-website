import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { getExample } from '../content/explorationExamples.js'
import PageMeta from '../components/common/PageMeta.jsx'
import { getCatalogObservation } from '../content/observations.js'
import { loadObservationCatalog } from '../lib/webObservation.js'
import ObservationPage from './ObservationPage.jsx'

function normalizeObservation(entry, catalog) {
  return {
    ...entry,
    datasetId: entry.dataset_id,
    displayName: entry.display_name,
    ringObservationId: entry.ring_observation_id,
    productId: entry.product_id,
    basePath: entry.base_path,
    catalogEntries: catalog.observations,
    catalogRadialDomain: catalog.catalog_radial_domain_km,
  }
}

function DataObservationNotFound() {
  return (
    <>
      <PageMeta
        title="Observation Not Found"
        description="The requested Cassini Data Observatory profile is not registered."
        path="/data"
      />
      <section className="data-not-found" aria-labelledby="data-not-found-title">
        <p className="eyebrow">Data Observatory</p>
        <h1 id="data-not-found-title">Observation not found</h1>
        <p>
          The requested observation is not registered in the active
          DLP profile catalog.
        </p>
        <Link className="button button-primary" to="/data">
          Return to Data Observatory
        </Link>
      </section>
    </>
  )
}

export default function DatasetPage() {
  const { datasetSlug } = useParams()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [retry, setRetry] = useState(0)
  const [request, setRequest] = useState({
    slug: '',
    status: 'loading',
    observation: null,
  })

  useEffect(() => {
    let cancelled = false
    loadObservationCatalog()
      .then((catalog) => {
        const entry = getCatalogObservation(catalog, datasetSlug)
        if (!cancelled) {
          setRequest({
            slug: datasetSlug,
            status: entry ? 'ready' : 'not_found',
            observation: entry
              ? normalizeObservation(entry, catalog)
              : null,
          })
        }
      })
      .catch(() => {
        if (!cancelled) {
          setRequest({
            slug: datasetSlug,
            status: 'error',
            observation: null,
          })
        }
      })
    return () => {
      cancelled = true
    }
  }, [datasetSlug, retry])

  if (request.slug !== datasetSlug || request.status === 'loading') {
    return (
      <div className="observation-loading-record" role="status">
        <span aria-hidden="true" />
        <p>Loading DLP profile catalog…</p>
      </div>
    )
  }
  if (request.status === 'not_found') return <DataObservationNotFound />
  if (request.status === 'error') {
    return (
      <div className="observation-loading-record is-error" role="alert">
        <span aria-hidden="true" />
        <p>The observation catalog could not be loaded.</p><button type="button" onClick={() => setRetry((value) => value + 1)}>Retry catalog</button>
      </div>
    )
  }
  function switchObservation(slug) {
    const entry = request.observation.catalogEntries.find((item) => item.slug === slug)
    const example = getExample(entry.dataset_id)
    const next = new URLSearchParams(params)
    next.delete('record')
    next.delete('draft')
    next.delete('notice')
    next.set('version', example.webProductVersion)
    const from = Number(params.get('from'))
    const to = Number(params.get('to'))
    if (params.has('from') && params.has('to') && Number.isFinite(from) && Number.isFinite(to)) {
      const intersection = [Math.max(from, entry.radial_range.minimum), Math.min(to, entry.radial_range.maximum)]
      if (intersection[0] <= intersection[1]) {
        next.set('from', intersection[0]); next.set('to', intersection[1])
        if (intersection[0] !== from || intersection[1] !== to) next.set('notice', 'intersection')
      } else {
        next.set('from', example.range[0]); next.set('to', example.range[1]); next.set('notice', 'reset')
      }
    }
    navigate(`/data/${slug}?${next}`)
  }
  return <><div className="workbench-observation-select"><label>Observation<select aria-label="Observation" value={datasetSlug} onChange={(event) => switchObservation(event.target.value)}>{request.observation.catalogEntries.map((entry) => <option key={entry.slug} value={entry.slug}>{entry.display_name}</option>)}</select></label></div><ObservationPage key={datasetSlug} observation={request.observation} /></>
}
