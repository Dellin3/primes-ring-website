import { project } from './project.js'

// One entry per MIT PRIMES cohort that works on the Saturn rings project.
// Add a new year by appending an entry; /research lists it and
// /research/<year> renders it with the shared cohort template. Only describe
// results that are traceable to input data, code and output (see
// docs/SITE_ARCHITECTURE.md); otherwise say what is pending.
//
// Fields:
//   year, title, team[], mentor, status   required
//   question, summary                     required, one or two sentences each
//   focus[]                               the main lines of work
//   data                                  what data the cohort used
//   results[]                             { text, source }  — leave empty until verified
//   materials[]                           { label, url }   — paper, code, slides
//   story                                 true only for a cohort with a custom page
export const primesCohorts = [
  {
    year: 2026,
    program: 'MIT PRIMES',
    title: project.title,
    team: project.authors,
    mentor: project.mentor,
    status: 'Working manuscript',
    question: 'How can we find the stationary points that matter, keep track of their branches, and know when the stationary-phase approximation needs more care — when reading Cassini’s radio signals from Saturn’s rings?',
    summary: 'The team connected Padé and least-squares starting points, continuation, refinement and branch bookkeeping to three reported result sets: local angular-integral accuracy, generic-fold verification and synthetic branch identity.',
    focus: ['Finding starting points: Padé approximation and adaptive least squares', 'Following branches: pseudo-arclength continuation', 'Branch identity, fold checks and a local reliability switch'],
    data: 'Six archived Cassini RSS diffraction-limited ring profiles, plus synthetic and scalar-model tests',
    results: [],
    materials: [],
    story: true,
  },
]

export const cohortPath = cohort => `/research/${cohort.year}`
export const findCohort = year => primesCohorts.find(cohort => String(cohort.year) === String(year))
export const latestCohort = () => [...primesCohorts].sort((a, b) => b.year - a.year)[0]
