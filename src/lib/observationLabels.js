export function formatRadiusShort(value, maximumFractionDigits = 2) {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits,
  }).format(value)
}

function profileCode(direction) {
  return direction === 'INGRESS' ? 'I' : 'E'
}

export function formatObservationPrimaryLabel(observation) {
  return (
    `Rev ${String(observation.revolution_number).padStart(3, '0')}`
    + `${profileCode(observation.ring_profile_direction)}`
    + ` · ${observation.band}-band · DSN ${observation.dsn_station_number}`
  )
}
