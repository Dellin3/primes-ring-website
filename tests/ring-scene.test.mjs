import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import { planetTable } from '../src/content/saturn.js'
import { findObservation, mapObservation, mapWindow, ringRegions } from '../src/content/rings.js'
import {
  CROSSING_RANGE_KM, FLATTENING, SATURN_EQUATORIAL_KM, SATURN_POLAR_KM, blockedFraction, cameraBasis, earthDirection,
  featureAnchor, featureLinks, hiddenByPlanet, kmToScene, nearestOverviewPoint, opacityProfile, presetViews, profileAt,
  projectOrthographic, regionAtRadius, sceneFeatures, sceneRings, signalGeometry, viewFor,
} from '../src/lib/ringScene.js'
import { overviewSamples } from '../src/lib/webObservation.js'

const root = new URL('../', import.meta.url)
const source = findObservation(mapObservation)
const overview = JSON.parse(await readFile(new URL(`public${source.base_path}/overview.json`, root)))
const km = text => Number(text.replace(/[^0-9.]/g, ''))
const close = (a, b, tolerance = 1e-9) => Math.abs(a - b) <= tolerance

test('the planet is drawn with the NSSDC radii the Planet page lists', () => {
  const table = Object.fromEntries(planetTable)
  assert.equal(SATURN_EQUATORIAL_KM, km(table['Equatorial radius (1 bar)']))
  assert.equal(SATURN_POLAR_KM, km(table['Polar radius']))
  assert.ok(close(FLATTENING, 54364 / 60268))
})

test('every ring in the scene uses the PDS ring table radii, to scale', () => {
  for (const ring of sceneRings) {
    const region = ringRegions.find(item => item.id === ring.id)
    assert.equal(ring, region, `${ring.id} comes straight from the ring table`)
    const anchor = featureAnchor(ring.id)
    assert.ok(close(Math.hypot(anchor[0], anchor[2]), kmToScene((region.inner + region.outer) / 2), 1e-12), `${ring.id} label sits at its middle radius`)
    assert.equal(anchor[1], 0, `${ring.id} label lies in the ring plane`)
  }
  assert.deepEqual(CROSSING_RANGE_KM, [ringRegions.find(r => r.id === 'c-ring').inner, ringRegions.find(r => r.id === 'f-ring').outer])
})

test('the signal crosses the ring plane at the chosen radius, with Cassini behind it as seen from Earth', () => {
  for (const radius of [74491, 100000, 119800, 133584, 140612]) {
    const { crossing, spacecraft, earthward } = signalGeometry(radius)
    assert.equal(crossing[1], 0, 'crossing lies in the ring plane')
    assert.ok(close(Math.hypot(crossing[0], crossing[2]) * SATURN_EQUATORIAL_KM, radius, 1e-6), 'distance from Saturn’s center is the ring radius')
    assert.ok(spacecraft[1] < 0 && earthward[1] > 0, 'Cassini and Earth sit on opposite sides of the ring plane')
    const toCrossing = crossing.map((value, i) => value - spacecraft[i])
    const length = Math.hypot(...toCrossing)
    toCrossing.forEach((value, i) => assert.ok(close(value / length, earthDirection[i], 1e-12), 'Cassini, the crossing and Earth are on one straight line'))
    assert.ok(Math.hypot(spacecraft[0], spacecraft[1] / FLATTENING, spacecraft[2]) > 1.05, 'Cassini is outside the planet')
  }
})

test('the crossing names the most specific ring feature from the ring table', () => {
  assert.equal(regionAtRadius(133584).id, 'encke-gap')
  assert.equal(regionAtRadius(119800).id, 'cassini-division')
  assert.equal(regionAtRadius(100000).id, 'b-ring')
  assert.equal(regionAtRadius(80000).id, 'c-ring')
  assert.equal(regionAtRadius(138000), null, 'between the A and F rings')
})

test('feature links open exact explorer windows inside the ring map observation', () => {
  for (const ring of sceneRings) {
    const [data] = featureLinks(ring.id)
    const window = mapWindow(ring)
    assert.ok(data.to.startsWith(`/data/${mapObservation}?`), `${ring.id} opens Rev 007`)
    const params = new URL(data.to, 'https://example.org').searchParams
    const [from, to] = [Number(params.get('from')), Number(params.get('to'))]
    assert.ok(from >= source.radial_range.minimum && to <= source.radial_range.maximum, `${ring.id} window lies inside Rev 007`)
    assert.ok(Math.abs(from - window[0]) <= 0.125 && Math.abs(to - window[1]) <= 0.125, `${ring.id} window matches the ring map`)
    assert.equal(params.get('version'), '1.1.0')
    assert.ok((to - from) / source.radial_range.sampling_interval < 32768 || ring.id === 'b-ring' || ring.id === 'c-ring' || ring.id === 'a-ring' || ring.id === 'cassini-division', `${ring.id}: gaps open as exact windows`)
  }
  for (const feature of sceneFeatures) assert.ok(featureLinks(feature.id).length > 0, `${feature.id} leads somewhere`)
})

test('ring brightness comes from the measured Rev 007 profile', () => {
  const profile = opacityProfile(overview)
  assert.equal(profile.length, overview.bucket_count, 'one value per overview bucket')
  for (let i = 1; i < profile.length; i++) assert.ok(profile[i][0] > profile[i - 1][0], 'radii increase')
  assert.ok(profile.every(([, tau]) => tau >= 0), 'negative optical depths count as clear')
  const mean = (from, to) => { const inside = profile.filter(([r]) => r >= from && r <= to); return inside.reduce((sum, [, tau]) => sum + tau, 0) / inside.length }
  // The display shading stays close to the exact-data medians the Rings page
  // quotes for Rev 007 (checked against the chunks in saturn-content.test).
  assert.ok(Math.abs(mean(118200, 121900) - 0.162) < 0.15, 'the Cassini Division is nearly clear')
  assert.ok(Math.abs(mean(100000, 104000) - 2.797) < 0.4, 'the B ring is dense')
  assert.ok(blockedFraction(mean(100000, 104000)) > 0.85 && blockedFraction(mean(118200, 121900)) < 0.3)
  assert.equal(profileAt(profile, 60000), null, 'no value invented inside the planet')
})

test('the readout reports a stored overview point exactly, never an interpolated one', () => {
  const rows = overviewSamples(overview)
  for (const radius of [74491, 95000, 119800, 133584, 140000]) {
    const point = nearestOverviewPoint(rows, radius)
    const stored = overview.points.find(p => p[0] === point.sample_index)
    assert.ok(stored, 'the point is one of the stored overview points')
    assert.equal(point.optical_depth, stored[overview.columns.indexOf('optical_depth')])
    assert.equal(point.ring_radius_km, stored[overview.columns.indexOf('ring_radius_km')])
    const better = rows.some(row => Math.abs(row.ring_radius_km - radius) < Math.abs(point.ring_radius_km - radius))
    assert.equal(better, false, 'it is the nearest one')
  }
})

test('views and projection are consistent', () => {
  for (const preset of presetViews) {
    const view = viewFor(preset.name)
    assert.ok([view.azimuth, view.elevation, view.distance, ...view.target].every(Number.isFinite), preset.name)
    const center = projectOrthographic(view.target, view, 100, [400, 300])
    assert.ok(close(center.x, 400) && close(center.y, 300), `${preset.name}: target at the center`)
  }
  const earth = viewFor('earth')
  cameraBasis(earth).toward.forEach((value, i) => assert.ok(close(value, earthDirection[i], 1e-12), 'Earth’s view looks back along the signal'))
  const above = viewFor('above')
  const toward = cameraBasis(above).toward
  assert.equal(hiddenByPlanet([0, -0.5, 0], toward), true, 'a point under the planet is hidden from above')
  assert.equal(hiddenByPlanet([2, 0, 0], toward), false, 'a ring point beside the planet is visible')
  assert.equal(hiddenByPlanet([0, 1.2, 0], toward), false, 'a point above the planet is visible')
})
