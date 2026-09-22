import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import SiteFooter from './SiteFooter.jsx'
import SiteHeader from './SiteHeader.jsx'

export default function SiteLayout() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (hash) {
      requestAnimationFrame(() => {
        document.getElementById(hash.slice(1))?.scrollIntoView({ block: 'start' })
      })
      return
    }
    window.scrollTo({ top: 0, left: 0 })
  }, [pathname, hash])

  return (
    <div className="site-frame">
      <a className="skip-link" href="#main-content" onClick={() => document.getElementById('main-content')?.focus({ preventScroll: true })}>Skip to main content</a>
      <SiteHeader />
      <main id="main-content" tabIndex={-1}>
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  )
}
