import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import '../../styles/data.css'

const DATA_THEME_CLASS = 'is-data-route'

export default function DataRouteShell() {
  useEffect(() => {
    document.documentElement.classList.add(DATA_THEME_CLASS)
    return () => {
      document.documentElement.classList.remove(DATA_THEME_CLASS)
    }
  }, [])

  return (
    <div className="data-route-shell">
      <Outlet />
    </div>
  )
}
