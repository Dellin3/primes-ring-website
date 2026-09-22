export const datasetColumns = [
  'ring_radius_km',
  'pole_correction_km',
  'timing_correction_km',
  'ring_longitude_deg',
  'observed_ring_azimuth_deg',
  'normalized_signal_power',
  'normal_optical_depth',
  'phase_shift_deg',
  'normal_optical_depth_threshold',
  'observed_event_time_s',
  'ring_event_time_s',
  'spacecraft_event_time_s',
  'observed_ring_elevation_deg',
]

export const legacyResearchWindowRegistry = {
  status: 'LEGACY RESEARCH-WINDOW SUBSETS',
  mapping_status: 'PARENT OBSERVATION MAPPING INCOMPLETE',
  exposure_rule:
    'Archived outside public production assets. Do not list a subset as a complete observation; publish only after its parent product, exact radial range, and research-module relationship are verified.',
  subsets: [
    {
      slug: 'rev007e-k34',
      id: 'rev007e_k34',
      event: 'Rev007E · K34',
      revolution: 'Rev007E',
      band: 'K34',
      productId: 'RSS_2005_123_K34_E',
      product: 'TAU_10KM',
      archiveName: 'cassini_rev007e_k34.csv',
      radialRange: [74495, 74620],
    },
    {
      slug: 'rev010e-k25',
      id: 'rev010e_k25',
      event: 'Rev010E · K25',
      revolution: 'Rev010E',
      band: 'K25',
      productId: 'RSS_2005_177_K25_E',
      product: 'TAU_10KM',
      archiveName: 'cassini_rev010e_k25.csv',
      radialRange: [72012.5, 72145],
    },
    {
      slug: 'rev054ce-k55',
      id: 'rev054ce_k55',
      event: 'Rev054CE · K55',
      revolution: 'Rev054CE',
      band: 'K55',
      productId: 'RSS_2007_353_K55_E',
      product: 'TAU_10KM',
      archiveName: 'cassini_rev054ce_k55.csv',
      radialRange: [88655, 88715],
    },
    {
      slug: 'rev089ce-k34',
      id: 'rev089ce_k34',
      event: 'Rev089CE · K34',
      revolution: 'Rev089CE',
      band: 'K34',
      productId: 'RSS_2008_291_K34_E',
      product: 'TAU_10KM',
      archiveName: 'cassini_rev089ce_k34.csv',
      radialRange: [104812.5, 104947.5],
    },
    {
      slug: 'rev133e-x34',
      id: 'rev133e_x34',
      event: 'Rev133E · X34',
      revolution: 'Rev133E',
      band: 'X34',
      productId: 'RSS_2010_170_X34_E',
      product: 'TAU_10KM',
      archiveName: 'cassini_rev133e_x34.csv',
      radialRange: [72012.5, 72097.5],
      note: 'Distinct from the complete Rev133 X43 DSN 43 DLP profile product.',
    },
  ],
}

export const datasets = legacyResearchWindowRegistry.subsets

export const featuredDataset = null

export function getDataset(datasetSlug) {
  return datasets.find((dataset) => dataset.slug === datasetSlug)
}

export function formatRadius(value) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(value)
}

export function formatRadialRange([minimum, maximum]) {
  return `${formatRadius(minimum)}–${formatRadius(maximum)} km`
}
