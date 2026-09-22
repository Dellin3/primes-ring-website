import PageMeta from '../components/common/PageMeta.jsx'
import ObservationExperience from '../components/data/ObservationExperience.jsx'

export default function ObservationPage({ observation }) {
  return (
    <>
      <PageMeta
        title={`${observation.displayName} Observation`}
        description={`Progressively loaded Cassini RSS DLP profile with exact converted-sample inspection for ${observation.ringObservationId}.`}
        path={`/data/${observation.slug}`}
      />
      <ObservationExperience observation={observation} />
    </>
  )
}
