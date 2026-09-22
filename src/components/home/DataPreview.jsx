import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { Link } from 'react-router-dom'
import SectionHeading from '../common/SectionHeading.jsx'
import ScientificProfileCanvas from '../data/ScientificProfileCanvas.jsx'
import { getFeaturedObservation } from '../../content/observations.js'
import { siteRoutes } from '../../content/project.js'
import {
  loadObservationCatalog,
  loadObservationOverview,
  overviewSamples,
} from '../../lib/webObservation.js'

export default function DataPreview() {
  const sectionRef = useRef(null)
  const [request, setRequest] = useState({
    status: 'idle',
    catalog: null,
    observation: null,
    overview: null,
  })

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return undefined
    const beginLoading = () => setRequest((current) => (
      current.status === 'idle'
        ? { ...current, status: 'loading' }
        : current
    ))
    if (!('IntersectionObserver' in window)) {
      const frame = window.requestAnimationFrame(beginLoading)
      return () => window.cancelAnimationFrame(frame)
    }
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        beginLoading()
        observer.disconnect()
      }
    }, { rootMargin: '320px 0px' })
    observer.observe(section)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (request.status !== 'loading') return undefined
    let cancelled = false
    loadObservationCatalog()
      .then((catalog) => {
        const observation = getFeaturedObservation(catalog)
        return loadObservationOverview(observation)
          .then((overview) => {
            if (overview.dataset_id !== observation.dataset_id) {
              throw new Error('Featured observation overview mismatch')
            }
            return { catalog, observation, overview }
          })
      })
      .then(({ catalog, observation, overview }) => {
        if (!cancelled) {
          setRequest({
            status: 'loaded',
            catalog,
            observation,
            overview,
          })
        }
      })
      .catch(() => {
        if (!cancelled) {
          setRequest({
            status: 'error',
            catalog: null,
            observation: null,
            overview: null,
          })
        }
      })
    return () => {
      cancelled = true
    }
  }, [request.status])

  const samples = useMemo(
    () => (request.overview ? overviewSamples(request.overview) : []),
    [request.overview],
  )
  const variable = request.observation?.principal_variables.find(
    (item) => item.id === 'optical_depth',
  )

  return (
    <section
      ref={sectionRef}
      className="home-section data-preview"
      aria-labelledby="data-preview-title"
    >
      <div className="data-preview-inner">
        <div className="data-preview-copy">
          <SectionHeading
            eyebrow="Begin with a real observation"
            title="How does optical depth change across a ring profile?"
            id="data-preview-title"
            description="The horizontal axis is radial distance from Saturn’s center. Open a small region, compare two nearby positions, and record what the plot alone cannot tell you."
          />
          <p className="metadata-line">
            {request.status === 'idle'
              && 'Preview loads when this section approaches the viewport.'}
            {request.status === 'loading'
              && 'Loading the observation preview…'}
            {request.status === 'loaded'
              && `${request.catalog.observation_count} available observations · ${request.observation.display_name}`}
            {request.status === 'error'
              && 'Preview unavailable · the Data Observatory remains accessible.'}
          </p>
          <Link className="button button-secondary" to={siteRoutes.guided}>Open the example region →</Link>
          <p className="preview-reading-note">Normal optical depth is dimensionless; it describes attenuation, not mass density.</p>
        </div>
        <div className="data-chart-perspective">
          <div className="data-chart-plate">
            <div className="data-chart-header">
              <span>Normal optical depth</span>
              <strong>
                {request.observation
                  ? `${request.observation.ring_observation_id} · DSN ${request.observation.dsn_station_number}`
                  : 'Cassini ring observation'}
              </strong>
            </div>
            {request.status === 'loaded' && variable && (
              <ScientificProfileCanvas
                samples={samples}
                variable={variable}
                inspectedSample={null}
                onInspect={() => {}}
                dataMode="overview"
                scopeLabel="Example observation"
                statusMessage=""
              />
            )}
            {request.status === 'loading' && (
              <p className="data-preview-status" role="status">
                Loading the profile overview…
              </p>
            )}
            {request.status === 'idle' && (
              <p className="data-preview-status">
                Source-sample overview ready to load near the viewport.
              </p>
            )}
            {request.status === 'error' && (
              <div className="data-preview-status is-error" role="alert">
                <p>The profile preview could not load.</p>
                <button type="button" className="button button-secondary" onClick={() => setRequest((current) => ({ ...current, status: 'loading' }))}>Retry preview</button>
              </div>
            )}
            <p className="preview-source-note">Calibrated Diffraction-Limited Profile (DLP), before removal of diffraction effects. DSN identifies the Deep Space Network receiving station. This reduced overview is for orientation; the workbench loads exact converted samples.</p>
          </div>
        </div>
      </div>
    </section>
  )
}
