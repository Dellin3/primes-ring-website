import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import OrbitShell from './orbit/OrbitShell.jsx'
import Home from './orbit/Home.jsx'
import Feedback from './orbit/Feedback.jsx'
import ObservationDetails, { DatasetCatalogPage } from './orbit/ObservationDetails.jsx'
import PageMeta from './components/common/PageMeta.jsx'
const Explorer = lazy(() => import('./orbit/Explorer.jsx'))
const Notebook = lazy(() => import('./orbit/Notebook.jsx'))
const Planet = lazy(() => import('./orbit/Planet.jsx'))
const Rings = lazy(() => import('./orbit/Rings.jsx'))
const Moons = lazy(() => import('./orbit/Moons.jsx'))
const Missions = lazy(() => import('./orbit/Missions.jsx'))

export default function App({ pages }) {
  const ExplorerPage = pages?.Explorer || Explorer
  const NotebookPage = pages?.Notebook || Notebook
  const PlanetPage = pages?.Planet || Planet
  const RingsPage = pages?.Rings || Rings
  const MoonsPage = pages?.Moons || Moons
  const MissionsPage = pages?.Missions || Missions
  return <OrbitShell><Suspense fallback={<div className="loading-state glass-panel" role="status">Opening your workspace…</div>}><Routes>
    <Route index element={<Home />} />
    <Route path="planet" element={<PlanetPage />} />
    <Route path="rings" element={<RingsPage />} />
    <Route path="moons" element={<MoonsPage />} />
    <Route path="missions" element={<MissionsPage />} />
    <Route path="data" element={<ExplorerPage />} />
    <Route path="data/:datasetSlug" element={<ExplorerPage />} />
    <Route path="datasets" element={<DatasetCatalogPage />} />
    <Route path="datasets/:datasetSlug" element={<ObservationDetails />} />
    <Route path="explorations" element={<NotebookPage />} />
    <Route path="feedback" element={<Feedback />} />
    {['research', 'research/*', 'math', 'algorithms/*', 'overview'].map(path => <Route key={path} path={path} element={<Navigate to="/rings" replace />} />)}
    <Route path="team" element={<Navigate to="/" replace />} />
    {['resources', 'background', 'gallery'].map(path => <Route key={path} path={path} element={<Navigate to="/?about=sources" replace />} />)}
    {['viewer', 'data-hub'].map(path => <Route key={path} path={path} element={<Navigate to="/data" replace />} />)}
    <Route path="progress" element={<Navigate to="/explorations" replace />} />
    <Route path="*" element={<div className="not-found glass-panel"><PageMeta title="Page not found" path="/404" noindex /><p className="eyebrow">Outside our orbit</p><h1>Let’s find your way back.</h1><p>This page doesn’t exist. Your saved observations are still in your notebook.</p><a className="button button-primary" href="/">Return to Saturn →</a></div>} />
  </Routes></Suspense></OrbitShell>
}
