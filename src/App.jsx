import { Navigate, Route, Routes } from 'react-router-dom'
import DataRouteShell from './components/layout/DataRouteShell.jsx'
import SiteLayout from './components/layout/SiteLayout.jsx'
import DataExplorerPage from './pages/DataExplorerPage.jsx'
import DatasetPage from './pages/DatasetPage.jsx'
import HomePage from './pages/HomePage.jsx'
import ExplorationsPage from './pages/ExplorationsPage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'
import ResearchModulePage from './pages/ResearchModulePage.jsx'
import ResearchPage from './pages/ResearchPage.jsx'
import ResourcesPage from './pages/ResourcesPage.jsx'

const researchRedirects = [ '/algorithms', '/overview', '/progress', '/team']
const dataRedirects = ['/viewer', '/data-hub']
const resourceRedirects = ['/background', '/gallery']

export default function App() {
  return (
    <Routes>
      <Route element={<SiteLayout />}>
        <Route index element={<HomePage />} />
        <Route path="research" element={<ResearchPage />} />
        <Route path="research/:moduleSlug" element={<ResearchModulePage />} />
        <Route element={<DataRouteShell />}>
          <Route path="data" element={<DataExplorerPage />} />
          <Route path="data/:datasetSlug" element={<DatasetPage />} />
        </Route>
        <Route path="explorations" element={<ExplorationsPage />} />
        <Route path="resources" element={<ResourcesPage />} />

        <Route path="/math" element={<Navigate to="/research/stationary-roots-and-continuation" replace />} />
        {researchRedirects.map((path) => (
          <Route key={path} path={path} element={<Navigate to="/research" replace />} />
        ))}
        <Route path="/algorithms/:slug" element={<Navigate to="/research" replace />} />
        {dataRedirects.map((path) => (
          <Route key={path} path={path} element={<Navigate to="/data" replace />} />
        ))}
        {resourceRedirects.map((path) => (
          <Route key={path} path={path} element={<Navigate to="/resources" replace />} />
        ))}

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
