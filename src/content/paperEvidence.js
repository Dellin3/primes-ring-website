// Transcribed from the supplied PRIMES master manuscript, §§4–6, pp. 17–20.
// Table 3 and its discussion govern the maximum: 2.2872%, not the last row's
// 0.0242% incorrectly called the maximum in the manuscript conclusion.
export const localIntegralSamples = [
  { offsetKm: 0.001, spaPercent: 59.5629, switchedPercent: 2.01e-10, evaluator: 'Simpson' },
  { offsetKm: 0.003, spaPercent: 49.6822, switchedPercent: 2.17e-10, evaluator: 'Simpson' },
  { offsetKm: 0.01, spaPercent: 36.5413, switchedPercent: 2.01e-10, evaluator: 'Simpson' },
  { offsetKm: 0.03, spaPercent: 22.1027, switchedPercent: 8.67e-11, evaluator: 'Simpson' },
  { offsetKm: 0.1, spaPercent: 6.2333, switchedPercent: 8e-11, evaluator: 'Simpson' },
  { offsetKm: 0.3, spaPercent: 2.2872, switchedPercent: 2.2872, evaluator: 'SPA' },
  { offsetKm: 1, spaPercent: 0.2756, switchedPercent: 0.2756, evaluator: 'SPA' },
  { offsetKm: 3, spaPercent: 0.0242, switchedPercent: 0.0242, evaluator: 'SPA' },
]

export const integralWork = {
  integrandSamplesPerQuadrature: 16385,
  hybridIntegrandSamples: 81925,
  hybridSaddleEvaluations: 6,
  allQuadratureIntegrandSamples: 131080,
}

export function summarizeIntegralEvidence(samples = localIntegralSamples) {
  return {
    maximumSpaPercent: Math.max(...samples.map(sample => sample.spaPercent)),
    maximumSwitchedPercent: Math.max(...samples.map(sample => sample.switchedPercent)),
    quadratureCount: samples.filter(sample => sample.evaluator === 'Simpson').length,
    sampleCount: samples.length,
    fewerIntegrandSamplesPercent: 100 * (1 - integralWork.hybridIntegrandSamples / integralWork.allQuadratureIntegrandSamples),
  }
}

export const scalarFold = {
  radiusKm: '121069.150400',
  angleDegrees: '93.063921',
  phaseAngularDerivative: '8.10e-15',
  phaseSecondAngularDerivative: '−8.10e-15',
  phaseThirdAngularDerivative: '13365.068710',
  phaseMixedDerivative: '−0.038669290',
  predictedSlope: 0.07598542,
  measuredSlope: 0.07598439,
  // Reported manuscript value; the displayed slopes are rounded.
  relativeSlopeDifferencePercent: '0.001345',
  referenceRadiusKm: '121999.437351',
  distanceKm: '149390.501073',
  openingAngleDegrees: '1.886554',
  referenceAzimuthDegrees: '80.770609',
  wavelengthKm: '3.557429207e-5',
}

export const branchCases = [
  { name: 'Ordinary motion', independent: 'Passed', assignment: 'Passed', predicted: 'Passed' },
  { name: 'Periodic seam', independent: 'Passed', assignment: 'Passed', predicted: 'Passed' },
  { name: 'Isolated appearance / disappearance', independent: 'Passed', assignment: 'Passed', predicted: 'Passed' },
  { name: 'Close parallel tracks', independent: '9 wrong links; 9 false flags', assignment: '0 wrong links; 0 false flags', predicted: '0 wrong links; 0 false flags' },
  { name: 'Motion beyond the gate', independent: '3 identities lost', assignment: '3 identities lost', predicted: '3 identities lost' },
]
