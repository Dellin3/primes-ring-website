import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { siteRoutes } from '../../content/project.js'

const navigation = [
  { label: 'Research', to: siteRoutes.research },
  { label: 'Explore Data', to: siteRoutes.data },
  { label: 'My Explorations', to: siteRoutes.explorations },
  { label: 'Paper & Code', to: siteRoutes.resources },
]

export default function SiteHeader() {
  const { pathname } = useLocation()
  const isHome = pathname === siteRoutes.home
  const isDataRoute = (
    pathname === siteRoutes.data
    || pathname.startsWith(`${siteRoutes.data}/`)
  )
  const [heroVisible, setHeroVisible] = useState(true)

  useEffect(() => {
    if (!isHome) return undefined
    const hero = document.querySelector('.project-hero')
    if (!hero) return undefined

    if (!('IntersectionObserver' in window)) return undefined
    const observer = new IntersectionObserver(
      ([entry]) => setHeroVisible(entry.isIntersecting && entry.intersectionRatio > 0.08),
      { threshold: [0, 0.08, 0.2] },
    )
    observer.observe(hero)
    return () => observer.disconnect()
  }, [isHome])

  const overlayHero = isHome && heroVisible
  const surfaceClass = isDataRoute
    ? ' is-data-surface'
    : overlayHero
      ? ' is-hero-overlay'
      : ' is-paper-surface'

  return (
    <header className={`site-header${surfaceClass}`}>
      <div className="site-header-inner">
        <NavLink className="site-mark" to={siteRoutes.home} aria-label="Saturn Rings project home">
          <span aria-hidden="true">SR</span>
        </NavLink>
        <nav className="primary-nav" aria-label="Primary navigation">
          {navigation.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => (isActive ? 'is-active' : undefined)}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  )
}
