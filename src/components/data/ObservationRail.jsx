import { useRef } from 'react'

import { formatObservationPrimaryLabel, formatRadiusShort } from '../../lib/observationLabels.js'
import '../../styles/profile-refinements.css'

export default function ObservationRail({
  observations,
  selectedDatasetId,
  onSelect,
}) {
  const buttonRefs = useRef([])
  const selectedIndex = observations.findIndex(
    (observation) => observation.dataset_id === selectedDatasetId,
  )

  function selectIndex(index) {
    const boundedIndex = Math.min(
      observations.length - 1,
      Math.max(0, index),
    )
    onSelect(observations[boundedIndex])
    requestAnimationFrame(() => buttonRefs.current[boundedIndex]?.focus())
  }

  function handleKeyDown(event, index) {
    let nextIndex = null
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
      nextIndex = index + 1
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
      nextIndex = index - 1
    } else if (event.key === 'Home') {
      nextIndex = 0
    } else if (event.key === 'End') {
      nextIndex = observations.length - 1
    }
    if (nextIndex === null) return
    event.preventDefault()
    selectIndex(nextIndex)
  }

  return (
    <aside className="observation-rail" aria-labelledby="observation-rail-title">
      <header>
        <p className="eyebrow">Cassini ring profiles</p>
        <h2 id="observation-rail-title">Observations</h2>
      </header>
      <div role="listbox" aria-label="Complete Cassini DLP observations">
        {observations.map((observation, index) => {
          const selected = index === selectedIndex
          return (
            <button
              key={observation.dataset_id}
              ref={(element) => {
                buttonRefs.current[index] = element
              }}
              type="button"
              role="option"
              aria-selected={selected}
              tabIndex={selected || selectedIndex < 0 && index === 0 ? 0 : -1}
              onClick={() => onSelect(observation)}
              onKeyDown={(event) => handleKeyDown(event, index)}
            >
              <span className="observation-rail-primary">
                {formatObservationPrimaryLabel(observation)}
              </span>
              <span className="observation-rail-secondary">
                <span>{observation.ring_observation_id.slice(4, 12).replace('_', ' · day ')}</span>
                <span className="observation-source-id">{observation.ring_observation_id}</span>
              </span>
              <span className="observation-rail-tertiary">
                <span className="observation-record-count">{observation.record_count.toLocaleString('en-US')} records</span>
                <span className="observation-range-group">
                  {formatRadiusShort(observation.radial_range.minimum)}
                  {'–'}
                  {formatRadiusShort(observation.radial_range.maximum)}{'\u00a0'}km
                </span>
              </span>
            </button>
          )
        })}
      </div>
    </aside>
  )
}
