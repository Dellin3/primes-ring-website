import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import OrbitShell from './orbit/OrbitShell.jsx'
import Home from './orbit/Home.jsx'
import Feedback from './orbit/Feedback.jsx'
import ObservationDetails, { DatasetCatalogPage } from './orbit/ObservationDetails.jsx'
import PageMeta from './components/common/PageMeta.jsx'
const Explorer = lazy(() => import('./orbit/Explorer.jsx'))
const Notebook = lazy(() => import('./orbit/Notebook.jsx'))
const Research = lazy(() => import('./orbit/Research.jsx'))
export default function App({ pages }) {
  const ExplorerPage = pages?.Explorer || Explorer
  const NotebookPage = pages?.Notebook || Notebook
  const ResearchPage = pages?.Research || Research
  return <OrbitShell><Suspense fallback={<div className="loading-state glass-panel" role="status">Opening your workspace…</div>}><Routes>
    <Route index element={<Home />} />
    <Route path="data" element={<ExplorerPage />} />
    <Route path="data/:datasetSlug" element={<ExplorerPage />} />
    <Route path="datasets" element={<DatasetCatalogPage />} />
    <Route path="datasets/:datasetSlug" element={<ObservationDetails />} />
    <Route path="explorations" element={<NotebookPage />} />
    <Route path="research" element={<ResearchPage />} />
    <Route path="feedback" element={<Feedback />} />
    {['research/*', 'math', 'algorithms/*', 'overview', 'team'].map(path => <Route key={path} path={path} element={<Navigate to="/research" replace />} />)}
    {['resources', 'background', 'gallery'].map(path => <Route key={path} path={path} element={<Navigate to="/?about=sources" replace />} />)}
    {['viewer', 'data-hub'].map(path => <Route key={path} path={path} element={<Navigate to="/data" replace />} />)}
    <Route path="progress" element={<Navigate to="/explorations" replace />} />
    <Route path="*" element={<div className="not-found glass-panel"><PageMeta title="Page not found" path="/404" noindex /><p className="eyebrow">Outside our orbit</p><h1>Let’s find your way back.</h1><p>This page doesn’t exist. Your saved observations are still in your notebook.</p><a className="button button-primary" href="/data">Explore the data →</a></div>} />
  </Routes></Suspense></OrbitShell>
}
