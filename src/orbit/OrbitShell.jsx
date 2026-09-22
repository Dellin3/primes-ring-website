import { useEffect, useRef } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { project } from '../content/project.js'

function About({ open, onClose }) {
  const ref = useRef(null)
  useEffect(() => {
    const dialog = ref.current
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])
  return <dialog className="about-dialog" ref={ref} aria-labelledby="about-title" onCancel={onClose} onClick={event => { if (event.target === ref.current) onClose() }}>
    <div className="about-content">
      <button className="dialog-close" type="button" onClick={onClose} aria-label="Close sources and credits">×</button>
      <p className="eyebrow">Sources & credits</p>
      <h2 id="about-title">Follow the source.</h2>
      <p>Cassini sent radio signals through Saturn’s rings toward Earth. Changes in those signals reveal structure across the rings.</p>
      <p>Explore six archived observations here, compare exact samples, and keep a record of what you notice.</p>
      <div className="about-project"><p className="eyebrow">{project.program}</p><h3>{project.title}</h3><p>{project.authors.join(' · ')}<br />Mentored by {project.mentor}</p></div>
      <details><summary>What am I looking at?</summary><p>These are Cassini RSS diffraction-limited ring profiles from NASA’s Planetary Data System. The three measured variables are normal optical depth, normalized signal power, and phase shift.</p><p>Wide views are reduced overviews. Narrow windows load the exact converted source records and verify their hashes. Optical depth is not a direct measure of ring mass; a pattern alone does not establish its physical cause. Missing and negative values are preserved.</p></details>
      <Link className="about-research-link" to="/research" onClick={onClose}>Explore the team’s project research <span aria-hidden="true">↗</span></Link>
      <div className="about-links"><a href={project.dataSourceUrl} target="_blank" rel="noreferrer">Original Cassini data <span>↗</span></a><a href={project.repositoryUrl} target="_blank" rel="noreferrer">Website source code <span>↗</span></a><a href={project.learningUrl} target="_blank" rel="noreferrer">New to research? Start here <span>↗</span></a></div>
      <p className="fine-print">Project research presents methods and reported results from the team’s working manuscript. The explorer displays archived observations; the method benchmarks are separate synthetic and scalar-model experiments. The full manuscript and scientific solver are not hosted here.</p>
      <p className="fine-print">Background: an artistic rendering of Saturn.</p>
    </div>
  </dialog>
}

export default function OrbitShell({ children }) {
  const location = useLocation()
  const navigate = useNavigate()
  const appRef = useRef(null)
  const params = new URLSearchParams(location.search)
  const open = params.has('about')
  function setAbout(value) {
    if (value) params.set('about', 'research'); else params.delete('about')
    navigate({ pathname: location.pathname, search: params.toString() }, { replace: true, preventScrollReset: true })
  }
  useEffect(() => { window.scrollTo(0, 0) }, [location.pathname])
  useEffect(() => {
    if (!window.matchMedia('(prefers-reduced-motion: no-preference) and (pointer: fine)').matches) return
    let frame = 0
    function drift(event) {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        appRef.current?.style.setProperty('--drift-x', `${(event.clientX / window.innerWidth - .5) * 12}px`)
        appRef.current?.style.setProperty('--drift-y', `${(event.clientY / window.innerHeight - .5) * 8}px`)
      })
    }
    window.addEventListener('pointermove', drift, { passive: true })
    return () => { cancelAnimationFrame(frame); window.removeEventListener('pointermove', drift) }
  }, [])
  return <div ref={appRef} className={`orbit-app ${location.pathname === '/' ? 'is-home' : 'is-workspace'}`}>
    <div className="space-backdrop" aria-hidden="true"><div className="saturn-image" /><div className="space-vignette" /><div className="ambient-light" /></div>
    <a href="#main-content" className="skip-link">Skip to content</a>
    <header className="orbit-header"><div className="header-inner">
      <Link className="orbit-brand" to="/" aria-label="Saturn explorer home"><span className="brand-symbol" aria-hidden="true">s</span><span>SATURN<small>A CASSINI EXPLORER</small></span></Link>
      <nav aria-label="Main navigation"><NavLink to="/data">Explore data</NavLink><NavLink to="/explorations">My notebook</NavLink><NavLink to="/research">Project research</NavLink><button className="about-trigger" aria-label="Sources and credits" type="button" onClick={() => setAbout(true)}>i</button></nav>
    </div></header>
    <main className="orbit-main" id="main-content" tabIndex={-1}>{children}</main>
    <footer className="orbit-footer"><span>MIT PRIMES 2026 <span className="footer-dot">·</span> Saturn’s rings</span><button type="button" onClick={() => setAbout(true)}>Sources & credits <span aria-hidden="true">↗</span></button><span className="footer-signoff">Built for curiosity.</span></footer>
    <About open={open} onClose={() => setAbout(false)} />
  </div>
}
