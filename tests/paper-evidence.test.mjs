import assert from 'node:assert/strict'
import test from 'node:test'
import { integralWork, localIntegralSamples, summarizeIntegralEvidence } from '../src/content/paperEvidence.js'

test('Table 3 maximum includes every positive offset, especially the retained-SPA worst case', () => {
  const summary = summarizeIntegralEvidence()
  assert.equal(summary.maximumSpaPercent, 59.5629)
  assert.equal(summary.maximumSwitchedPercent, 2.2872)
  assert.notEqual(summary.maximumSwitchedPercent, localIntegralSamples.at(-1).switchedPercent)
  assert.equal(localIntegralSamples.find(sample => sample.switchedPercent === summary.maximumSwitchedPercent).offsetKm, 0.3)
  assert.equal(summary.sampleCount, 8)
  assert.equal(summary.quadratureCount, 5)
})

test('hybrid work reduction refers to direct integrand samples, with retained SPA values unchanged', () => {
  const summary = summarizeIntegralEvidence()
  assert.equal(integralWork.hybridIntegrandSamples, summary.quadratureCount * integralWork.integrandSamplesPerQuadrature)
  assert.equal(integralWork.allQuadratureIntegrandSamples, summary.sampleCount * integralWork.integrandSamplesPerQuadrature)
  assert.equal(summary.fewerIntegrandSamplesPercent, 37.5)
  assert.equal(integralWork.hybridSaddleEvaluations, 2 * (summary.sampleCount - summary.quadratureCount))
  for (const sample of localIntegralSamples) {
    assert.ok(sample.offsetKm > 0 && sample.spaPercent > 0 && sample.switchedPercent > 0)
    if (sample.evaluator === 'SPA') assert.equal(sample.switchedPercent, sample.spaPercent)
  }
})
