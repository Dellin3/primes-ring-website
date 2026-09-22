export const observationCatalogPath = '/data/observations/catalog.json'

export function getCatalogObservation(catalog, observationSlug) {
  return catalog.observations.find(
    (observation) => observation.slug === observationSlug,
  )
}

export function getFeaturedObservation(catalog) {
  return catalog.observations.find(
    (observation) => (
      observation.dataset_id === catalog.featured_dataset_id
    ),
  ) ?? catalog.observations[0]
}
