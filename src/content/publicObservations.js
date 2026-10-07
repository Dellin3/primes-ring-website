import catalog from '../../public/data/observations/catalog.json'

// The build and browser use the same verified public catalog; never notebook data.
export const publishedCatalog = catalog
export const publicObservations = catalog.observations
export const pdsCollectionUrl = 'https://pds.nasa.gov/ds-view/pds/viewProfile.jsp?dsid=CO-SR-RSS-4%2F5-OCC-V2.0'
export const observationDetailsPath = observation => `/datasets/${observation.slug}`
export const findPublicObservation = slug => publicObservations.find(observation => observation.slug === slug)

export function publicDatasetSchema(observation, origin) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    '@id': `${origin}${observationDetailsPath(observation)}#dataset`,
    name: `Cassini RSS ${observation.display_name} — DLP 500 m web derivative`,
    description: `${observation.record_count.toLocaleString('en-US')} converted source records from ${observation.product_id}. Four Float64 fields preserve ring radius, normal optical depth, normalized signal power and stored phase. This derivative retains diffraction effects and is not a new high-resolution reconstruction.`,
    url: `${origin}${observationDetailsPath(observation)}`,
    identifier: observation.dataset_id,
    isBasedOn: { '@type': 'Dataset', name: observation.product_id, url: pdsCollectionUrl, identifier: observation.ring_observation_id },
    isAccessibleForFree: true,
    variableMeasured: [
      { '@type': 'PropertyValue', name: 'Ring radius', unitText: 'km' },
      ...observation.principal_variables.map(variable => ({ '@type': 'PropertyValue', name: variable.label, unitText: variable.unit === 'N/A' ? 'dimensionless' : 'degree' })),
    ],
    distribution: {
      '@type': 'DataDownload',
      name: 'Display-only reduced source-sample overview',
      description: 'Reduced samples for display; use the explorer for exact windows and CSV export.',
      contentUrl: `${origin}${observation.overview_url}`,
      encodingFormat: 'application/json',
    },
  }
}
