import { Link, useParams } from 'react-router-dom'
import PageMeta from '../components/common/PageMeta.jsx'
import { project } from '../content/project.js'
import { getExample } from '../content/explorationExamples.js'
import { findPublicObservation, observationDetailsPath, pdsCollectionUrl, publicDatasetSchema, publicObservations } from '../content/publicObservations.js'
import './ObservationDetails.css'

const number = value => new Intl.NumberFormat('en-US', { maximumFractionDigits: 6 }).format(value)

export function ObservationCatalog({ heading = 'Six Cassini RSS observations', page = false }) {
  const Heading = page ? 'h1' : 'h2'
  const count = publicObservations.reduce((total, observation) => total + observation.record_count, 0)
  return <section className="observation-reference glass-panel" aria-labelledby="observation-catalog-title">
    <p className="eyebrow">Public data & provenance</p><Heading id="observation-catalog-title">{heading}</Heading>
    <p>Inspect {number(count)} converted source records from six NASA PDS Cassini Radio Science Subsystem diffraction-limited profiles. Read the product details, then open a radial window in the explorer.</p>
    <div className="observation-table-scroll" tabIndex={0} role="region" aria-label="Cassini observation catalog, horizontally scrollable"><table><caption>Complete archived profile products in this website</caption><thead><tr><th scope="col">Observation</th><th scope="col">Source records</th><th scope="col">Ring radius (km)</th></tr></thead><tbody>{publicObservations.map(observation => <tr key={observation.dataset_id}><th scope="row"><Link to={observationDetailsPath(observation)}>{observation.display_name}</Link><small>{observation.product_id}</small></th><td>{number(observation.record_count)}</td><td>{number(observation.radial_range.minimum)}–{number(observation.radial_range.maximum)}</td></tr>)}</tbody></table></div>
    <p>Optical depth and normalized signal power are dimensionless; phase shift is in degrees. Ring radius is measured from Saturn’s center. The 0.25 km sample spacing is not a claim about reconstructed resolution.</p>
    <p>Wide views are display reductions. Narrow windows use exact converted Float64 samples with SHA-256 verification. Missing and negative values are preserved; phase is not unwrapped. These archived profiles retain diffraction effects and are separate from the team’s synthetic and scalar-model benchmarks.</p>
    <p><a href={pdsCollectionUrl} target="_blank" rel="noreferrer">Original NASA PDS collection ↗</a> · <Link to="/research">Read the research and its limits</Link></p>
  </section>
}

export function DatasetCatalogPage() {
  return <><PageMeta title="Cassini RSS observation catalog" path="/datasets" description="Compare six archived Cassini RSS diffraction-limited ring profiles, their source products, record counts, variables, and exact-sample explorer links." /><ObservationCatalog page /></>
}

export default function ObservationDetails() {
  const { datasetSlug } = useParams()
  const observation = findPublicObservation(datasetSlug)
  if (!observation) return <><PageMeta title="Observation not found" path="/404" noindex /><section className="observation-reference glass-panel"><h1>Observation not found.</h1><Link to="/datasets">Choose an archived observation</Link></section></>
  const example = getExample(observation.dataset_id)
  const params = example ? new URLSearchParams({ variable: example.variableId, from: String(example.range[0]), to: String(example.range[1]), version: example.webProductVersion }) : null
  const explorer = `/data/${observation.slug}`
  return <article className="observation-reference glass-panel">
    <PageMeta title={`${observation.display_name} — Cassini RSS dataset`} path={observationDetailsPath(observation)} description={`${number(observation.record_count)} source records from ${observation.product_id}. Inspect ring radius, optical depth, normalized signal power and stored phase; read provenance and limits.`} structuredData={publicDatasetSchema(observation, project.publicSiteUrl)} />
    <p className="eyebrow">Cassini RSS / archived profile</p><h1>{observation.display_name}</h1>
    <p>This public web derivative comes from the PDS3 product <strong>{observation.product_id}</strong> in collection <strong>CO-SR-RSS-4/5-OCC-V2.0</strong>. It provides exact converted records for browser inspection; it is not the original PDS ASCII table or a new reconstruction.</p>
    <dl className="observation-facts"><div><dt>Source records</dt><dd>{number(observation.record_count)}</dd></div><div><dt>Ring radius</dt><dd>{number(observation.radial_range.minimum)}–{number(observation.radial_range.maximum)} km</dd></div><div><dt>Sampling interval</dt><dd>{number(observation.radial_range.sampling_interval)} km</dd></div><div><dt>Profile direction</dt><dd>{observation.ring_profile_direction.toLowerCase()}</dd></div></dl>
    <div className="observation-actions"><Link className="button button-primary" to={params ? `${explorer}?${params}` : explorer}>Inspect an exact example →</Link><Link className="button button-secondary" to={explorer}>Open the observation</Link></div>
    <h2>Fields and units</h2><p>The derivative stores four Float64 fields in source-record order. Exact CSV exports also include the original zero-based sample index.</p>
    <dl className="observation-fields"><div><dt>Ring radius · km</dt><dd>Distance from Saturn’s center to the ring-plane intercept point.</dd></div>{observation.principal_variables.map(variable => <div key={variable.id}><dt>{variable.label} · {variable.unit === 'N/A' ? 'dimensionless' : 'degrees'}</dt><dd>{variable.description}</dd></div>)}</dl>
    <h2>Provenance and verification</h2><p>The catalog reports successful source conversion and web-data verification for this product. It contains {number(observation.web_data.chunk_count)} exact binary chunks; the browser checks SHA-256 hashes before displaying exact samples. This verifies the web derivative’s conversion and integrity, not a physical interpretation.</p>
    <ul><li><a href={pdsCollectionUrl} target="_blank" rel="noreferrer">NASA PDS collection record and source documentation ↗</a></li><li><a href={project.dataSourceUrl} target="_blank" rel="noreferrer">Cassini RSS archive overview ↗</a></li><li><a href={observation.metadata_url}>Product metadata and provenance (JSON)</a></li><li><a href={observation.index_url}>Exact binary chunk manifest and hashes (JSON)</a></li><li><a href={observation.overview_url}>Display-only reduced overview (JSON)</a></li></ul>
    <h2>What the data establish</h2><p>These calibrated diffraction-limited profiles retain diffraction effects. The DLP 500 m product name and the 0.25 km radial sample spacing do not establish a new reconstruction resolution. Optical depth is not mass density; stored phase is not unwrapped and continuity is not inferred. Missing and negative measurements are preserved. No per-sample quality flag is included in this four-field derivative.</p>
    <p>Use the explorer to choose inclusive radial boundaries, inspect exact samples, and export CSV for an eligible window. Research notes remain in your current browser. The six archived observations are separate from the synthetic and scalar-model experiments summarized on the research page.</p>
    <p><Link to="/datasets">All six observation products</Link> · <Link to="/research">Research methods and evidence</Link></p>
  </article>
}
