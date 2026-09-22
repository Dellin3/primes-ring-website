export function isFiniteProfileSample(sample, key) {
  return Number.isFinite(sample?.ring_radius_km) && Number.isFinite(sample?.[key])
}

export function numericExtent(samples, key, paddingRatio = 0.08) {
  let minimum = Infinity
  let maximum = -Infinity
  for (const sample of samples) {
    if (!isFiniteProfileSample(sample, key)) continue
    minimum = Math.min(minimum, sample[key])
    maximum = Math.max(maximum, sample[key])
  }
  if (minimum > maximum) return null
  const padding = minimum === maximum
    ? Math.abs(minimum) * paddingRatio || 1
    : (maximum - minimum) * paddingRatio
  return [minimum - padding, maximum + padding]
}

export function displayUnit(unit) {
  if (unit === 'N/A') return 'dimensionless'
  if (unit === 'DEGREE') return 'degrees'
  if (unit === 'KILOMETER') return 'km'
  return unit || 'unit not documented'
}

// The fallback estimates spacing for drawing only. Prefer the documented
// sampling interval; neither case assigns a physical origin to a gap.
export function radialDisplayInterval(samples, documentedInterval) {
  if (Number.isFinite(documentedInterval) && documentedInterval !== 0) {
    return Math.abs(documentedInterval)
  }
  let interval = Infinity
  for (let n = 1; n < samples.length; n += 1) {
    const previous = samples[n - 1]
    const current = samples[n]
    if (!Number.isFinite(previous.ring_radius_km)
      || !Number.isFinite(current.ring_radius_km)
      || Math.abs(current.sample_index - previous.sample_index) !== 1) continue
    const spacing = Math.abs(current.ring_radius_km - previous.ring_radius_km)
    if (spacing > 0) interval = Math.min(interval, spacing)
  }
  return Number.isFinite(interval) ? interval : null
}

export function shouldBreakProfile(previous, current, dataMode, samplingInterval) {
  if (!previous) return true
  if (dataMode !== 'exact') return false
  if (!Number.isInteger(previous.sample_index) || !Number.isInteger(current.sample_index)
    || Math.abs(current.sample_index - previous.sample_index) !== 1) return true
  const radiusStep = Math.abs(current.ring_radius_km - previous.ring_radius_km)
  return radiusStep === 0 || (samplingInterval !== null && radiusStep > samplingInterval * 1.5)
}
