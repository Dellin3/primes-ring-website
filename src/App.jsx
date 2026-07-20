import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import './App.css'

const SaturnModel = lazy(() => import('./components/SaturnModel.jsx'))

const SITE_URL = 'https://primes-ring-website-p9yv.vercel.app'
const SOCIAL_IMAGE_URL = `${SITE_URL}/images/saturn-rings-hero.jpg`

const PANEL_ROUTES = {
  menu: '/',
  'start-here': '/start-here',
  'how-to-start-research': '/research-guide',
  'data-hub': '/data-hub',
  math: '/math',
  data: '/viewer',
  worksheet: '/worksheet',
  impact: '/impact',
  overview: '/overview',
  background: '/background',
  team: '/team',
  algorithms: '/algorithms',
  gallery: '/gallery',
  progress: '/progress',
}

const ROUTE_PANELS = Object.fromEntries(
  Object.entries(PANEL_ROUTES).map(([panel, path]) => [path, panel]),
)

const RELATED_PAGES = {
  'start-here': { to: '/background', label: 'Next step: Mission Background' },
  'how-to-start-research': { to: '/data-hub', label: 'Next step: Explore the Data Hub' },
  'data-hub': { to: '/viewer', label: 'Next step: Open the Data Viewer' },
  math: { to: '/viewer', label: 'Related tool: Cassini Data Viewer' },
  data: { to: '/worksheet', label: 'Next step: Student Worksheet' },
  worksheet: { to: '/math', label: 'Related page: Mathematical Framework' },
  impact: { to: '/start-here', label: 'Next step: Start the Learning Path' },
  overview: { to: '/background', label: 'Next step: Mission Background' },
  background: { to: '/data-hub', label: 'Next step: Cassini Data Hub' },
  team: { to: '/algorithms', label: 'Related page: Algorithm Modules' },
  algorithms: { to: '/math', label: 'Related page: Mathematical Framework' },
  gallery: { to: '/background', label: 'Related page: Mission Background' },
  progress: { to: '/impact', label: 'Related page: Educational Goals' },
}

const DEFAULT_DESCRIPTION =
  'Explore real Cassini RSS Saturn-ring occultation data, applied mathematics, optical-depth profiles, branch diagrams, interactive tools, and a guided student research pathway.'

const ROUTE_SEO = {
  '/': {
    title: 'Saturn Rings Reconstruction Lab | Cassini Data and Applied Mathematics',
    description: DEFAULT_DESCRIPTION,
  },
  '/start-here': {
    title: 'Start Here | Saturn Rings Reconstruction Lab',
    description:
      'Begin a guided student pathway through Cassini radio occultation, Saturn ring data, inverse problems, and applied mathematics.',
  },
  '/research-guide': {
    title: 'How to Start Research | Saturn Rings Reconstruction Lab',
    description:
      'Learn how to turn scientific curiosity into a research question, find reliable sources, and verify an AI-assisted literature workflow.',
  },
  '/data-hub': {
    title: 'Cassini Saturn Ring Data Hub | NASA PDS Resources',
    description:
      'Find public NASA Planetary Data System resources for Cassini Saturn-ring occultations and connect official archives to educational data samples.',
  },
  '/math': {
    title: 'Saturn Ring Reconstruction Mathematics | Stationary Phase and Branches',
    description:
      'Explore inverse problems, stationary phase, caustic regions, root finding, and branch structure in Saturn-ring reconstruction mathematics.',
  },
  '/viewer': {
    title: 'Cassini RSS Data Viewer | Saturn Ring Optical-Depth Profiles',
    description:
      'Interactively explore public Cassini RSS radio-occultation profiles, compare local radial windows, inspect optical-depth statistics and residuals, and export selected data.',
  },
  '/worksheet': {
    title: 'Student Saturn Rings Research Worksheet',
    description:
      'Use a guided student worksheet to observe, measure, interpret, and model public Cassini Saturn-ring radio-occultation data.',
  },
  '/impact': {
    title: 'Project Overview and Educational Goals | Saturn Rings Lab',
    description:
      'Review the educational goals, intended student audience, and public-learning purpose of the Saturn Rings Reconstruction Lab.',
  },
  '/overview': {
    title: 'Saturn Rings Lab Project Overview',
    description: 'Read an overview of this educational Saturn-ring reconstruction research portal.',
  },
  '/background': {
    title: 'Cassini Radio Occultation Mission Background | Saturn Rings Lab',
    description: 'Learn how Cassini radio occultation measurements reveal structure in Saturn’s rings.',
  },
  '/team': {
    title: 'Project Team | Saturn Rings Reconstruction Lab',
    description: 'Explore the project roles and mathematical research topics represented in the lab.',
  },
  '/algorithms': {
    title: 'Reconstruction Algorithm Modules | Saturn Rings Lab',
    description: 'Explore numerical methods and algorithm modules used in Saturn-ring reconstruction experiments.',
  },
  '/gallery': {
    title: 'Saturn Rings Visual Gallery | Cassini Mission Context',
    description: 'View credited Cassini mission imagery and educational diagrams used throughout the lab.',
  },
  '/progress': {
    title: 'Project Progress | Saturn Rings Reconstruction Lab',
    description: 'Review completed work and next steps for the educational Saturn rings research lab.',
  },
}

const FIGURE_SOURCES = {
  cassiniImagery:
    'Source: NASA/JPL-Caltech/Space Science Institute. Cassini mission imagery. Cropped for layout.',
  radioOccultation: 'Source: NASA/JPL-Caltech. Radio occultation explanatory figure.',
  scientificViz: 'Source: NASA/JPL-Caltech. Cassini-derived scientific visualization.',
  schematic: 'Source: Author-generated schematic for this learning module.',
  csv:
    'Source: NASA Planetary Data System, PDS Ring-Moon Systems Node, CORSS_8001 Cassini RSS ring occultation profiles. Converted from public PDS TAB products into local CSV files for educational visualization.',
}

const VIEWER_EDUCATIONAL_NOTE =
  'CSV files used on this site are educational local copies derived from public Cassini RSS occultation products. Unpublished PRIMES project data is not displayed.'

const homeModuleCards = [
  {
    id: 'start-here',
    title: 'Start Here',
    description: 'Begin with the learning path for this Saturn-rings research case study.',
    category: 'learning',
    categoryLabel: 'Learning',
  },
  {
    id: 'how-to-start-research',
    title: 'How to Start Research',
    description:
      'Turn curiosity into a research question, with an AI-assisted workflow for reading and verification.',
    category: 'learning',
    categoryLabel: 'Learning',
  },
  {
    id: 'data-hub',
    title: 'Data Hub',
    description: 'Find official NASA/PDS sources for Cassini occultation datasets.',
    category: 'data',
    categoryLabel: 'Data & Archives',
  },
  {
    id: 'worksheet',
    title: 'Student Worksheet',
    description: 'Practice explaining occultation, inverse problems, and local diagnostics.',
    category: 'learning',
    categoryLabel: 'Learning',
  },
  {
    id: 'impact',
    title: 'Impact & Feedback',
    description: 'Public learning goals, evaluation metrics, and student feedback.',
    category: 'impact',
    categoryLabel: 'Impact',
  },
  {
    id: 'overview',
    title: 'Project Overview',
    description: 'See how this MIT PRIMES project is organized as a research portal.',
    category: 'research',
    categoryLabel: 'Research',
  },
  {
    id: 'background',
    title: 'Mission Background',
    description: 'Learn how Cassini radio occultation probes Saturn’s ring structure.',
    category: 'research',
    categoryLabel: 'Research',
  },
  {
    id: 'math',
    title: 'Mathematical Framework',
    description: 'Explore stationary phase, branch structure, and reconstruction ideas.',
    category: 'research',
    categoryLabel: 'Research',
  },
  {
    id: 'data',
    title: 'Real Data Viewer',
    description: 'Inspect a local Cassini radial window, compute statistics, and export CSV.',
    category: 'data',
    categoryLabel: 'Data & Tools',
  },
]

const secondaryModuleLinks = [
  { id: 'team', title: 'Team Members' },
  { id: 'algorithms', title: 'Algorithm Modules' },
  { id: 'gallery', title: 'Visual Gallery' },
  { id: 'progress', title: 'Progress & Next Steps' },
]

const homePipelineSteps = [
  { label: 'Physical Observation', tone: 'navy' },
  { label: 'Public Cassini Data', tone: 'blue' },
  { label: 'Local Data Viewer', tone: 'blue' },
  { label: 'Mathematical Model', tone: 'gold' },
  { label: 'Student Worksheet', tone: 'sage' },
  { label: 'Research Question', tone: 'sage' },
]

const homeFeatureCards = [
  {
    title: 'Research Case Study',
    label: 'Applied mathematics',
    tone: 'research',
    text: 'Cassini radio occultation turns a radio signal through Saturn’s rings into an inverse problem: reconstruct radial structure from an indirect measurement.',
    figure: 'image',
    image: '/images/giant planets and their rings.png',
    imageAlt: 'Scientific comparison of giant planets and their ring systems',
    fit: 'cover',
    caption: 'Figure: Occultation-sensitive ring material motivates the reconstruction case study.',
    source: FIGURE_SOURCES.scientificViz,
  },
  {
    title: 'Interactive Research Tools',
    label: 'Hands-on exploration',
    tone: 'data',
    text: 'Students inspect a local Cassini radial window, compute basic statistics, and compare what the plotted signal suggests with simple mathematical checks.',
    figure: 'data-viewer',
    fit: 'contain',
    caption: 'Figure: Schematic of a local radius–signal plot of the kind used in the Data Viewer.',
    source: FIGURE_SOURCES.schematic,
  },
  {
    title: 'Student Research Pathway',
    label: 'Learning module',
    tone: 'learning',
    text: 'A guided path—mission background, local data, worksheet questions, and feedback—shows how classroom mathematics can become a research question.',
    figure: 'image',
    image: '/images/student-research-pathway.png',
    imageAlt: 'Student research pathway from interest and sources to a structured research output',
    fit: 'contain',
    caption:
      'Figure: Student research pathway from interest and sources to a structured research output.',
    source: 'Source: AI-assisted educational graphic created for this website.',
  },
]

const homeToolPreviewCards = [
  {
    title: 'Real Data Viewer',
    text: 'Choose a radial window from a Cassini sample, inspect the local signal, and export that window as CSV for later analysis.',
    tone: 'data',
    panelId: 'data',
    figure: 'data-viewer',
    fit: 'contain',
    caption: 'Figure: Local radial-window plot schematic for the Cassini Data Viewer workflow.',
    source: FIGURE_SOURCES.schematic,
  },
  {
    title: 'Toy Branch Diagram',
    text: 'A simplified fold model shows how stationary roots appear, merge, or split as a parameter changes.',
    tone: 'research',
    panelId: 'math',
    figure: 'branch',
    fit: 'contain',
    caption: 'Figure: Branch-structure schematic near a fold, as in the toy diagram.',
    source: FIGURE_SOURCES.schematic,
  },
]

const homeAudienceCards = [
  {
    title: 'Students',
    text: 'High school students who know calculus or physics but have not yet seen how those ideas appear in a research-style occultation problem.',
    tone: 'sage',
  },
  {
    title: 'Teachers & club leaders',
    text: 'Teachers and math/STEM club mentors who want a ready case study with public data links, a worksheet, and a clear learning sequence.',
    tone: 'beige',
  },
]

const projectUpdateCards = [
  {
    status: 'Completed',
    statusTone: 'completed',
    title: 'Research guide published',
    text: 'The How to Start Research page now combines the interest-to-question roadmap with a cautious AI literature workflow.',
  },
  {
    status: 'Completed',
    statusTone: 'completed',
    title: 'Data Hub linked to official archives',
    text: 'Students can open NASA/PDS/JPL Cassini occultation and ring product pages from the Data Hub.',
  },
  {
    status: 'In progress',
    statusTone: 'progress',
    title: 'Student mini-lab worksheet structured',
    text: 'The Student Worksheet now uses Observe → Measure → Interpret → Model → research question → mentor reflection sections.',
  },
  {
    status: 'Next',
    statusTone: 'next',
    title: 'Feedback pilot for clubs and classrooms',
    text: 'Impact metrics and a feedback form will be used in a small school and club pilot later this year.',
  },
]

const compactNavItems = [
  { id: 'start-here', title: 'Start Here' },
  { id: 'how-to-start-research', title: 'Research Guide' },
  { id: 'data-hub', title: 'Data Hub' },
  { id: 'math', title: 'Math' },
  { id: 'data', title: 'Viewer' },
  { id: 'worksheet', title: 'Worksheet' },
  { id: 'impact', title: 'Impact' },
]

function getMethodSlug(methodName) {
  return methodName
    .toLowerCase()
    .replace(/é/g, 'e')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

const pipelineSteps = [
  {
    title: 'Occultation data',
    text: 'Start with a radio signal measurement or schematic example tied to ring radius.',
    does: 'Collects the radius-indexed signal information used for later inspection.',
    matters: 'The rest of the workflow depends on knowing what quantity is being compared and where it lives radially.',
    io: 'Input: occultation measurement or toy signal. Output: radius-aligned signal values.',
  },
  {
    title: 'Preprocessing',
    text: 'Clean, align, and normalize the signal before asking mathematical questions.',
    does: 'Organizes columns, units, and simple scaling so plots and diagnostics are comparable.',
    matters: 'Small inconsistencies can look like structure if the signal is not prepared carefully.',
    io: 'Input: raw or schematic signal table. Output: cleaned radius and signal arrays.',
  },
  {
    title: 'Local radial window selection',
    text: 'Choose a focused interval of radius for close inspection.',
    does: 'Restricts plots and diagnostics to a small radial window selected by the user.',
    matters: 'Local windows make it easier to inspect fine structure without claiming a global reconstruction.',
    io: 'Input: cleaned signal. Output: selected radius window and local subset.',
  },
  {
    title: 'Stationary phase analysis',
    text: 'Study where phase derivatives suggest stationary contributions may occur.',
    does: 'Computes or visualizes derivative-like quantities and marks candidate roots of ψ′.',
    matters: 'Stationary points are where oscillatory cancellation can weaken, so they guide interpretation.',
    io: 'Input: local window and phase model. Output: candidate stationary points and curvature notes.',
  },
  {
    title: 'Bifurcation diagnostics',
    text: 'Track where roots appear, merge, disappear, or switch branches.',
    does: 'Checks root counts, branch continuity, and changes in local curvature across nearby parameters.',
    matters: 'Bifurcation-like behavior can make a simple stationary-phase approximation unreliable.',
    io: 'Input: stationary point candidates over a parameter range. Output: branch and bifurcation flags.',
  },
  {
    title: 'Reconstruction / visualization output',
    text: 'Turn the inspected window and diagnostics into clear figures for discussion.',
    does: 'Creates schematic or public-data visualizations with captions and exportable local views.',
    matters: 'The goal is a careful research-support display, not an overclaimed final ring result.',
    io: 'Input: selected data, diagnostics, and notes. Output: plots, captions, and exportable windows.',
  },
]

const numericalMethodsToolkit = [
  {
    tag: 'Interpolation',
    name: 'PCHIP Interpolation',
    does: 'Shape-preserving interpolation for phase or signal samples.',
    matters: 'Useful when smooth interpolation is needed without introducing large oscillations.',
    example:
      'Suppose we have sampled phase values at several nearby radii. A regular high-degree fit may wiggle too much, but PCHIP follows the data shape more safely.',
    caption: 'Six sampled points with a smooth curve that preserves local shape.',
    illustration: 'pchip',
    status: 'Candidate method.',
  },
  {
    tag: 'Interpolation',
    name: 'Cubic Spline Interpolation',
    does: 'Builds a smooth piecewise-polynomial approximation from sampled data.',
    matters: 'Provides a baseline smooth interpolation method for phase reconstruction.',
    example:
      'Given several sampled values of a phase-related quantity, cubic spline produces a smooth curve with continuous derivatives between knots.',
    caption: 'Knot points connected by a smooth piecewise cubic baseline.',
    illustration: 'spline',
    status: 'Candidate method.',
  },
  {
    tag: 'Interpolation',
    name: 'Floater-Hormann Rational Interpolation',
    does: 'Uses rational interpolation to approximate sampled functions while reducing some polynomial interpolation instability.',
    matters: 'Candidate method for stable phase approximation before root-finding.',
    example:
      'If polynomial interpolation begins to oscillate near the edge of a window, a rational interpolation can remain better behaved.',
    caption: 'A dashed oscillatory fit compared with a steadier rational fit.',
    illustration: 'rational',
    status: 'Candidate method.',
  },
  {
    tag: 'Initializer',
    name: 'Padé Approximation Initializer',
    does: 'Uses a local rational approximation P_m(x) / Q_n(x) to approximate the phase or phase derivative near a window.',
    matters: 'Can provide better initial guesses for Newton or Halley root-finding, especially near difficult local regions.',
    example:
      'Near a sharp local bend, a polynomial guess may miss the local geometry, but a Padé approximation can better capture the curve and predict where the derivative becomes zero.',
    caption: 'Padé provides an initializer for Newton / Halley near a difficult local bend.',
    illustration: 'pade',
    status: 'Prototype.',
  },
  {
    tag: 'Root solver',
    name: 'Newton Root-Finding',
    does: 'Iteratively solves f(φ)=0 using first-derivative information.',
    matters: 'Can locate stationary roots where ∂ψ/∂φ = 0 when the initial guess is good.',
    example:
      'Start from an initial guess near a root. Tangent lines step closer to the x-axis crossing.',
    caption: 'Candidate method; useful locally, but may be unstable near bifurcation.',
    illustration: 'newton',
    status: 'Candidate method.',
  },
  {
    tag: 'Root solver',
    name: 'Halley Root-Finding',
    does: 'Uses first and second derivative information for faster local convergence.',
    matters: 'Useful for refining stationary roots after a good initializer such as Padé approximation.',
    example:
      'Start from the same initial guess as Newton and show Halley reaching the root in fewer refinement steps.',
    caption: 'Uses second derivative information; faster when the local model and initial guess are good.',
    illustration: 'halley',
    status: 'Candidate method.',
  },
  {
    tag: 'Continuation',
    name: 'Pseudo-Arclength Continuation',
    does: 'Tracks solution branches through folds by stepping along the curve rather than only along one parameter axis.',
    matters: 'Important near fold-like regions where ordinary parameter stepping can fail or jump branches.',
    example:
      'A branch bends back, so x is no longer a good global parameter. Pseudo-arclength continues along the branch anyway.',
    caption: 'Arrows follow the folded branch through the turning region.',
    illustration: 'continuation',
    status: 'Prototype / planned.',
  },
  {
    tag: 'Validation',
    name: 'Least-Squares Fitting',
    does: 'Fits a local model to sampled data by minimizing residual error.',
    matters: 'Useful for local phase fitting, parameter estimation, or comparing candidate reconstruction models.',
    example:
      'Fit a simple model to several noisy sample points and compare the residuals.',
    caption: 'Local least-squares fit on a sampled radial window.',
    illustration: 'leastSquares',
    status: 'Planned.',
  },
  {
    tag: 'Bookkeeping',
    name: 'Branch Bookkeeping',
    does: 'Stores each stationary root with its phase value, curvature, label, and diagnostic flag.',
    matters: 'Connects root-finding output to reconstruction and prevents branches from being mixed up.',
    example:
      'At one radius window there are 3 roots, and at the next window there are still 3 roots but slightly shifted. Bookkeeping matches root A to A, B to B, C to C.',
    caption: 'Neighboring slices are matched by branch labels.',
    illustration: 'bookkeeping',
    status: 'Prototype.',
  },
  {
    tag: 'Diagnostics',
    name: 'Local Diagnostics and Confidence Score',
    does: 'Uses curvature, branch separation, and jump behavior to estimate whether a stationary root record is reliable.',
    matters: 'Flags regions near caustics, bifurcations, or unstable stationary-phase approximations.',
    example:
      'If two roots become very close and curvature becomes small, confidence drops and the point gets a warning flag.',
    caption: 'Confidence falls near the fold-like warning zone.',
    illustration: 'diagnostics',
    status: 'Prototype.',
  },
  {
    tag: 'Validation',
    name: 'Stationary-Phase Reliability Benchmark',
    does: 'Compares the stationary-point approximation against a fuller numerical integral or local residual check.',
    matters: 'Helps detect missed roots, unstable windows, or regions requiring special treatment.',
    example:
      'Compare an approximate reconstructed value and a more direct numerical reference; if the mismatch is small, the method passes the check.',
    caption: 'A good case has nearly overlapping curves; a warning case separates.',
    illustration: 'benchmark',
    status: 'Planned.',
  },
]

const mathConcepts = [
  {
    kicker: 'Oscillatory integral',
    title: 'Many waves added together',
    symbol: (
      <>
        <span>∫ A(r)e</span>
        <sup>iψ(r)</sup>
        <span>&nbsp;dr</span>
      </>
    ),
    text: 'The measured occultation signal can be modeled as many phase-shifted contributions that may cancel or reinforce along radius.',
  },
  {
    kicker: 'Phase function ψ',
    title: 'The wave clock',
    symbol: 'ψ(r)',
    text: 'The phase records how quickly the signal oscillates as ring radius changes—the same radial axis used in the Data Viewer.',
  },
  {
    kicker: 'Stationary point ψ′ = 0',
    title: 'Where cancellation slows',
    symbol: 'ψ′(r) = 0',
    text: 'Near a stationary point, nearby waves line up more strongly. Local Viewer windows help students inspect where the observed curve changes most.',
  },
  {
    kicker: 'Second derivative ψ″',
    title: 'Curvature near the root',
    symbol: 'ψ″(r)',
    text: 'The second derivative measures local bending and helps estimate how sharp a stationary contribution is in a reconstruction experiment.',
  },
  {
    kicker: 'Bifurcation / branches',
    title: 'Roots can split or merge',
    symbol: 'root tracks',
    text: 'Branch bookkeeping keeps stationary points matched correctly as parameters or radius windows change—linking the toy diagram to careful local analysis.',
  },
]

const formulaLibrary = [
  {
    title: 'Oscillatory Integral Model',
    formula: (
      <>
        <span>I(p) = ∫ A(φ; p)e</span>
        <sup>ikψ(φ; p)</sup>
        <span> dφ</span>
      </>
    ),
    purpose:
      'Represents the oscillatory integral framework behind the reconstruction problem. The amplitude A changes slowly, while the phase ψ controls rapid oscillation.',
  },
  {
    title: 'Stationary Phase Condition',
    formula: (
      <>
        <span>∂ψ / ∂φ = 0</span>
      </>
    ),
    purpose:
      'Defines stationary roots, where the phase changes slowly. These roots often dominate the contribution of the oscillatory integral.',
  },
  {
    title: 'Second Derivative Diagnostic',
    formula: (
      <>
        <span>ψ″(φ</span>
        <sub>s</sub>
        <span>; p) = ∂</span>
        <sup>2</sup>
        <span>ψ / ∂φ</span>
        <sup>2</sup>
        <span> at φ = φ</span>
        <sub>s</sub>
      </>
    ),
    purpose:
      'Measures local curvature near a stationary point. Small |ψ″| can indicate instability, caustic behavior, or a nearby bifurcation.',
  },
  {
    title: 'Local Taylor Expansion',
    formula: (
      <>
        <span>ψ(φ; p) ≈ ψ(φ</span>
        <sub>s</sub>
        <span>; p) + 1/2 ψ″(φ</span>
        <sub>s</sub>
        <span>; p)(φ − φ</span>
        <sub>s</sub>
        <span>)</span>
        <sup>2</sup>
        <span> + 1/6 ψ‴(φ</span>
        <sub>s</sub>
        <span>; p)(φ − φ</span>
        <sub>s</sub>
        <span>)</span>
        <sup>3</sup>
      </>
    ),
    purpose:
      'Approximates the phase near a stationary root and helps diagnose whether a local region is regular or nearly degenerate.',
  },
  {
    title: 'Stationary Phase Approximation',
    formula: (
      <>
        <span>I(p) ≈ A(φ</span>
        <sub>s</sub>
        <span>; p)e</span>
        <sup>ikψ(φ_s; p)</sup>
        <span> √(2π / (k |ψ″(φ</span>
        <sub>s</sub>
        <span>; p)|))</span>
      </>
    ),
    purpose:
      'Estimates the main contribution from an isolated stationary point and shows why curvature matters.',
  },
  {
    title: 'Bifurcation / Caustic Warning',
    formula: (
      <>
        <span>|ψ″(φ</span>
        <sub>s</sub>
        <span>; p)| &lt; ε</span>
        <sub>bif</sub>
      </>
    ),
    purpose: 'Flags regions where stationary roots may merge, disappear, or become difficult to track.',
  },
  {
    title: 'Newton Root-Finding Update',
    formula: (
      <>
        <span>φ</span>
        <sub>n+1</sub>
        <span> = φ</span>
        <sub>n</sub>
        <span> − f(φ</span>
        <sub>n</sub>
        <span>) / f′(φ</span>
        <sub>n</sub>
        <span>), where f(φ) = ∂ψ / ∂φ</span>
      </>
    ),
    purpose: 'Iteratively solves the stationary phase condition f(φ)=0.',
  },
  {
    title: 'Halley Root-Finding Update',
    formula: (
      <>
        <span>φ</span>
        <sub>n+1</sub>
        <span> = φ</span>
        <sub>n</sub>
        <span> − [2 f(φ</span>
        <sub>n</sub>
        <span>) f′(φ</span>
        <sub>n</sub>
        <span>)] / [2(f′(φ</span>
        <sub>n</sub>
        <span>))</span>
        <sup>2</sup>
        <span> − f(φ</span>
        <sub>n</sub>
        <span>) f″(φ</span>
        <sub>n</sub>
        <span>)]</span>
      </>
    ),
    purpose:
      'A faster root-finding method that uses second-derivative information when the initial guess is good.',
  },
  {
    title: 'Branch Output Tuple',
    formula: (
      <>
        <span>{'{ φ'}</span>
        <sub>s</sub>
        <span>, ψ, ψ″, label, flag {'}'}</span>
      </>
    ),
    purpose:
      'Stores each stationary root with its phase value, curvature, branch label, and diagnostic flag.',
  },
]

const contributions = [
  'Building visualization tools for schematic signals, phase behavior, and candidate diagnostics.',
  'Developing local radial-window inspection so small regions can be studied without claiming a full reconstruction.',
  'Preparing future stationary-phase and bifurcation diagnostics, including root tracking and curvature checks.',
]

const featuredReferenceImage = {
  title: 'Saturn’s Ring Structure Reference',
  image: '/images/saturn-rings-labeled.jpg',
  caption:
    'Labeled view of Saturn’s major rings, divisions, and ring features used to connect mission geometry to Viewer radial windows.',
  source: FIGURE_SOURCES.cassiniImagery,
}

const galleryImages = [
  {
    title: 'Saturn’s Ring Structure Reference',
    image: '/images/saturn-rings-labeled.jpg',
    caption:
      'Labeled overview of Saturn’s major rings and divisions, useful for relating mission geometry to radial structure.',
    source: FIGURE_SOURCES.cassiniImagery,
  },
  {
    title: 'Cassini Radio Occultation',
    image: '/images/cassini-occultation.jpg',
    caption:
      'Explanatory figure of radio signals passing through Saturn’s rings, used to introduce occultation geometry.',
    source: FIGURE_SOURCES.radioOccultation,
  },
  {
    title: 'Cassini Division',
    image: '/images/cassini-division.jpg',
    caption:
      'Close view of the Cassini Division, one of the most recognizable large-scale structures in Saturn’s ring system.',
    source: FIGURE_SOURCES.cassiniImagery,
  },
  {
    title: 'Fine Ring Structure',
    image: '/images/ring-detail.jpg',
    caption:
      'High-resolution ring texture showing narrow radial structure that motivates local-window analysis.',
    source: FIGURE_SOURCES.cassiniImagery,
  },
  {
    title: 'Rings and Waves',
    image: '/images/rings-and-waves.jpg',
    caption:
      'Wave-like ring features used as visual context for radial structure and diffraction-sensitive reconstruction.',
    source: FIGURE_SOURCES.scientificViz,
  },
  {
    title: 'The Great Divide',
    image: '/images/great-divide.jpg',
    caption:
      'A broad division in Saturn’s rings that helps illustrate large-scale radial gaps and ring-region boundaries.',
    source: FIGURE_SOURCES.cassiniImagery,
  },
  {
    title: 'Small Particles in Saturn’s Rings',
    image: '/images/small-particles.jpg',
    caption:
      'Cassini-derived visualization highlighting how ring material and particle distributions relate to measured signals.',
    source: FIGURE_SOURCES.scientificViz,
  },
  {
    title: 'VIMS Grain-Size Context',
    image: '/images/vims-grain-size.jpeg',
    caption:
      'Cassini VIMS grain-size context for ring particle distributions, complementary to radio occultation products in the Data Hub.',
    source: FIGURE_SOURCES.scientificViz,
  },
]

const teamMembers = [
  {
    name: 'Dr. Ryan Maguire',
    role: 'Mentor / research advisor.',
    cardRole: 'Mentor / research advisor',
    paperSections: ['Research guidance and supervision'],
    focus: 'Provides research guidance, mathematical supervision, and project direction.',
    keyIdeas: [
      'Refining mathematical assumptions',
      'Guiding numerical strategy',
      'Supporting the team reading and research process',
    ],
    module: 'Research guidance and project overview.',
    status: 'Ongoing mentorship.',
  },
  {
    name: 'Maiya Qiu',
    role: 'Interpolation and stationary-root numerical methods.',
    cardRole: 'Interpolation and stationary-root methods',
    paperSections: [
      'Introduction',
      '1D Interpolation of the Phase for Reconstruction',
      'Numerical Methods for the Solutions to the Stationary Phase',
    ],
    focus:
      'Develops the motivation and numerical methods for improving phase approximation and root tracking.',
    keyIdeas: [
      'Radio occultation motivation',
      'C-Spline interpolation',
      'PCHIP interpolation',
      'Floater-Hormann interpolation',
      'Newton and Halley root-finding',
      'Pseudo-arclength continuation for tracking folded solution branches',
    ],
    module: 'Interpolation and root-tracking overview.',
    status: 'Algorithm design and comparison under development.',
  },
  {
    name: 'Yutong Zhao',
    role: 'Theoretical background and multivariate interpolation.',
    cardRole: 'Theory and multivariate interpolation',
    paperSections: ['Theoretical Background', 'Multivariate Interpolation'],
    focus:
      'Builds the mathematical and physical background for the reconstruction framework.',
    keyIdeas: [
      'Wave optics',
      'Huygens-Fresnel principle',
      'Fresnel diffraction',
      'Saturn ring geometry',
      'Fresnel scale',
      'Stationary phase framework',
      'Multivariate / implicit reconstruction ideas',
      'RBF-style reconstruction',
    ],
    module: 'Theory background and multivariate reconstruction overview.',
    status: 'Theory framework and multivariate methods under development.',
  },
  {
    name: 'Dell Li',
    role: 'Branch bookkeeping, local diagnostics, reliability testing, and research portal.',
    cardRole: 'Branch bookkeeping and diagnostics',
    paperSections: [
      'Abstract',
      'Branch Bookkeeping Between Root Finding and Reconstruction',
      'Local Diagnostics Near Bifurcation',
      'Reliability of the Stationary-Point Approximation and Possible Residual Contributions',
    ],
    focus:
      'Connects stationary-root finding to the reconstruction layer by organizing roots, labels, curvature, branch status, confidence scores, and validation logic.',
    keyIdeas: [
      'Branch labels',
      'Stationary-root records',
      'Second-derivative diagnostics',
      'Bifurcation warning flags',
      'Confidence score prototype',
      'Stationary-point reliability benchmark',
      'Website / research portal development',
      'Real-data viewer prototype',
    ],
    module: 'Branch record dashboard, confidence calculator, real-data viewer, and research portal.',
    status: 'Active development.',
  },
]

const startHereLearnCards = [
  {
    title: 'What is radio occultation?',
    text: 'Learn how a spacecraft radio signal passing through Saturn’s rings becomes a measurement of ring structure rather than a direct image.',
  },
  {
    title: 'Why is this an inverse problem?',
    text: 'See why scientists infer hidden ring properties from an indirect signal instead of observing structure directly.',
  },
  {
    title: 'How can data become a research question?',
    text: 'Follow how local data inspection, modeling, and reflection can turn curiosity into a testable research idea.',
  },
]

const startHerePathSteps = [
  {
    step: 1,
    title: 'Mission Background',
    description: 'Understand radio occultation and the Cassini mission setting.',
    panelId: 'background',
  },
  {
    step: 2,
    title: 'Inverse Problem Context',
    description: 'Learn why the measured signal is indirect and what structure we try to infer.',
    panelId: 'background',
  },
  {
    step: 3,
    title: 'Mathematical Framework',
    description: 'Explore stationary phase, formulas, and the ideas behind reconstruction.',
    panelId: 'math',
  },
  {
    step: 4,
    title: 'Toy Branch Diagram',
    description: 'Try a simplified model to see how roots and branches split or merge.',
    panelId: 'math',
  },
  {
    step: 5,
    title: 'Cassini Data Viewer',
    description: 'Inspect a local radial window, compute statistics, and export a sample.',
    panelId: 'data',
  },
  {
    step: 6,
    title: 'Student Worksheet',
    description: 'Answer guided questions that connect observation, math, and research thinking.',
    panelId: 'worksheet',
  },
  {
    step: 7,
    title: 'Impact & Feedback',
    description: 'Share what became clearer and help improve the learning module.',
    panelId: 'impact',
  },
]

const studentWorksheetSections = [
  {
    id: 'observe',
    title: 'Observe',
    prompt:
      'Open the Data Viewer, choose one Cassini RSS sample, and look at the full radius–optical-depth curve.',
    questions: [
      'Which dataset did you choose (Rev and band)?',
      'What is the overall radius range of the sample?',
      'Where does the curve look smooth, and where does it change sharply?',
    ],
  },
  {
    id: 'measure',
    title: 'Measure',
    prompt: 'Select one local radial window and record the window statistics shown in the Viewer.',
    questions: [
      'What is the selected window radius range (km)?',
      'How many points are in the window?',
      'What are the mean, median, and standard deviation of the y-variable in that window?',
      'How many local peaks does the window contain?',
    ],
  },
  {
    id: 'interpret',
    title: 'Interpret',
    prompt: 'Connect the plot features to the scientific setting of radio occultation.',
    questions: [
      'Why is radio occultation different from taking a direct photograph of Saturn’s rings?',
      'What is the measured signal in this project, and what physical structure are we trying to infer?',
      'Why can noise or small measurement errors make reconstruction difficult?',
    ],
  },
  {
    id: 'model',
    title: 'Model',
    prompt:
      'Use the Mathematical Framework page and the toy branch diagram to connect classroom math to the Viewer.',
    questions: [
      'What is the forward problem in the Saturn rings setting?',
      'What is the inverse problem in the Saturn rings setting?',
      'What does a stationary point mean intuitively in an oscillatory integral?',
      'In the toy branch diagram, when do roots split or merge, and why might that matter for reconstruction?',
    ],
  },
  {
    id: 'research-question',
    title: 'Write a research question',
    prompt:
      'Turn one observation from the Data Viewer into a specific question that could be tested with math, code, or more data.',
    questions: [
      'Write one research question based on a local window you inspected.',
      'What quantity would you need to measure or compute to answer that question?',
      'What would count as evidence that your answer is reliable?',
    ],
  },
  {
    id: 'reflection',
    title: 'Reflection / next question for a mentor',
    prompt:
      'Summarize what became clearer and prepare one concise question you could ask a mentor or club advisor.',
    questions: [
      'What part of the project helped you most understand how classroom math becomes research?',
      'What is still confusing after using the Viewer and Math pages?',
      'Write one short, specific question you would ask a mentor next.',
    ],
  },
]

const researchRoadmapSteps = [
  {
    title: 'Choose a concrete interest domain.',
    detail: 'Example: astronomy + physics + mathematics.',
  },
  {
    title: 'Build a literature map.',
    detail: 'Search for review articles, public datasets, core papers, and beginner explanations.',
  },
  {
    title: 'Extract expert thinking patterns.',
    detail:
      'Ask: What do experts measure? What models do they use? What assumptions do they make? How do they validate results?',
  },
  {
    title: 'Learn through questions.',
    detail:
      'Use AI and papers to generate beginner-to-advanced questions. If a question is confusing, identify the missing prerequisite and learn it.',
  },
  {
    title: 'Build a toy model.',
    detail: 'Before using full real data, create a simplified version of the problem that can run locally.',
  },
  {
    title: 'Move to real data.',
    detail: 'Use public datasets or small local windows rather than trying to process everything at once.',
  },
  {
    title: 'Form a research question.',
    detail: 'Turn confusion into a specific question that can be tested with math, code, or data.',
  },
  {
    title: 'Contact experts respectfully.',
    detail:
      'Send concise emails with your result, graph, code, and specific question. Iterate based on feedback.',
  },
  {
    title: 'Produce an output.',
    detail: 'Build a report, website, notebook, dataset, visualization, or paper draft.',
  },
]

const aiWorkflowSteps = [
  {
    letter: 'A',
    title: 'Start with a field',
    detail: 'Example: Saturn rings, radio occultation, inverse problems, applied mathematics.',
  },
  {
    letter: 'B',
    title: 'Collect source materials',
    detail:
      'Include papers, textbooks, public datasets, lecture notes, NASA/PDS documentation, and review articles.',
  },
  {
    letter: 'C',
    title: 'Ask AI to build a literature map',
    detail:
      'Group these papers by topic, identify the central questions, list the main mathematical tools, and explain what a beginner should read first.',
    isPrompt: true,
  },
  {
    letter: 'D',
    title: 'Ask AI to extract expert thinking patterns',
    detail:
      'What assumptions do experts make in this field? What quantities do they measure? What models do they trust? How do they check whether a result is reliable?',
    isPrompt: true,
  },
  {
    letter: 'E',
    title: 'Ask AI to generate a problem ladder',
    detail:
      'Create 10 questions from beginner to research level that would help a high school student understand this field.',
    isPrompt: true,
  },
  {
    letter: 'F',
    title: 'Verify everything',
    detail:
      'Students must check original papers, official datasets, equations, and code. AI can hallucinate, so every claim should be traced back to a reliable source.',
  },
  {
    letter: 'G',
    title: 'Turn confusion into research',
    detail:
      'When a student repeatedly gets stuck on a question, that confusion may reveal a real learning path or research direction rather than a dead end.',
  },
]

const dataHubSources = [
  {
    title: 'PDS Ring-Moon Systems Node',
    level: 'Official Archive / Advanced',
    contains:
      'Official archive for planetary rings and moons data, including Cassini-related ring observations and search tools.',
    matters:
      'This is the main archive hub for students who want to move beyond sample data and find official Saturn ring products.',
    beginnerNote:
      'Start here only after reading the JPL occultation explanation and the Rings Science Overview. Use search pages rather than downloading large volumes at once.',
    advancedNote:
      'Use this node to locate calibrated and derived products, compare instrument families, and document exact dataset IDs for research notes.',
    href: 'https://pds-rings.seti.org/',
    buttonLabel: 'Open PDS Ring-Moon Systems Node',
  },
  {
    title: 'Cassini Data at PDS Ring-Moon Node',
    level: 'Official Archive / Advanced',
    contains:
      'Cassini CIRS, ISS, UVIS, VIMS, and RSS occultation data products, with calibrated products, derived products, browse products, and metadata.',
    matters:
      'This is the most relevant starting point for finding official Cassini ring and occultation data.',
    beginnerNote:
      'Browse instrument overviews first. Prefer browse products and documentation pages before attempting full downloads.',
    advancedNote:
      'Useful for comparing RSS optical-depth profiles with UVIS/VIMS products and for tracing product lineage in PDS labels.',
    href: 'https://pds-rings.seti.org/cassini/',
    buttonLabel: 'Open Cassini PDS Data',
  },
  {
    title: 'Cassini RSS Ring Occultation Data',
    level: 'Closest Match / Advanced',
    contains: 'Saturn ring radial profiles derived from Cassini RSS radio occultation data.',
    matters:
      'This is closest to the radio-occultation reconstruction case study used on this website.',
    beginnerNote:
      'After using the five local Viewer samples on this site, return here to see how official RSS products are organized.',
    advancedNote:
      'Look for radial optical-depth profiles, geometry metadata, and resolution notes before building your own analysis pipeline.',
    href: 'https://pds-rings.seti.org/cassini/rss/',
    buttonLabel: 'Open RSS Occultation Profiles',
  },
  {
    title: 'Cassini UVIS Stellar Occultation Data',
    level: 'Official Dataset / Advanced',
    contains:
      'Derived radial occultation profiles of Saturn’s rings from Cassini UVIS stellar occultations between 2004 and 2017.',
    matters:
      'Provides another optical-depth view of ring structure and is useful for comparing different occultation methods.',
    beginnerNote:
      'Treat UVIS as a comparison instrument: same rings, different observing method and wavelength family.',
    advancedNote:
      'Compare resolution, coverage, and optical-depth conventions carefully when pairing UVIS profiles with RSS samples.',
    href: 'https://pds.nasa.gov/ds-view/pds/viewDataset.jsp?dsid=CO-SR-UVIS-HSP-2%2F4-OCC-V2.0',
    buttonLabel: 'Open UVIS Dataset',
  },
  {
    title: 'Cassini UVIS Occultations at PDS Ring-Moon Node',
    level: 'Official Archive / Advanced',
    contains:
      'Version 2 radial profiles from more than 200 UVIS stellar occultations, including 1 km and 10 km resolution products.',
    matters: 'Useful for students who want ring radial profiles at different resolutions.',
    beginnerNote:
      'Begin with coarser (for example 10 km) products if you are learning how radial profiles are stored and plotted.',
    advancedNote:
      'Higher-resolution products support local-window studies similar to the Viewer workflow on this site.',
    href: 'https://pds-rings.seti.org/cassini/uvis/',
    buttonLabel: 'Open UVIS Occultation Page',
  },
  {
    title: 'Cassini VIMS Ring Occultation Data',
    level: 'Official Dataset / Advanced',
    contains:
      'VIMS stellar and solar occultation observations of Saturn’s rings, with calibrated occultation products available through PDS resources.',
    matters: 'Useful for comparing ring profiles across instruments and wavelengths.',
    beginnerNote:
      'Use VIMS pages for context on grain size and composition rather than as your first occultation dataset.',
    advancedNote:
      'Helpful for multi-instrument validation once an RSS local window has been inspected carefully.',
    href: 'https://pds-atmospheres.nmsu.edu/data_and_services/atmospheres_data/Cassini/inst-vims.html',
    buttonLabel: 'Open VIMS Resources',
  },
  {
    title: 'Cassini Rings Science Overview',
    level: 'Beginner-Friendly',
    contains:
      'A student-friendly overview of Cassini ring science and occultation observation types.',
    matters:
      'Good first stop before students enter dense archive pages or download data products.',
    beginnerNote:
      'Read this page before opening archive catalogs. It explains what kinds of ring observations exist.',
    advancedNote:
      'Still useful later as a map of observation types when deciding which archive product family to inspect next.',
    href: 'https://pds-atmospheres.nmsu.edu/data_and_services/atmospheres_data/Cassini/sci-rings.html',
    buttonLabel: 'Open Rings Science Overview',
  },
  {
    title: 'JPL Radio Occultation Explanation',
    level: 'Beginner-Friendly',
    contains:
      'A visual explanation of how Cassini radio occultation helps study Saturn’s rings.',
    matters:
      'Gives physical context before students dive into dense data archives or reconstruction math.',
    beginnerNote:
      'Start here if the phrase “radio occultation” is new. Pair it with the Mission Background page on this site.',
    advancedNote:
      'Use the geometry intuition from this explanation when interpreting radius-indexed RSS curves in the Viewer.',
    href: 'https://www.jpl.nasa.gov/images/pia07873-radio-occultation-unraveling-saturns-rings/',
    buttonLabel: 'Open JPL Explanation',
  },
]

function buildWorksheetText() {
  const lines = [
    'Student Mini-Lab Worksheet',
    'Saturn Rings Reconstruction Lab',
    '',
    'Use the Data Viewer and Mathematical Framework pages while answering.',
    '',
  ]

  studentWorksheetSections.forEach((section) => {
    lines.push(`## ${section.title}`)
    lines.push(section.prompt)
    lines.push('')
    section.questions.forEach((question, index) => {
      lines.push(`${index + 1}. ${question}`)
    })
    lines.push('')
  })

  lines.push(VIEWER_EDUCATIONAL_NOTE)
  lines.push(FIGURE_SOURCES.csv)

  return lines.join('\n')
}

const whoThisHelps = [
  'High school students interested in applied mathematics or scientific computing.',
  'Students who have learned calculus, physics, or linear algebra but have not seen how those tools appear in research.',
  'Teachers, club leaders, or peer mentors looking for a concrete STEM enrichment case study.',
]

const impactMetrics = [
  { label: 'Students who tested the site', value: 'TBD' },
  { label: 'Feedback responses collected', value: 'TBD' },
  { label: 'Math/STEM club presentations', value: 'TBD' },
  { label: 'Website visitors', value: 'TBD' },
  { label: 'Worksheets completed', value: 'TBD' },
]

const progressGroups = [
  {
    title: 'Completed',
    items: [
      'React/Vite research portal',
      'GitHub + Vercel deployment',
      'NASA/JPL image gallery',
      'Team algorithm module layout',
      'Multi-rev Cassini RSS Data Viewer',
      'Local window export with dataset-aware filenames',
      'Student mini-lab worksheet sections',
    ],
  },
  {
    title: 'In progress',
    items: [
      'Classroom and club feedback collection',
      'Derivative diagnostics',
      'Stationary phase visualization refinements',
      'Branch bookkeeping prototype',
    ],
  },
  {
    title: 'Next',
    items: [
      'Optional overlay comparison across revs',
      'Add derivative plot in the Viewer',
      'Expand mentor feedback pilot',
      'Ask teammates/mentor which names and contributions can be shown publicly',
    ],
  },
]

const cassiniDatasets = [
  {
    id: 'rev007e_k34',
    label: 'Rev007E · K34 · TAU 10KM',
    file: '/data/cassini_rev007e_k34.csv',
    rev: 'Rev007E',
    band: 'K34',
    productId: 'RSS_2005_123_K34_E',
    resolution: 'TAU_10KM',
  },
  {
    id: 'rev010e_k25',
    label: 'Rev010E · K25 · TAU 10KM',
    file: '/data/cassini_rev010e_k25.csv',
    rev: 'Rev010E',
    band: 'K25',
    productId: 'RSS_2005_177_K25_E',
    resolution: 'TAU_10KM',
  },
  {
    id: 'rev054ce_k55',
    label: 'Rev054CE · K55 · TAU 10KM',
    file: '/data/cassini_rev054ce_k55.csv',
    rev: 'Rev054CE',
    band: 'K55',
    productId: 'RSS_2007_353_K55_E',
    resolution: 'TAU_10KM',
  },
  {
    id: 'rev089ce_k34',
    label: 'Rev089CE · K34 · TAU 10KM',
    file: '/data/cassini_rev089ce_k34.csv',
    rev: 'Rev089CE',
    band: 'K34',
    productId: 'RSS_2008_291_K34_E',
    resolution: 'TAU_10KM',
  },
  {
    id: 'rev133e_x34',
    label: 'Rev133E · X34 · TAU 10KM',
    file: '/data/cassini_rev133e_x34.csv',
    rev: 'Rev133E',
    band: 'X34',
    productId: 'RSS_2010_170_X34_E',
    resolution: 'TAU_10KM',
  },
]

const cassiniRadiusAliases = [
  'ring_radius_km',
  'radius_km',
  'ring_radius',
  'radius',
  'r_km',
  'radial_distance',
]

const cassiniOpticalDepthAliases = [
  'normal_optical_depth',
  'normalized_optical_depth',
  'optical_depth',
  'tau',
  'opticaldepth',
  'od',
]

const cassiniSignalPowerAliases = [
  'normalized_signal_power',
  'signal_power',
  'power',
]

const miniInvestigationSteps = [
  'Choose a Cassini RSS dataset from the selector.',
  'Inspect the full radius–optical-depth curve.',
  'Step through local radial windows with the slider.',
  'Compare full-dataset and window statistics.',
  'Export the selected window CSV for later analysis.',
]

function parseNumericValue(value) {
  if (value === null || value === undefined || value === '') {
    return null
  }

  const parsed = Number(String(value).trim())
  return Number.isFinite(parsed) ? parsed : null
}

function detectNumericColumns(rows) {
  if (!rows.length) {
    return []
  }

  return Object.keys(rows[0]).filter((column) => {
    const values = rows.map((row) => parseNumericValue(row[column])).filter((value) => value !== null)
    return values.length > 0 && values.length / rows.length > 0.8
  })
}

function chooseDefaultColumn(columns, preferredNames, fallbackIndex = 0) {
  const normalizedColumns = columns.map((column) => column.toLowerCase().trim())
  const preferred = preferredNames
    .map((name) => {
      const target = name.toLowerCase()
      return normalizedColumns.findIndex(
        (column) => column === target || column.includes(target) || target.includes(column),
      )
    })
    .find((index) => index >= 0)

  if (preferred >= 0) {
    return columns[preferred]
  }

  if (fallbackIndex < 0) {
    return ''
  }

  return columns[fallbackIndex] || ''
}

function chooseYAxisColumn(columns) {
  const optical = chooseDefaultColumn(columns, cassiniOpticalDepthAliases, -1)
  if (optical) return optical
  return chooseDefaultColumn(columns, cassiniSignalPowerAliases, 0)
}

function computeMedian(values) {
  if (!values.length) return null
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]
}

function computeStd(values, mean) {
  if (!values.length) return null
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length
  return Math.sqrt(variance)
}

function countLocalPeaks(values) {
  if (values.length < 3) return 0
  let peaks = 0
  for (let i = 1; i < values.length - 1; i += 1) {
    if (values[i] > values[i - 1] && values[i] > values[i + 1]) {
      peaks += 1
    }
  }
  return peaks
}

function movingAverage(values, halfWindow = 2) {
  return values.map((_, index) => {
    const start = Math.max(0, index - halfWindow)
    const end = Math.min(values.length, index + halfWindow + 1)
    const slice = values.slice(start, end)
    return slice.reduce((sum, value) => sum + value, 0) / slice.length
  })
}

function summarizeSeries(points) {
  if (!points.length) return null

  const xValues = points.map((point) => point.x)
  const yValues = points.map((point) => point.y)
  const yMean = yValues.reduce((sum, value) => sum + value, 0) / yValues.length

  return {
    count: points.length,
    xMin: Math.min(...xValues),
    xMax: Math.max(...xValues),
    yMin: Math.min(...yValues),
    yMax: Math.max(...yValues),
    yMean,
    yMedian: computeMedian(yValues),
    yStd: computeStd(yValues, yMean),
    peakCount: countLocalPeaks(yValues),
  }
}

/** Aim for about 30 sliding local windows when the sample size allows. */
function chooseSlidingWindowSize(pointCount) {
  if (pointCount <= 2) {
    return { windowSize: Math.max(pointCount, 1), windowCount: 1 }
  }

  const targetWindows = 30
  let windowSize = Math.max(3, Math.round(pointCount - targetWindows + 1))
  if (windowSize >= pointCount) {
    windowSize = Math.max(3, Math.ceil(pointCount / 3))
  }

  let windowCount = pointCount - windowSize + 1

  if (windowCount < 20 || windowCount > 40) {
    for (const size of [
      Math.max(3, Math.round(pointCount * 0.25)),
      Math.max(3, Math.round(pointCount * 0.35)),
      12,
      10,
      8,
      6,
      4,
      3,
    ]) {
      const candidateSize = Math.min(pointCount, size)
      const candidateCount = pointCount - candidateSize + 1
      if (candidateCount >= 20 && candidateCount <= 40) {
        return { windowSize: candidateSize, windowCount: candidateCount }
      }
    }
  }

  windowCount = Math.max(1, pointCount - windowSize + 1)
  return { windowSize, windowCount }
}

function formatStat(value) {
  if (!Number.isFinite(value)) {
    return '—'
  }

  return Math.abs(value) >= 1000 ? value.toFixed(2) : value.toPrecision(4)
}

function parseCsvLine(line) {
  const values = []
  let current = ''
  let inQuotes = false

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index]
    const nextCharacter = line[index + 1]

    if (character === '"' && nextCharacter === '"') {
      current += '"'
      index += 1
    } else if (character === '"') {
      inQuotes = !inQuotes
    } else if (character === ',' && !inQuotes) {
      values.push(current)
      current = ''
    } else {
      current += character
    }
  }

  values.push(current)
  return values
}

function parseCsvText(csvText) {
  const lines = csvText.trim().split(/\r?\n/).filter(Boolean)

  if (lines.length < 2) {
    return []
  }

  const headers = parseCsvLine(lines[0]).map((header) => header.trim())
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line)
    return headers.reduce((row, header, index) => {
      row[header] = values[index] ?? ''
      return row
    }, {})
  })
}

function escapeCsvValue(value) {
  const stringValue = String(value ?? '')

  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replaceAll('"', '""')}"`
  }

  return stringValue
}

function rowsToCsv(rows) {
  if (!rows.length) {
    return ''
  }

  const headers = Object.keys(rows[0])
  return [headers.join(','), ...rows.map((row) => headers.map((header) => escapeCsvValue(row[header])).join(','))].join('\n')
}

function NavBar() {
  return (
    <header className="site-header">
      <Link className="brand" to="/" aria-label="Go to main menu">
        <span className="brand-mark" aria-hidden="true">
          SR
        </span>
        <span className="brand-copy">
          <strong>Saturn Rings Reconstruction Lab</strong>
        </span>
      </Link>
      <nav aria-label="Main navigation">
        {compactNavItems.map((item) => (
          <Link key={item.id} to={PANEL_ROUTES[item.id]}>
            {item.title}
          </Link>
        ))}
      </nav>
    </header>
  )
}

// Retained for future diagram variants used by this learning module.
// eslint-disable-next-line no-unused-vars
function SchematicDataViewerFigure({ compact = false }) {
  return (
    <svg
      className={`home-schematic home-schematic-data${compact ? ' compact' : ''}`}
      viewBox="0 0 360 200"
      role="img"
      aria-label="Schematic of a local Cassini radius versus signal plot"
    >
      <rect className="schematic-panel" x="8" y="8" width="344" height="184" rx="4" />
      <text className="schematic-title" x="22" y="30">
        Local radial window
      </text>
      <text className="schematic-axis" x="188" y="188">
        radius (km)
      </text>
      <text className="schematic-axis" x="18" y="112" transform="rotate(-90 18 112)">
        signal
      </text>
      <line className="schematic-axis-line" x1="48" y1="156" x2="330" y2="156" />
      <line className="schematic-axis-line" x1="48" y1="42" x2="48" y2="156" />
      <rect className="schematic-window" x="132" y="42" width="86" height="114" />
      <path
        className="schematic-curve"
        d="M56 118 C78 86, 96 142, 118 104 C138 72, 150 128, 172 96 C194 68, 208 138, 228 108 C248 84, 268 132, 292 98 C308 78, 320 110, 328 92"
      />
      <circle className="schematic-point" cx="172" cy="96" r="3.5" />
      <circle className="schematic-point" cx="208" cy="118" r="3.5" />
      <text className="schematic-note" x="140" y="56">
        selected window
      </text>
    </svg>
  )
}

function SchematicPathwayFigure() {
  const row1 = [
    { x: 22, label: 'Interest' },
    { x: 132, label: 'Sources' },
    { x: 242, label: 'Questions' },
  ]
  const row2 = [
    { x: 22, label: 'Toy Model' },
    { x: 132, label: 'Data' },
    { x: 242, label: 'Output' },
  ]

  return (
    <svg
      className="home-schematic home-schematic-pathway"
      viewBox="0 0 360 200"
      role="img"
      aria-label="Research pathway from interest to output"
    >
      <rect className="schematic-panel" x="8" y="8" width="344" height="184" rx="4" />
      <text className="schematic-title" x="22" y="28">
        Research pathway
      </text>
      <defs>
        <marker id="pathwayArrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="#5f7368" />
        </marker>
      </defs>
      {row1.map((step, index) => (
        <g key={`r1-${step.label}`}>
          <rect className="schematic-box" x={step.x} y="44" width="90" height="36" rx="3" />
          <text className="schematic-box-label" x={step.x + 45} y="66" textAnchor="middle">
            {step.label}
          </text>
          {index < row1.length - 1 && (
            <path
              className="schematic-arrow"
              d={`M${step.x + 94} 62 L${step.x + 106} 62`}
              markerEnd="url(#pathwayArrow)"
            />
          )}
        </g>
      ))}
      <path className="schematic-arrow" d="M287 84 L287 100 L67 100 L67 116" markerEnd="url(#pathwayArrow)" />
      {row2.map((step, index) => (
        <g key={`r2-${step.label}`}>
          <rect className="schematic-box" x={step.x} y="120" width="90" height="36" rx="3" />
          <text className="schematic-box-label" x={step.x + 45} y="142" textAnchor="middle">
            {step.label}
          </text>
          {index < row2.length - 1 && (
            <path
              className="schematic-arrow"
              d={`M${step.x + 94} 138 L${step.x + 106} 138`}
              markerEnd="url(#pathwayArrow)"
            />
          )}
        </g>
      ))}
      <text className="schematic-note" x="22" y="180">
        Interest → Sources → Questions → Toy Model → Data → Output
      </text>
    </svg>
  )
}

// Retained for future diagram variants used by this learning module.
// eslint-disable-next-line no-unused-vars
function SchematicBranchFigure({ compact = false }) {
  return (
    <svg
      className={`home-schematic home-schematic-branch${compact ? ' compact' : ''}`}
      viewBox="0 0 360 200"
      role="img"
      aria-label="Schematic of folded solution branches near a fold point"
    >
      <rect className="schematic-panel" x="8" y="8" width="344" height="184" rx="4" />
      <text className="schematic-title" x="22" y="30">
        Branch structure
      </text>
      <line className="schematic-axis-line" x1="48" y1="156" x2="330" y2="156" />
      <line className="schematic-axis-line" x1="48" y1="42" x2="48" y2="156" />
      <text className="schematic-axis" x="188" y="188">
        parameter x
      </text>
      <text className="schematic-axis" x="18" y="112" transform="rotate(-90 18 112)">
        root y
      </text>
      <path
        className="schematic-branch upper"
        d="M86 128 C130 96, 170 62, 214 68 C250 74, 286 92, 318 88"
      />
      <path
        className="schematic-branch middle"
        d="M86 128 C132 128, 176 128, 214 128 C250 128, 286 124, 318 120"
      />
      <path
        className="schematic-branch lower"
        d="M86 128 C130 148, 170 172, 214 156 C250 144, 286 132, 318 128"
      />
      <circle className="schematic-fold" cx="86" cy="128" r="5" />
      <text className="schematic-note" x="98" y="122">
        fold
      </text>
      <text className="schematic-note" x="240" y="58">
        branches split
      </text>
    </svg>
  )
}

function SchematicWorksheetFigure() {
  const items = [
    'Define the occultation measurement',
    'Identify forward vs inverse problem',
    'Inspect one local radial window',
    'Record one research question',
  ]

  return (
    <svg
      className="home-schematic home-schematic-worksheet"
      viewBox="0 0 360 200"
      role="img"
      aria-label="Mini-lab worksheet checklist schematic"
    >
      <rect className="schematic-panel" x="8" y="8" width="344" height="184" rx="4" />
      <text className="schematic-title" x="22" y="30">
        Mini-lab checklist
      </text>
      {items.map((item, index) => {
        const y = 52 + index * 32
        return (
          <g key={item}>
            <rect className="schematic-check" x="24" y={y - 10} width="14" height="14" rx="2" />
            <text className="schematic-checklist-label" x="50" y={y + 1}>
              {index + 1}. {item}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

function FigureCaption({ caption, source, className = '', as: Tag = 'figcaption' }) {
  if (!caption && !source) return null

  return (
    <Tag className={`figure-caption-block ${className}`.trim()}>
      {caption && <p className="research-figure-caption">{caption}</p>}
      {source && <p className="figure-source-note">{source}</p>}
    </Tag>
  )
}

function HomeFigureMedia({ figure, image, imageAlt, caption, source, fit = 'cover' }) {
  let visual = null
  if (figure === 'data-viewer') {
    visual = <img src="/images/data viewer.png" alt="Cassini Data Viewer dashboard preview" />
  } else if (figure === 'pathway') {
    visual = <SchematicPathwayFigure />
  } else if (figure === 'branch') {
    visual = <img src="/images/bifurcation.jpg" alt="Bifurcation and branch-structure preview" />
  } else if (figure === 'worksheet') {
    visual = <SchematicWorksheetFigure />
  } else if (image) {
    visual = (
      <img
        className={fit === 'contain' ? 'figure-fit-contain' : 'figure-fit-cover'}
        src={image}
        alt={imageAlt || ''}
      />
    )
  }

  return (
    <figure className="home-figure-block">
      <div className={`home-feature-media${fit === 'contain' ? ' media-diagram' : ''}`}>{visual}</div>
      <FigureCaption caption={caption} source={source} className="home-figure-caption" />
    </figure>
  )
}

function ToolPreviewVisual({ figure }) {
  if (figure === 'data-viewer') {
    return <img src="/images/data viewer.png" alt="Cassini Data Viewer dashboard preview" />
  }
  if (figure === 'branch') {
    return <img src="/images/bifurcation.jpg" alt="Bifurcation and branch-structure preview" />
  }
  if (figure === 'pathway') return <SchematicPathwayFigure />
  if (figure === 'worksheet') return <SchematicWorksheetFigure />
  return null
}

function HeroImageCard({ onOpenModel }) {
  return (
    <figure className="visual-card hero-image-card research-figure mission-hero-figure">
      <div className="mission-hero-frame">
        <img
          className="figure-fit-cover"
          src="/images/saturn-rings-hero.jpg"
          alt="Saturn and its rings used as the homepage research case study hero"
        />
      </div>
      <figcaption className="mission-hero-caption">
        <FigureCaption
          as="div"
          caption="Figure: Saturn’s rings as the visual entry point for the radio-occultation reconstruction lab."
          source={FIGURE_SOURCES.cassiniImagery}
        />
        <button className="open-model-button" type="button" onClick={onOpenModel}>
          Open 3D Saturn Model
        </button>
      </figcaption>
    </figure>
  )
}

function SaturnModelModal({ onClose }) {
  return (
    <div className="saturn-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="saturn-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="saturn-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="saturn-modal-header">
          <div>
            <span className="card-kicker">Interactive model</span>
            <h3 id="saturn-modal-title">Interactive Saturn 3D Model</h3>
          </div>
          <button className="model-close-button" type="button" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="saturn-stage">
          <Suspense fallback={<p>Loading interactive Saturn model…</p>}>
            <SaturnModel />
          </Suspense>
        </div>
      </div>
    </div>
  )
}

function Section({ id, eyebrow, title, children, className = '', tone = '' }) {
  return (
    <section id={id} className={`section ${tone ? `panel-tone-${tone}` : ''} ${className}`.trim()}>
      <div className="section-heading">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
      </div>
      {children}
    </section>
  )
}

const branchPlot = {
  xMin: -8,
  xMax: 2,
  yMin: -4,
  yMax: 4,
  width: 620,
  height: 360,
  padX: 54,
  padY: 34,
}
const branchFoldPoint = {
  x: -Math.cbrt(27 / 4),
  y: -Math.cbrt(1 / 2),
}
const branchFoldTolerance = 0.04

function branchEquation(x, y) {
  return y ** 3 + x * y - 1
}

function mapBranchPoint(x, y) {
  const { xMin, xMax, yMin, yMax, width, height, padX, padY } = branchPlot
  const innerWidth = width - padX * 2
  const innerHeight = height - padY * 2

  return {
    x: padX + ((x - xMin) / (xMax - xMin)) * innerWidth,
    y: padY + ((yMax - y) / (yMax - yMin)) * innerHeight,
  }
}

function findBranchRoots(x) {
  const yMin = -5
  const yMax = 5
  const steps = 420
  const roots = []
  let previousY = yMin
  let previousValue = branchEquation(x, previousY)

  for (let index = 1; index <= steps; index += 1) {
    const currentY = yMin + ((yMax - yMin) * index) / steps
    const currentValue = branchEquation(x, currentY)

    if (Math.abs(previousValue) < 1e-5) {
      roots.push(previousY)
    } else if (previousValue * currentValue < 0) {
      let low = previousY
      let high = currentY
      let lowValue = previousValue

      for (let step = 0; step < 34; step += 1) {
        const mid = (low + high) / 2
        const midValue = branchEquation(x, mid)

        if (lowValue * midValue <= 0) {
          high = mid
        } else {
          low = mid
          lowValue = midValue
        }
      }

      roots.push((low + high) / 2)
    }

    previousY = currentY
    previousValue = currentValue
  }

  return roots
    .sort((a, b) => a - b)
    .filter((root, index, sortedRoots) => index === 0 || Math.abs(root - sortedRoots[index - 1]) > 0.01)
}

function pointsToPath(points) {
  return points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(' ')
}

function MethodIllustration({ type }) {
  if (type === 'rational') {
    return (
      <svg viewBox="0 0 220 120" role="img">
        <path className="method-axis" d="M18 92 H202" />
        <path className="method-line dashed" d="M24 78 C52 20, 72 112, 98 44 S154 102, 194 34" />
        <path className="method-line" d="M24 78 C58 62, 86 56, 116 52 S168 46, 194 38" />
      </svg>
    )
  }

  if (type === 'pade') {
    return (
      <svg viewBox="0 0 220 120" role="img">
        <path className="method-axis" d="M18 92 H202" />
        <path className="method-line muted dashed" d="M28 84 C72 80, 96 30, 128 18 S170 58, 196 96" />
        <path className="method-line" d="M28 84 C72 80, 100 58, 128 42 S174 38, 196 50" />
        <line className="method-residual gold" x1="138" x2="138" y1="42" y2="92" />
        <circle className="method-dot gold" cx="138" cy="92" r="4" />
        {[38, 74, 111, 150, 184].map((x, index) => (
          <circle className="method-dot" cx={x} cy={[82, 73, 55, 42, 48][index]} r="3.5" key={x} />
        ))}
        <text className="method-svg-label" x="116" y="18">polynomial guess</text>
        <text className="method-svg-label gold" x="92" y="108">predicted derivative zero</text>
        <text className="method-svg-label gold" x="84" y="36">Padé rational guess</text>
      </svg>
    )
  }

  if (type === 'newton') {
    return (
      <svg viewBox="0 0 220 120" role="img">
        <path className="method-axis" d="M18 92 H202" />
        <path className="method-line" d="M28 22 C60 28, 78 86, 108 92 S156 66, 194 28" />
        <path className="method-tangent" d="M62 70 L132 92" />
        <path className="method-tangent" d="M132 92 L166 64" />
        <circle className="method-dot gold" cx="62" cy="70" r="4" />
        <circle className="method-dot gold" cx="132" cy="92" r="4" />
        <text className="method-svg-label gold" x="38" y="108">candidate method</text>
        <text className="method-svg-label" x="112" y="28">may be unstable near fold</text>
      </svg>
    )
  }

  if (type === 'halley') {
    return (
      <svg viewBox="0 0 220 120" role="img">
        <path className="method-axis" d="M18 92 H202" />
        <path className="method-line muted" d="M28 26 C64 30, 82 90, 112 92 S160 64, 194 30" />
        <path className="method-arrow muted" d="M42 66 H78 H114 H144" />
        <path className="method-arrow" d="M42 88 H104 H154" />
        <circle className="method-dot" cx="78" cy="66" r="3" />
        <circle className="method-dot" cx="114" cy="66" r="3" />
        <circle className="method-dot gold" cx="104" cy="88" r="3.5" />
        <text className="method-svg-label" x="148" y="68">Newton: more steps</text>
        <text className="method-svg-label gold" x="112" y="92">Halley: fewer steps</text>
        <text className="method-svg-label" x="72" y="20">uses second derivative</text>
      </svg>
    )
  }

  if (type === 'continuation') {
    return (
      <svg viewBox="0 0 220 120" role="img">
        <path className="method-axis" d="M18 92 H202" />
        <path className="method-line" d="M46 98 C116 98, 64 24, 140 24 C184 24, 178 78, 124 78" />
        <line className="method-residual" x1="142" x2="142" y1="22" y2="96" />
        <path className="method-arrow muted" d="M150 96 V70" />
        <path className="method-arrow" d="M72 92 L88 82" />
        <path className="method-arrow" d="M100 44 L116 34" />
        <path className="method-arrow" d="M154 30 L166 42" />
        <text className="method-svg-label" x="120" y="108">ordinary parameter step fails</text>
        <text className="method-svg-label gold" x="42" y="33">continue along branch</text>
        <text className="method-svg-label gold" x="146" y="22">fold region</text>
      </svg>
    )
  }

  if (type === 'leastSquares') {
    return (
      <svg viewBox="0 0 220 120" role="img">
        <path className="method-axis" d="M18 92 H202" />
        <path className="method-line" d="M28 82 C66 70, 112 48, 194 30" />
        <text className="method-svg-label gold" x="42" y="18">local least-squares fit</text>
        <text className="method-svg-label" x="58" y="108">sampled window</text>
        {[40, 68, 100, 132, 164, 190].map((x, index) => {
          const y = [78, 63, 68, 44, 50, 25][index]
          const fitY = [78, 68, 58, 48, 38, 31][index]
          return (
            <g key={x}>
              <line className="method-residual" x1={x} x2={x} y1={y} y2={fitY} />
              <circle className="method-dot" cx={x} cy={y} r="3.5" />
            </g>
          )
        })}
      </svg>
    )
  }

  if (type === 'bookkeeping') {
    return (
      <svg viewBox="0 0 220 120" role="img">
        <path className="method-axis" d="M42 28 V84 M104 28 V84 M142 28 V84 M184 28 V84" />
        <text className="method-svg-label gold" x="24" y="18">normal tracking</text>
        <text className="method-svg-label" x="128" y="18">near fold: flag branch merge</text>
        {[36, 56, 76].map((y, index) => (
          <g key={y}>
            <line className="method-match" x1="42" x2="104" y1={y} y2={y + [5, -1, -6][index]} />
            <circle className="method-dot gold" cx="42" cy={y} r="3.6" />
            <circle className="method-dot" cx="104" cy={y + [5, -1, -6][index]} r="3.6" />
          </g>
        ))}
        <path className="method-match warn" d="M142 38 C160 42, 172 47, 184 54 M142 72 C160 68, 172 61, 184 54" />
        <circle className="method-dot" cx="142" cy="38" r="3.5" />
        <circle className="method-dot" cx="142" cy="72" r="3.5" />
        <circle className="method-dot gold" cx="184" cy="54" r="4.8" />
        <text className="method-svg-label" x="40" y="104">labels preserved</text>
        <text className="method-svg-label gold" x="154" y="104">double root</text>
      </svg>
    )
  }

  if (type === 'diagnostics') {
    return (
      <svg viewBox="0 0 220 120" role="img">
        <rect className="method-zone warn" x="126" y="22" width="70" height="76" rx="12" />
        <path className="method-line" d="M26 88 C72 82, 106 72, 134 58 C154 48, 174 48, 194 58" />
        <path className="method-line muted" d="M26 24 C74 32, 108 42, 134 56 C154 66, 174 66, 194 56" />
        <line className="method-residual" x1="152" x2="152" y1="51" y2="64" />
        <circle className="method-dot gold" cx="152" cy="51" r="3.5" />
        <circle className="method-dot gold" cx="152" cy="64" r="3.5" />
        <text className="method-svg-label" x="28" y="111">branch separation decreases</text>
        <text className="method-svg-label gold" x="126" y="18">low-confidence warning zone</text>
        <text className="method-svg-label" x="137" y="78">small curvature</text>
      </svg>
    )
  }

  if (type === 'benchmark') {
    return (
      <svg viewBox="0 0 220 120" role="img">
        <text className="method-svg-label gold" x="28" y="14">small error → pass</text>
        <path className="method-line" d="M24 38 C62 26, 88 52, 116 42 S158 30, 202 42" />
        <path className="method-line dashed" d="M24 41 C62 28, 88 54, 116 44 S158 33, 202 45" />
        <text className="method-svg-label" x="144" y="30">I_SP</text>
        <text className="method-svg-label" x="144" y="54">I_full</text>
        <text className="method-svg-label gold" x="28" y="72">large error → warning</text>
        <path className="method-line muted" d="M24 94 C64 88, 94 72, 128 66 S172 58, 202 38" />
        <path className="method-line muted dashed" d="M24 100 C64 108, 94 102, 128 86 S172 60, 202 58" />
        <text className="method-svg-label" x="120" y="112">E = |I_full - I_SP|</text>
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 220 120" role="img">
      <path className="method-axis" d="M18 92 H202" />
      <path className="method-line" d="M26 84 C62 76, 76 52, 108 52 S156 38, 194 28" />
      {[32, 62, 92, 122, 152, 184].map((x, index) => (
        <circle className="method-dot" cx={x} cy={[82, 70, 58, 52, 40, 30][index]} r="3.5" key={x} />
      ))}
    </svg>
  )
}

function StationaryPhaseDemo() {
  const [selectedX, setSelectedX] = useState(-3)

  const branchPaths = useMemo(() => {
    const samples = 360
    const upper = []
    const middle = []
    const lower = []

    for (let index = 0; index <= samples; index += 1) {
      const x = branchPlot.xMin + ((branchPlot.xMax - branchPlot.xMin) * index) / samples
      const roots = findBranchRoots(x)

      if (roots.length >= 3) {
        lower.push(mapBranchPoint(x, roots[0]))
        middle.push(mapBranchPoint(x, roots[1]))
        upper.push(mapBranchPoint(x, roots[2]))
      } else if (roots.length === 1) {
        upper.push(mapBranchPoint(x, roots[0]))
      }
    }

    const mappedFoldPoint = mapBranchPoint(branchFoldPoint.x, branchFoldPoint.y)
    middle.push(mappedFoldPoint)
    lower.push(mappedFoldPoint)

    return {
      upper: pointsToPath(upper),
      middle: pointsToPath(middle),
      lower: pointsToPath(lower),
      fold: mappedFoldPoint,
    }
  }, [])

  const isFoldSelected = Math.abs(selectedX - branchFoldPoint.x) <= branchFoldTolerance
  const sliceX = isFoldSelected ? branchFoldPoint.x : selectedX
  const selectedRoots = useMemo(() => findBranchRoots(sliceX), [sliceX])
  const selectedLineX = mapBranchPoint(sliceX, 0).x
  const selectedRootMarkers = isFoldSelected
    ? selectedRoots.filter((root) => Math.abs(root - branchFoldPoint.y) > 0.05)
    : selectedRoots
  const rootCountLabel = isFoldSelected
    ? '1 simple real root + 1 double root'
    : selectedRoots.length === 3
      ? '3 real roots'
      : '1 real root'
  const verticalGrid = [-8, -6, -4, -2, 0, 2]
  const horizontalGrid = [-4, -2, 0, 2, 4]

  return (
    <Section
      id="stationary-demo"
      eyebrow="03 / Toy Demo"
      title="Toy Branch Diagram: Multi-Root Structure"
      className="demo-section"
    >
      <div className="branch-demo-panel">
        <div className="branch-demo-copy">
          <span className="card-kicker">Branch tracking intuition</span>
          <h3>Folded solution branches</h3>
          <p>
            This toy model visualizes how the number of real solution branches changes near
            a fold-like region. It is not Cassini data; it is a simplified diagram for
            branch-tracking intuition that complements local radial-window inspection in the
            Data Viewer.
          </p>
          <div className="branch-equation">
            <span>y</span>
            <sup>3</sup>
            <span> + xy = 1</span>
          </div>
          <label className="branch-slider">
            <span>x = {selectedX.toFixed(2)}</span>
            <input
              type="range"
              min={branchPlot.xMin}
              max={branchPlot.xMax}
              step="0.01"
              value={selectedX}
              onChange={(event) => setSelectedX(Number(event.target.value))}
            />
          </label>
          <div className="root-count-pill">{rootCountLabel}</div>
        </div>
        <div className="branch-demo-plot" aria-label="Implicit branch diagram for y cubed plus x y equals one">
          <svg className="branch-svg" viewBox={`0 0 ${branchPlot.width} ${branchPlot.height}`} role="img">
            <title>Implicit branch diagram for y cubed plus x y equals one</title>
            {verticalGrid.map((xValue) => {
              const point = mapBranchPoint(xValue, 0)
              return (
                <line
                  className="branch-grid-line"
                  x1={point.x}
                  x2={point.x}
                  y1={branchPlot.padY}
                  y2={branchPlot.height - branchPlot.padY}
                  key={`x-${xValue}`}
                />
              )
            })}
            {horizontalGrid.map((yValue) => {
              const point = mapBranchPoint(0, yValue)
              return (
                <line
                  className="branch-grid-line"
                  x1={branchPlot.padX}
                  x2={branchPlot.width - branchPlot.padX}
                  y1={point.y}
                  y2={point.y}
                  key={`y-${yValue}`}
                />
              )
            })}
            <line
              className="branch-axis"
              x1={branchPlot.padX}
              x2={branchPlot.width - branchPlot.padX}
              y1={mapBranchPoint(0, 0).y}
              y2={mapBranchPoint(0, 0).y}
            />
            <line
              className="branch-axis"
              x1={mapBranchPoint(0, 0).x}
              x2={mapBranchPoint(0, 0).x}
              y1={branchPlot.padY}
              y2={branchPlot.height - branchPlot.padY}
            />
            <text className="branch-axis-label" x={branchPlot.width - branchPlot.padX + 10} y={mapBranchPoint(0, 0).y - 8}>
              x
            </text>
            <text className="branch-axis-label" x={mapBranchPoint(0, 0).x + 8} y={branchPlot.padY + 14}>
              y
            </text>
            <path className="branch-path branch-upper" d={branchPaths.upper} />
            <path className="branch-path branch-middle" d={branchPaths.middle} />
            <path className="branch-path branch-lower" d={branchPaths.lower} />
            <line
              className="branch-slice-line"
              x1={selectedLineX}
              x2={selectedLineX}
              y1={branchPlot.padY}
              y2={branchPlot.height - branchPlot.padY}
            />
            {selectedRootMarkers.map((root) => {
              const point = mapBranchPoint(sliceX, root)
              return <circle className="branch-root-dot" cx={point.x} cy={point.y} r="4.5" key={root.toFixed(5)} />
            })}
            <circle
              className={`branch-fold-dot${isFoldSelected ? ' active' : ''}`}
              cx={branchPaths.fold.x}
              cy={branchPaths.fold.y}
              r={isFoldSelected ? '5.2' : '4.2'}
            />
            {isFoldSelected && (
              <text className="branch-double-root-label" x={branchPaths.fold.x + 10} y={branchPaths.fold.y - 10}>
                double root
              </text>
            )}
          </svg>
          <p className="branch-plot-caption">
            <span className="research-figure-caption">
              Figure: Toy branch diagram for F(x, y) = y³ + xy − 1 = 0, used with the Formula Library
              to interpret multi-root structure near folds.
            </span>
            <span className="figure-source-note">{FIGURE_SOURCES.schematic}</span>
          </p>
        </div>
      </div>
    </Section>
  )
}

function CassiniDataViewer() {
  const [datasetId, setDatasetId] = useState(cassiniDatasets[0].id)
  const [rows, setRows] = useState([])
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [windowIndex, setWindowIndex] = useState(0)

  const selectedDataset = cassiniDatasets.find((dataset) => dataset.id === datasetId) || cassiniDatasets[0]

  useEffect(() => {
    let isCancelled = false

    async function loadDataset() {
      setIsLoading(true)
      setError('')
      setRows([])
      setWindowIndex(0)

      try {
        const response = await fetch(selectedDataset.file)
        if (!response.ok) {
          throw new Error(
            `Could not load ${selectedDataset.file}. Check that the CSV exists in public/data.`,
          )
        }

        const csvText = await response.text()
        const parsedRows = parseCsvText(csvText).filter((row) =>
          Object.values(row).some((value) => String(value).trim() !== ''),
        )

        if (!parsedRows.length) {
          throw new Error('The selected CSV loaded, but it did not contain any data rows.')
        }

        if (!isCancelled) {
          setRows(parsedRows)
        }
      } catch (loadError) {
        if (!isCancelled) {
          setRows([])
          setError(loadError.message || 'Unable to load the selected Cassini dataset.')
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false)
        }
      }
    }

    loadDataset()
    return () => {
      isCancelled = true
    }
  }, [selectedDataset.file])

  const numericColumns = useMemo(() => detectNumericColumns(rows), [rows])
  const activeXColumn = chooseDefaultColumn(numericColumns, cassiniRadiusAliases, 0)
  const yColumns = useMemo(
    () => numericColumns.filter((column) => column !== activeXColumn),
    [numericColumns, activeXColumn],
  )
  const activeYColumn = chooseYAxisColumn(yColumns)
  const yAxisLabel = /signal_power/i.test(activeYColumn)
    ? 'Normalized Signal Power'
    : 'Normal Optical Depth'
  const observableLabel = /signal_power/i.test(activeYColumn)
    ? 'Normalized signal power'
    : 'Normal optical depth'

  const numericData = useMemo(() => {
    if (!activeXColumn || !activeYColumn) return []

    return rows
      .map((row, index) => ({
        row,
        index,
        x: parseNumericValue(row[activeXColumn]),
        y: parseNumericValue(row[activeYColumn]),
      }))
      .filter(({ x, y }) => x !== null && y !== null)
      .sort((a, b) => a.x - b.x)
  }, [rows, activeXColumn, activeYColumn])

  const { windowSize, windowCount } = useMemo(
    () => chooseSlidingWindowSize(numericData.length),
    [numericData.length],
  )

  const safeWindowIndex = Math.min(windowIndex, Math.max(0, windowCount - 1))
  const windowStart = safeWindowIndex
  const windowEnd = Math.min(numericData.length, windowStart + windowSize)
  const windowData = numericData.slice(windowStart, windowEnd)

  const fullStats = useMemo(() => summarizeSeries(numericData), [numericData])

  const fullExtents = useMemo(() => {
    if (!numericData.length) {
      return { xMin: 0, xMax: 1, yMin: 0, yMax: 1 }
    }
    const yPad = (fullStats.yMax - fullStats.yMin || Math.abs(fullStats.yMax) || 1) * 0.12
    return {
      xMin: fullStats.xMin,
      xMax: fullStats.xMax,
      yMin: fullStats.yMin - yPad,
      yMax: fullStats.yMax + yPad,
    }
  }, [numericData, fullStats])

  const summary = useMemo(() => {
    if (!windowData.length) return null

    const base = summarizeSeries(windowData)
    const yValues = windowData.map((point) => point.y)
    const model = movingAverage(yValues, 2)
    const residuals = yValues.map((value, index) => value - model[index])
    const rms = Math.sqrt(residuals.reduce((sum, value) => sum + value ** 2, 0) / residuals.length)
    const bias = residuals.reduce((sum, value) => sum + value, 0) / residuals.length
    const selectedPoint = windowData.reduce((best, point) =>
      Math.abs(point.y) > Math.abs(best.y) ? point : best,
    )

    return {
      ...base,
      model,
      residuals,
      rms,
      bias,
      selectedPoint,
    }
  }, [windowData])

  const chart = useMemo(() => {
    const width = 1100
    const height = 520
    const padding = { left: 64, right: 24, top: 24, bottom: 48 }
    const innerWidth = width - padding.left - padding.right
    const innerHeight = height - padding.top - padding.bottom
    const xSpan = fullExtents.xMax - fullExtents.xMin || 1
    const ySpan = fullExtents.yMax - fullExtents.yMin || 1

    const mapX = (x) => padding.left + ((x - fullExtents.xMin) / xSpan) * innerWidth
    const mapY = (y) => padding.top + (1 - (y - fullExtents.yMin) / ySpan) * innerHeight

    const allPoints = numericData.map((point) => ({
      ...point,
      svgX: mapX(point.x),
      svgY: mapY(point.y),
    }))

    const path = allPoints.map((point) => `${point.svgX.toFixed(2)},${point.svgY.toFixed(2)}`).join(' ')
    const modelPath =
      summary && windowData.length
        ? windowData
            .map((point, index) => `${mapX(point.x).toFixed(2)},${mapY(summary.model[index]).toFixed(2)}`)
            .join(' ')
        : ''

    const windowLeft = windowData.length ? mapX(windowData[0].x) : padding.left
    const windowRight = windowData.length ? mapX(windowData[windowData.length - 1].x) : padding.left
    const selected =
      summary?.selectedPoint != null
        ? {
            svgX: mapX(summary.selectedPoint.x),
            svgY: mapY(summary.selectedPoint.y),
            ...summary.selectedPoint,
          }
        : null

    const xTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => fullExtents.xMin + t * xSpan)
    const yTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => fullExtents.yMin + t * ySpan)

    return {
      width,
      height,
      padding,
      path,
      modelPath,
      allPoints,
      windowLeft,
      windowRight,
      selected,
      xTicks,
      yTicks,
      mapX,
      mapY,
    }
  }, [numericData, windowData, fullExtents, summary])

  const overviewChart = useMemo(() => {
    if (!numericData.length) return null

    const width = 1100
    const height = 80
    const padding = { left: 64, right: 24, top: 12, bottom: 12 }
    const innerWidth = width - padding.left - padding.right
    const innerHeight = height - padding.top - padding.bottom
    const xSpan = fullExtents.xMax - fullExtents.xMin || 1
    const ySpan = fullExtents.yMax - fullExtents.yMin || 1

    const mapX = (x) => padding.left + ((x - fullExtents.xMin) / xSpan) * innerWidth
    const mapY = (y) => padding.top + (1 - (y - fullExtents.yMin) / ySpan) * innerHeight

    const path = numericData
      .map((point) => `${mapX(point.x).toFixed(2)},${mapY(point.y).toFixed(2)}`)
      .join(' ')

    const windowLeft = windowData.length ? mapX(windowData[0].x) : padding.left
    const windowRight = windowData.length
      ? mapX(windowData[windowData.length - 1].x)
      : padding.left

    return {
      width,
      height,
      padding,
      path,
      windowLeft,
      windowRight,
    }
  }, [numericData, windowData, fullExtents])

  const residualChart = useMemo(() => {
    if (!summary || !windowData.length) return null

    const width = 420
    const height = 150
    const padding = { left: 42, right: 14, top: 18, bottom: 28 }
    const innerWidth = width - padding.left - padding.right
    const innerHeight = height - padding.top - padding.bottom
    const xMin = windowData[0].x
    const xMax = windowData[windowData.length - 1].x
    const residualExtent = Math.max(...summary.residuals.map((value) => Math.abs(value)), 1e-6)
    const xSpan = xMax - xMin || 1

    const points = windowData.map((point, index) => {
      const residual = summary.residuals[index]
      return {
        svgX: padding.left + ((point.x - xMin) / xSpan) * innerWidth,
        svgY: padding.top + (1 - (residual + residualExtent) / (2 * residualExtent)) * innerHeight,
        residual,
      }
    })

    return {
      width,
      height,
      padding,
      path: points.map((point) => `${point.svgX.toFixed(2)},${point.svgY.toFixed(2)}`).join(' '),
      zeroY: padding.top + innerHeight / 2,
      points,
      residualExtent,
      xMin,
      xMax,
    }
  }, [summary, windowData])

  function downloadSelectedWindow() {
    if (!windowData.length) return

    const radiusMin = Math.round(summary?.xMin ?? windowData[0].x)
    const radiusMax = Math.round(summary?.xMax ?? windowData[windowData.length - 1].x)
    const csv = rowsToCsv(windowData.map((point) => point.row))
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `cassini_${selectedDataset.id}_window_${radiusMin}_${radiusMax}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const fileName = selectedDataset.file.split('/').pop()
  const radiusRangeLabel = fullStats
    ? `${formatStat(fullStats.xMin)} – ${formatStat(fullStats.xMax)} km`
    : '—'
  const windowCenter =
    summary != null ? (summary.xMin + summary.xMax) / 2 : null
  const windowWidthKm =
    summary != null ? summary.xMax - summary.xMin : null

  const leftMetadata = [
    { label: 'Mission', value: 'Cassini' },
    { label: 'Instrument', value: 'RSS Radio Science Subsystem' },
    { label: 'Observable', value: observableLabel },
    { label: 'Rev', value: selectedDataset.rev },
    { label: 'Event ID', value: selectedDataset.productId },
    { label: 'Band', value: selectedDataset.band },
    { label: 'Product', value: selectedDataset.resolution },
    { label: 'File name', value: fileName },
    { label: 'Radius range', value: radiusRangeLabel },
    { label: 'Point count', value: String(numericData.length || '—') },
    { label: 'Y-axis variable', value: activeYColumn || '—' },
  ]

  const localWindowInfo = summary
    ? [
        { label: 'Center radius', value: `${formatStat(windowCenter)} km` },
        { label: 'Window width', value: `${formatStat(windowWidthKm)} km` },
        { label: 'Inner radius', value: `${formatStat(summary.xMin)} km` },
        { label: 'Outer radius', value: `${formatStat(summary.xMax)} km` },
      ]
    : []

  const fullStatCards = fullStats
    ? [
        { label: 'Full points', value: fullStats.count },
        { label: 'Radius min / max', value: `${formatStat(fullStats.xMin)} / ${formatStat(fullStats.xMax)}` },
        { label: 'Y min / max', value: `${formatStat(fullStats.yMin)} / ${formatStat(fullStats.yMax)}` },
        { label: 'Mean', value: formatStat(fullStats.yMean) },
        { label: 'Median', value: formatStat(fullStats.yMedian) },
        { label: 'Std. dev.', value: formatStat(fullStats.yStd) },
        { label: 'Peak count', value: fullStats.peakCount },
      ]
    : []

  const windowStatCards = summary
    ? [
        { label: 'Window points', value: summary.count },
        { label: 'Window radius', value: `${formatStat(summary.xMin)} – ${formatStat(summary.xMax)}` },
        { label: 'Window Y min / max', value: `${formatStat(summary.yMin)} / ${formatStat(summary.yMax)}` },
        { label: 'Mean', value: formatStat(summary.yMean) },
        { label: 'Median', value: formatStat(summary.yMedian) },
        { label: 'Std. dev.', value: formatStat(summary.yStd) },
        { label: 'Peak count', value: summary.peakCount },
        { label: 'RMS residual', value: formatStat(summary.rms) },
      ]
    : []

  const statusLabel = error ? 'Load error' : isLoading ? 'Loading…' : 'Data loaded'
  const statusTone = error ? 'error' : isLoading ? 'loading' : 'ready'

  return (
    <div className="data-viewer dv-dashboard">
      <header className="dv-dash-header">
        <div className="dv-dash-header-copy">
          <p className="dv-dash-kicker">Scientific analysis panel</p>
          <h3>Cassini RSS Data Viewer</h3>
          <p className="dv-dash-subtitle">Radio occultation optical-depth profiles</p>
        </div>
        <div className="dv-dash-header-controls">
          <span className={`dv-status-pill tone-${statusTone}`}>{statusLabel}</span>
          <span className="dv-source-tag">NASA PDS / CORSS_8001</span>
          <label className="dv-dataset-selector">
            <span>Dataset</span>
            <select
              value={selectedDataset.id}
              onChange={(event) => setDatasetId(event.target.value)}
              aria-label="Select Cassini dataset"
            >
              {cassiniDatasets.map((dataset) => (
                <option value={dataset.id} key={dataset.id}>
                  {dataset.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </header>

      <div className="dv-dash-body">
        <aside className="dv-col dv-col-left">
          <section className="dv-panel dv-panel-meta">
            <h4>Dataset metadata</h4>
            <dl className="dv-meta-list">
              {leftMetadata.map((item) => (
                <div className="dv-meta-row" key={item.label}>
                  <dt>{item.label}</dt>
                  <dd>{item.value}</dd>
                </div>
              ))}
            </dl>
            <div className="dv-meta-divider" />
            <h4>Ring region</h4>
            <dl className="dv-meta-list">
              <div className="dv-meta-row">
                <dt>Radial coverage</dt>
                <dd>{radiusRangeLabel}</dd>
              </div>
              <div className="dv-meta-row">
                <dt>Sampling product</dt>
                <dd>{selectedDataset.resolution}</dd>
              </div>
              <div className="dv-meta-row">
                <dt>Profile points</dt>
                <dd>{numericData.length || '—'}</dd>
              </div>
            </dl>
          </section>

          <section className="dv-panel dv-guide-panel">
            <h4>Guided activity</h4>
            <ol className="mini-investigation-steps">
              {miniInvestigationSteps.map((step, index) => (
                <li key={step}>
                  <span className="mini-investigation-number" aria-hidden="true">
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </section>
        </aside>

        <div className="dv-col dv-col-center">
          {error && <div className="viewer-message">{error}</div>}
          {!error && !isLoading && !activeXColumn && (
            <div className="viewer-message">Could not infer a ring-radius column from the CSV.</div>
          )}
          {!error && !isLoading && activeXColumn && !activeYColumn && (
            <div className="viewer-message">
              Could not infer an optical-depth or signal-power column from the CSV.
            </div>
          )}

          <section className="dv-panel dv-controls-panel">
            <div className="dv-chart-toolbar">
              <span>
                <strong>Y Axis</strong> {yAxisLabel}
              </span>
              <span>
                <strong>Smoothing</strong> Moving Average
              </span>
              <span>
                <strong>Window</strong> {safeWindowIndex + 1} / {Math.max(windowCount, 1)}
              </span>
              <span>
                <strong>Model Fit</strong> On
              </span>
            </div>
            <div className="dv-window-controls-row">
              <label className="dv-slider-label" htmlFor="dv-window-slider">
                Window index {safeWindowIndex + 1} / {Math.max(windowCount, 1)} · {windowSize} pts ·{' '}
                {formatStat(summary?.xMin)} – {formatStat(summary?.xMax)} km
              </label>
              <div className="dv-window-controls-inputs">
                <input
                  id="dv-window-slider"
                  className="dv-slider"
                  type="range"
                  min={0}
                  max={Math.max(windowCount - 1, 0)}
                  step={1}
                  value={safeWindowIndex}
                  onChange={(event) => setWindowIndex(Number(event.target.value))}
                  disabled={windowCount <= 1 || isLoading}
                />
                <select
                  className="dv-window-select"
                  value={safeWindowIndex}
                  onChange={(event) => setWindowIndex(Number(event.target.value))}
                  disabled={windowCount <= 1 || isLoading}
                  aria-label="Select radial window"
                >
                  {Array.from({ length: windowCount }, (_, index) => (
                    <option value={index} key={index}>
                      Window {index + 1}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          <section className="dv-panel dv-plot-card">
            {isLoading ? (
              <div className="viewer-placeholder">Loading {selectedDataset.rev} CSV data…</div>
            ) : (
              <svg
                className="data-svg dv-main-svg"
                viewBox={`0 0 ${chart.width} ${chart.height}`}
                role="img"
                aria-label={`Local radial window chart for ${selectedDataset.label}`}
              >
                <title>Local Radial Window — {selectedDataset.rev}</title>
                <rect
                  className="dv-chart-bg"
                  x={chart.padding.left}
                  y={chart.padding.top}
                  width={chart.width - chart.padding.left - chart.padding.right}
                  height={chart.height - chart.padding.top - chart.padding.bottom}
                />
                {chart.xTicks.map((tick) => (
                  <line
                    key={`vx-${tick}`}
                    className="data-grid-line"
                    x1={chart.mapX(tick)}
                    x2={chart.mapX(tick)}
                    y1={chart.padding.top}
                    y2={chart.height - chart.padding.bottom}
                  />
                ))}
                {chart.yTicks.map((tick) => (
                  <line
                    key={`hy-${tick}`}
                    className="data-grid-line"
                    x1={chart.padding.left}
                    x2={chart.width - chart.padding.right}
                    y1={chart.mapY(tick)}
                    y2={chart.mapY(tick)}
                  />
                ))}
                {windowData.length > 0 && (
                  <rect
                    className="dv-window-shade"
                    x={Math.min(chart.windowLeft, chart.windowRight)}
                    y={chart.padding.top}
                    width={Math.max(2, Math.abs(chart.windowRight - chart.windowLeft))}
                    height={chart.height - chart.padding.top - chart.padding.bottom}
                  />
                )}
                <path
                  className="data-axis"
                  d={`M${chart.padding.left} ${chart.padding.top} V${chart.height - chart.padding.bottom} H${chart.width - chart.padding.right}`}
                />
                {chart.path && <polyline className="data-line" points={chart.path} />}
                {chart.modelPath && <polyline className="dv-model-line" points={chart.modelPath} />}
                {chart.selected && (
                  <g>
                    <circle className="dv-selected-halo" cx={chart.selected.svgX} cy={chart.selected.svgY} r="9" />
                    <circle className="dv-selected-point" cx={chart.selected.svgX} cy={chart.selected.svgY} r="4.5" />
                  </g>
                )}
                <text className="data-axis-label" x={chart.width / 2} y={chart.height - 12} textAnchor="middle">
                  Ring Radius (km)
                </text>
                <text
                  className="data-axis-label"
                  x={16}
                  y={chart.height / 2}
                  textAnchor="middle"
                  transform={`rotate(-90 16 ${chart.height / 2})`}
                >
                  {yAxisLabel}
                </text>
                <text className="data-tick" x={chart.padding.left} y={chart.height - 28}>
                  {formatStat(fullExtents.xMin)}
                </text>
                <text
                  className="data-tick end"
                  x={chart.width - chart.padding.right}
                  y={chart.height - 28}
                  textAnchor="end"
                >
                  {formatStat(fullExtents.xMax)}
                </text>
                <text className="data-tick" x={10} y={chart.height - chart.padding.bottom}>
                  {formatStat(fullExtents.yMin)}
                </text>
                <text className="data-tick" x={10} y={chart.padding.top + 4}>
                  {formatStat(fullExtents.yMax)}
                </text>
              </svg>
            )}

            {overviewChart && !isLoading && (
              <div className="dv-overview-wrap">
                <div className="dv-overview-label">Profile overview</div>
                <svg
                  className="dv-overview-svg"
                  viewBox={`0 0 ${overviewChart.width} ${overviewChart.height}`}
                  role="img"
                  aria-label="Compressed full-profile overview with selected window highlight"
                >
                  <title>Full profile overview</title>
                  {overviewChart.path && (
                    <polyline className="dv-overview-line" points={overviewChart.path} />
                  )}
                  {windowData.length > 0 && (
                    <rect
                      className="dv-overview-window"
                      x={Math.min(overviewChart.windowLeft, overviewChart.windowRight)}
                      y={overviewChart.padding.top}
                      width={Math.max(2, Math.abs(overviewChart.windowRight - overviewChart.windowLeft))}
                      height={
                        overviewChart.height - overviewChart.padding.top - overviewChart.padding.bottom
                      }
                    />
                  )}
                </svg>
              </div>
            )}

            <div className="dv-plot-notes">
              <p className="dv-figure-caption">
                Figure: {selectedDataset.rev} ({selectedDataset.band}) local radial window of{' '}
                {activeYColumn || 'y'} versus ring radius. Shaded band = selected window; gold dashed
                curve = moving-average model.
              </p>
              <p className="figure-source-note dv-source-note">{FIGURE_SOURCES.csv}</p>
              <p className="dv-unit-note">
                Radii are kilometers from Saturn’s center. Optical depth is dimensionless. Local CSV
                files are educational copies derived from public PDS TAB products. This tool does not
                claim a finished reconstruction.
              </p>
            </div>
          </section>
        </div>

        <aside className="dv-col dv-col-right">
          <section className="dv-panel dv-panel-stats">
            <h4>Local radial window</h4>
            <dl className="dv-meta-list dv-meta-compact">
              {localWindowInfo.map((item) => (
                <div className="dv-meta-row" key={item.label}>
                  <dt>{item.label}</dt>
                  <dd>{item.value}</dd>
                </div>
              ))}
              {!localWindowInfo.length && (
                <div className="dv-meta-row">
                  <dt>Status</dt>
                  <dd>—</dd>
                </div>
              )}
            </dl>

            {fullStatCards.length > 0 && (
              <>
                <div className="dv-meta-divider" />
                <h4>Full dataset statistics</h4>
                <div className="dv-stat-grid">
                  {fullStatCards.map((card) => (
                    <div key={card.label}>
                      <span>{card.label}</span>
                      <strong>{card.value}</strong>
                    </div>
                  ))}
                </div>
              </>
            )}

            {windowStatCards.length > 0 && (
              <>
                <div className="dv-meta-divider" />
                <h4>Selected window statistics</h4>
                <div className="dv-stat-grid">
                  {windowStatCards.map((card) => (
                    <div key={card.label}>
                      <span>{card.label}</span>
                      <strong>{card.value}</strong>
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>

          {residualChart && (
            <section className="dv-panel dv-residual-card">
              <h4>Residuals</h4>
              <div className="dv-residual-summary">
                <div>
                  <span>RMS</span>
                  <strong>{formatStat(summary?.rms)}</strong>
                </div>
                <div>
                  <span>Bias</span>
                  <strong>{formatStat(summary?.bias)}</strong>
                </div>
              </div>
              <svg
                className="data-svg dv-residual-svg"
                viewBox={`0 0 ${residualChart.width} ${residualChart.height}`}
                role="img"
                aria-label="Residual chart for observed minus moving-average model"
              >
                <title>Residual: observed − moving average</title>
                <line
                  className="dv-zero-line"
                  x1={residualChart.padding.left}
                  x2={residualChart.width - residualChart.padding.right}
                  y1={residualChart.zeroY}
                  y2={residualChart.zeroY}
                />
                <polyline className="dv-residual-line" points={residualChart.path} />
                <text className="data-tick" x={residualChart.padding.left} y={residualChart.height - 8}>
                  {formatStat(residualChart.xMin)}
                </text>
                <text
                  className="data-tick end"
                  x={residualChart.width - residualChart.padding.right}
                  y={residualChart.height - 8}
                  textAnchor="end"
                >
                  {formatStat(residualChart.xMax)}
                </text>
              </svg>
              <p className="dv-figure-caption">
                Residual of moving-average model on the selected window (observed − model).
              </p>
            </section>
          )}

          <section className="dv-panel dv-export-panel">
            <h4>Export</h4>
            <button
              className="download-window"
              type="button"
              onClick={downloadSelectedWindow}
              disabled={!windowData.length}
            >
              Export Local Window CSV
            </button>
            <p className="download-helper">
              Exports only the currently selected radial window ({windowData.length} rows) from{' '}
              {selectedDataset.rev}.
            </p>
          </section>
        </aside>
      </div>
    </div>
  )
}

function App() {
  const location = useLocation()
  const navigate = useNavigate()
  const normalizedPath =
    location.pathname.length > 1 ? location.pathname.replace(/\/+$/, '') : location.pathname
  const methodPathMatch = normalizedPath.match(/^\/algorithms\/([^/]+)$/)
  const activeMethodSlug = methodPathMatch ? decodeURIComponent(methodPathMatch[1]) : ''
  const activePanel = methodPathMatch ? 'algorithms' : ROUTE_PANELS[normalizedPath]
  const [selectedPipelineIndex, setSelectedPipelineIndex] = useState(0)
  const [selectedMemberIndex, setSelectedMemberIndex] = useState(0)
  const [saturnModelPath, setSaturnModelPath] = useState('')
  const isSaturnModelOpen = saturnModelPath === normalizedPath
  const [worksheetCopied, setWorksheetCopied] = useState(false)
  const selectedPipelineStep = pipelineSteps[selectedPipelineIndex]
  const selectedMember = teamMembers[selectedMemberIndex]
  const selectedMethod = numericalMethodsToolkit.find((method) => getMethodSlug(method.name) === activeMethodSlug)
  const baseSeo = ROUTE_SEO[methodPathMatch ? '/algorithms' : normalizedPath] || ROUTE_SEO['/']
  const seo = selectedMethod
    ? {
        title: `${selectedMethod.name} | Saturn Rings Reconstruction Lab`,
        description: `${selectedMethod.does} Explore this numerical method in the Saturn Rings Reconstruction Lab.`,
      }
    : baseSeo
  const canonicalPath = activePanel ? normalizedPath : '/'
  const canonicalUrl = `${SITE_URL}${canonicalPath}`
  const learningResourceStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'LearningResource',
    name: 'Saturn Rings Reconstruction Lab',
    url: `${SITE_URL}/`,
    description: DEFAULT_DESCRIPTION,
    educationalUse: 'Instruction and independent study',
    learningResourceType: 'Interactive research lab',
    about: [
      'Saturn rings',
      'Cassini radio occultation',
      'Inverse problems',
      'Applied mathematics',
    ],
  }

  useEffect(() => {
    if (!activePanel) {
      navigate('/', { replace: true })
      return
    }

    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [activePanel, navigate, normalizedPath])

  async function copyWorksheet() {
    try {
      await navigator.clipboard.writeText(buildWorksheetText())
      setWorksheetCopied(true)
      window.setTimeout(() => setWorksheetCopied(false), 2200)
    } catch {
      setWorksheetCopied(false)
    }
  }

  function PanelShell({ children }) {
    const relatedPage = RELATED_PAGES[activePanel]

    return (
      <div className="portal-panel-wrap">
        <Link className="back-button" to="/">
          ← Back to Main Menu
        </Link>
        {children}
        {relatedPage && (
          <nav className="related-page-nav" aria-label="Related page">
            <Link to={relatedPage.to}>{relatedPage.label} →</Link>
          </nav>
        )}
      </div>
    )
  }

  function renderMenu() {
    return (
      <div className="home-academic">
        <section className="section home-hero home-hero-mission tone-hero">
          <div className="home-hero-copy">
            <p className="eyebrow eyebrow-gold">Research Module</p>
            <p className="hero-program-line">MIT PRIMES Math Junior</p>
            <h1>Saturn Rings Reconstruction Lab</h1>
            <p className="hero-subtitle">
              Radio occultation, inverse problems, and applied mathematics through Saturn’s rings.
            </p>
            <p className="hero-lede">
              Cassini’s radio signal through the rings is an indirect measurement, not a photograph.
              This lab moves from that observation to public data, a local viewer, modeling ideas,
              and a short student worksheet.
            </p>
            <div className="hero-actions">
              <Link className="button primary" to="/start-here">
                Start Here
              </Link>
              <Link className="button secondary" to="/viewer">
                Explore the Data
              </Link>
              <Link className="button secondary" to="/worksheet">
                Use the Worksheet
              </Link>
            </div>
          </div>
          <HeroImageCard onOpenModel={() => setSaturnModelPath(normalizedPath)} />
        </section>

        <section className="section home-value-section tone-why" aria-label="Why this site">
          <div className="home-value-panel tone-callout">
            <div className="home-value-panel-copy">
              <p className="eyebrow eyebrow-navy">Why This Site</p>
              <h2>A Saturn rings case study for learning research mathematics</h2>
              <p>
                Built from a MIT PRIMES Math Junior project, the site is a reusable learning template:
                students move from curiosity and mission background, to public data and local plots,
                then to modeling questions they can write about and revise.
              </p>
              <p>
                The lab connects Saturn’s rings and Cassini mission radio-occultation data with the
                NASA Planetary Data System, optical-depth profiles, inverse problems, applied
                mathematics, and stationary-phase ideas. Interactive student research tools make
                those concepts visible without replacing the official scientific archives.
              </p>
            </div>
            <aside className="home-value-aside" aria-label="Homepage learning path">
              <p className="home-value-aside-label">Homepage path</p>
              <ol className="home-value-aside-list">
                <li>Observe Saturn ring occultation</li>
                <li>Inspect public Cassini samples</li>
                <li>Connect math to a research question</li>
              </ol>
            </aside>
          </div>
        </section>

        <section className="section home-features-section tone-snapshot" aria-label="Research snapshot cards">
          <div className="section-heading">
            <p className="eyebrow eyebrow-gold">Research Snapshot</p>
            <h2>What you can explore</h2>
            <p className="section-lede">
              Three entry points into the case study: the scientific setting, interactive tools, and
              the student learning path.
            </p>
          </div>
          <div className="home-feature-grid">
            {homeFeatureCards.map((card) => (
              <article className={`home-feature-card tone-${card.tone}`} key={card.title}>
                <HomeFigureMedia
                  figure={card.figure}
                  image={card.image}
                  imageAlt={card.imageAlt}
                  caption={card.caption}
                  source={card.source}
                  fit={card.fit}
                />
                <div className="home-feature-copy">
                  <span className="home-card-label">{card.label}</span>
                  <h3>{card.title}</h3>
                  <p>{card.text}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="section home-tools-section tone-tools" aria-label="Interactive tools preview">
          <div className="section-heading">
            <p className="eyebrow eyebrow-blue">Interactive Tools</p>
            <h2>Tools used in the case study</h2>
            <p className="section-lede">
              Use the Data Viewer for local Cassini windows, then the toy branch diagram for
              multi-root intuition behind reconstruction experiments.
            </p>
          </div>
          <div className="home-tools-grid">
            {homeToolPreviewCards.map((card) => (
              <article className={`home-tool-card tone-${card.tone}`} key={card.title}>
                <figure className="home-tool-figure">
                  <div className={`home-tool-preview tone-${card.tone} media-diagram`}>
                    <ToolPreviewVisual figure={card.figure} />
                  </div>
                  <figcaption className="home-figure-caption">
                    <FigureCaption as="div" caption={card.caption} source={card.source} />
                  </figcaption>
                </figure>
                <div className="home-tool-copy">
                  <h3>{card.title}</h3>
                  <p>{card.text}</p>
                  <Link
                    className="home-tool-link"
                    to={PANEL_ROUTES[card.panelId]}
                  >
                    Open tool
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="section home-pipeline-section tone-pipeline" aria-label="Research pipeline">
          <div className="section-heading">
            <p className="eyebrow eyebrow-gold">Research Pipeline</p>
            <h2>From occultation data to student learning path</h2>
            <p className="section-lede">
              Physical observation → public Cassini data → local data viewer → mathematical model →
              student worksheet → research question.
            </p>
          </div>
          <figure className="home-pipeline-figure">
            <ol className="home-pipeline">
              {homePipelineSteps.map((step, index) => (
                <li className="home-pipeline-step" key={step.label}>
                  <span className="home-pipeline-index" aria-hidden="true">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className={`home-pipeline-label tone-${step.tone}`}>{step.label}</span>
                  {index < homePipelineSteps.length - 1 && (
                    <span className="home-pipeline-arrow" aria-hidden="true">
                      →
                    </span>
                  )}
                </li>
              ))}
            </ol>
            <figcaption>
              <FigureCaption
                as="div"
                caption="Figure: Observation and public data feed a mathematical model; local viewing and the worksheet then support a written research question."
                source={FIGURE_SOURCES.schematic}
              />
            </figcaption>
          </figure>
        </section>

        <section className="section home-audience-section tone-audience" aria-label="Who this is for">
          <div className="section-heading">
            <p className="eyebrow eyebrow-sage">Audience</p>
            <h2>Who this is for</h2>
            <p className="section-lede">
              Designed for high school learners and mentors who want a concrete applied-math case
              study with public data and guided practice.
            </p>
          </div>
          <div className="home-audience-grid">
            {homeAudienceCards.map((card) => (
              <article className={`home-audience-card tone-${card.tone}`} key={card.title}>
                <h3>{card.title}</h3>
                <p>{card.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section home-modules-section tone-nav" aria-label="Site modules">
          <div className="section-heading">
            <p className="eyebrow eyebrow-navy">Secondary Navigation</p>
            <h2>Explore the full research lab</h2>
            <p className="section-lede home-modules-lede">
              After the overview, open a focused page—math, viewer, worksheet, archives, or team
              notes—without leaving the research narrative.
            </p>
          </div>
          <div className="home-module-grid">
            {homeModuleCards.map((item) => (
              <Link
                className={`home-module-card tone-${item.category}`}
                key={item.id}
                to={PANEL_ROUTES[item.id]}
              >
                <span className="home-module-label">{item.categoryLabel}</span>
                <strong>{item.title}</strong>
                <span>{item.description}</span>
              </Link>
            ))}
          </div>
          <div className="home-secondary-links">
            <span className="home-secondary-label">Additional research pages</span>
            <div className="home-secondary-link-row">
              {secondaryModuleLinks.map((item) => (
                <Link
                  key={item.id}
                  className="home-secondary-link"
                  to={PANEL_ROUTES[item.id]}
                >
                  {item.title}
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="section home-updates-section tone-updates" aria-label="Project updates">
          <div className="section-heading">
            <p className="eyebrow eyebrow-gold">Updates</p>
            <h2>Project Updates</h2>
            <p className="section-lede">
              Status notes for completed work, current classroom testing, and planned feedback
              pilots.
            </p>
          </div>
          <div className="home-updates-grid">
            {projectUpdateCards.map((card) => (
              <article className={`home-update-card status-${card.statusTone}`} key={card.title}>
                <span className="home-update-status">{card.status}</span>
                <h3>{card.title}</h3>
                <p>{card.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section home-credits-section" aria-labelledby="sources-credits-title">
          <div className="section-heading">
            <p className="eyebrow eyebrow-navy">Sources &amp; Credits</p>
            <h2 id="sources-credits-title">Public data and educational use</h2>
          </div>
          <p>
            Cassini Radio Science Subsystem (RSS) data shown here are educational local copies
            derived from public NASA Planetary Data System products. This is an educational
            research website; unpublished PRIMES data are not displayed. Website-generated
            schematics and diagrams are labeled as author-generated or AI-assisted educational
            graphics, while NASA and JPL imagery retains its source credit.
          </p>
        </section>
      </div>
    )
  }

  function renderImpactFeedback() {
    return (
      <PanelShell>
        <Section id="impact" eyebrow="Public Learning Module" title="Impact & Feedback" tone="impact">
          <div className="impact-intro">
            <p>
              This site is being developed as a public learning module for high school students
              interested in applied mathematics, inverse problems, scientific computing, and
              research. The project uses Saturn ring radio occultation as a concrete case study to
              help students see how real research moves from physical observation to mathematical
              modeling, numerical diagnostics, and visualization.
            </p>
          </div>

          <div className="impact-section portal-spaced">
            <div className="impact-section-heading">
              <h3>Who this helps</h3>
            </div>
            <div className="impact-audience-grid">
              {whoThisHelps.map((item) => (
                <article className="impact-audience-card" key={item}>
                  <p>{item}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="impact-section portal-spaced">
            <div className="impact-section-heading">
              <h3>Impact Metrics</h3>
            </div>
            <div className="impact-metrics-grid">
              {impactMetrics.map((metric) => (
                <article className="impact-metric-card" key={metric.label}>
                  <span className="impact-metric-value">{metric.value}</span>
                  <p className="impact-metric-label">{metric.label}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="impact-feedback-panel portal-spaced">
            <div className="impact-section-heading">
              <h3>Feedback Survey</h3>
            </div>
            <p>
              A feedback form will be added here for students to report what became clearer, what
              remained confusing, and whether the site increased their interest in applied
              mathematics or scientific computing.
            </p>
            <button className="button primary impact-feedback-button" type="button" disabled>
              Open Feedback Form
            </button>
          </div>
        </Section>
      </PanelShell>
    )
  }

  function renderHowToStartResearch() {
    return (
      <PanelShell>
        <Section
          id="how-to-start-research"
          eyebrow="Research Template"
          title="How to Start Research from Interest"
          tone="learning"
        >
          <div className="research-roadmap-intro">
            <p className="research-roadmap-subtitle">
              A case-based roadmap for turning curiosity into a research question, including an
              AI-assisted workflow for mapping papers and verifying sources.
            </p>
            <p className="research-roadmap-note">
              This website uses Saturn ring radio occultation as one example. The same
              structure can be adapted to other fields, such as biology, economics, climate
              science, or machine learning.
            </p>
          </div>

          <div className="research-section-block">
            <div className="research-section-heading">
              <h3>From interest to research question</h3>
              <p>Use this general roadmap to move from curiosity toward a testable question.</p>
            </div>
            <div className="research-roadmap-grid">
              {researchRoadmapSteps.map((step, index) => (
                <article className="research-roadmap-card" key={step.title}>
                  <span className="research-roadmap-number" aria-hidden="true">
                    {index + 1}
                  </span>
                  <div className="research-roadmap-copy">
                    <h3>{step.title}</h3>
                    <p>{step.detail}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="research-section-block portal-spaced">
            <div className="research-section-heading">
              <h3>Using AI to enter a research field</h3>
              <p>
                How to use AI to map literature, extract expert thinking, and generate learning
                questions.
              </p>
            </div>
            <p className="ai-workflow-warning">
              AI should guide reading and questioning, not fabricate results, citations, data, or
              professor responses.
            </p>
            <div className="ai-workflow-grid">
              {aiWorkflowSteps.map((step) => (
                <article className="ai-workflow-card" key={step.letter}>
                  <span className="ai-workflow-letter" aria-hidden="true">
                    {step.letter}
                  </span>
                  <div className="ai-workflow-copy">
                    <h3>{step.title}</h3>
                    {step.isPrompt ? (
                      <>
                        <span className="ai-workflow-prompt-label">Prompt example</span>
                        <p className="ai-workflow-prompt">“{step.detail}”</p>
                      </>
                    ) : (
                      <p>{step.detail}</p>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </Section>
      </PanelShell>
    )
  }

  function renderDataHub() {
    return (
      <PanelShell>
        <Section id="data-hub" eyebrow="Official Archives" title="Data Hub" tone="data">
          <figure className="panel-lead-figure research-figure">
            <img
              className="figure-fit-contain"
              src="/images/vims-grain-size.jpeg"
              alt="Cassini VIMS grain-size context for Saturn’s rings"
            />
            <figcaption>
              <FigureCaption
                as="div"
                caption="Figure: Cassini VIMS grain-size context for ring particles."
                source={FIGURE_SOURCES.scientificViz}
              />
            </figcaption>
          </figure>
          <div className="data-hub-intro">
            <p className="data-hub-subtitle">
              Official data sources for Saturn rings, Cassini occultations, and related research.
            </p>
            <p className="data-hub-lede">
              This website hosts five educational RSS local-window samples in the Data Viewer. Many
              official Cassini products are large and should be accessed through NASA/PDS archives.
              Use this page to move from the local samples to responsible archive browsing.
            </p>
            <p className="data-hub-note">
              Beginner path: JPL explanation → Rings Science Overview → Viewer samples. Advanced
              path: RSS node → UVIS/VIMS comparison → document exact product IDs.
            </p>
          </div>
          <div className="data-hub-grid">
            {dataHubSources.map((source) => (
              <article className="data-hub-card" key={source.title}>
                <div className="data-hub-card-header">
                  <h3>{source.title}</h3>
                  <span className="data-hub-level">{source.level}</span>
                </div>
                <div className="data-hub-fields">
                  <div>
                    <span className="data-hub-label">What it contains</span>
                    <p>{source.contains}</p>
                  </div>
                  <div>
                    <span className="data-hub-label">Why it matters</span>
                    <p>{source.matters}</p>
                  </div>
                  <div>
                    <span className="data-hub-label">Beginner note</span>
                    <p>{source.beginnerNote}</p>
                  </div>
                  <div>
                    <span className="data-hub-label">Advanced note</span>
                    <p>{source.advancedNote}</p>
                  </div>
                  <div>
                    <span className="data-hub-label">Official source link</span>
                    <p className="data-hub-source-url">{source.href}</p>
                  </div>
                </div>
                <div className="data-hub-link-field">
                  <a
                    className="button secondary data-hub-link-button"
                    href={source.href}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {source.buttonLabel}
                  </a>
                </div>
              </article>
            ))}
          </div>
        </Section>
      </PanelShell>
    )
  }

  function renderStudentWorksheet() {
    return (
      <PanelShell>
        <Section id="worksheet" eyebrow="Learning Activity" title="Student Mini-Lab Worksheet" tone="learning">
          <figure className="panel-lead-figure research-figure worksheet-lead-schematic">
            <SchematicWorksheetFigure />
            <figcaption>
              <FigureCaption
                as="div"
                caption="Figure: Mini-lab pathway from observation and measurement to modeling, a written research question, and a mentor follow-up."
                source={FIGURE_SOURCES.schematic}
              />
            </figcaption>
          </figure>
          <div className="worksheet-intro">
            <p className="worksheet-subtitle">
              A structured mini-lab for students exploring radio occultation, inverse problems, and
              Saturn ring reconstruction with the Data Viewer and Mathematical Framework.
            </p>
            <p className="worksheet-note">
              Work section by section. Use one Cassini RSS sample in the Viewer while answering
              Observe and Measure. Return to Math for Model. Data note: Viewer files are educational
              extracts; official archives are listed in the Data Hub.
            </p>
            <button
              className="button secondary copy-worksheet-button"
              type="button"
              onClick={copyWorksheet}
            >
              {worksheetCopied ? 'Copied!' : 'Copy Worksheet'}
            </button>
          </div>
          <div className="worksheet-sections">
            {studentWorksheetSections.map((section) => (
              <section className="worksheet-section-card" key={section.id}>
                <div className="worksheet-section-heading">
                  <p className="eyebrow eyebrow-sage">Mini-lab section</p>
                  <h3>{section.title}</h3>
                  <p>{section.prompt}</p>
                </div>
                <div className="worksheet-grid">
                  {section.questions.map((question, index) => (
                    <article className="worksheet-question-card" key={`${section.id}-${question}`}>
                      <span className="worksheet-question-number" aria-hidden="true">
                        {index + 1}
                      </span>
                      <p className="worksheet-question-text">{question}</p>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </Section>
      </PanelShell>
    )
  }

  function renderStartHere() {
    return (
      <PanelShell>
        <Section id="start-here" eyebrow="Welcome / Start Here" title="Start Here: An Applied Math Research Case Study" tone="learning">
          <figure className="start-here-banner research-figure">
            <img
              className="figure-fit-cover"
              src="/images/cassini-occultation.jpg"
              alt="Cassini radio occultation research context"
            />
            <figcaption>
              <FigureCaption
                as="div"
                caption="Figure: Cassini radio occultation as the entry point for this applied-math case study."
                source={FIGURE_SOURCES.radioOccultation}
              />
            </figcaption>
          </figure>

          <div className="start-here-intro two-column portal-spaced">
            <p>
              This site is designed for high school students who are curious about applied
              mathematics, scientific computing, and research. Using Saturn’s rings as a
              concrete case study, it shows how a real scientific problem can move from
              physical observation to mathematical modeling, numerical analysis, and
              visualization.
            </p>
            <p>
              The goal is not only to present a MIT PRIMES Math Junior project, but to make
              research-level ideas such as radio occultation, inverse problems, stationary
              phase, and local data analysis more accessible to students who have mostly
              seen math through classroom exercises or competitions.
            </p>
          </div>

          <div className="start-here-section portal-spaced">
            <div className="start-here-section-heading">
              <p className="eyebrow">Learning Goals</p>
              <h3>What you will learn</h3>
            </div>
            <div className="start-here-learn-grid">
              {startHereLearnCards.map((card) => (
                <article className="start-here-learn-card" key={card.title}>
                  <h4>{card.title}</h4>
                  <p>{card.text}</p>
                </article>
              ))}
            </div>
          </div>

          <p className="start-here-note portal-spaced">
            <strong>Before you begin:</strong> You do not need to already know advanced research
            mathematics. The site is designed to help students move from intuition to modeling
            step by step.
          </p>

          <div className="start-here-section portal-spaced">
            <div className="start-here-section-heading">
              <p className="eyebrow">Suggested Path</p>
              <h3>Work through the learning module</h3>
              <p className="start-here-section-lede">
                Follow these steps in order to move from mission context to hands-on exploration
                and reflection.
              </p>
            </div>
            <ol className="start-here-path-list">
              {startHerePathSteps.map((item) => (
                <li key={item.step} className="start-here-path-step">
                  <span className="start-here-path-number" aria-hidden="true">
                    {item.step}
                  </span>
                  <div className="start-here-path-copy">
                    <h4>{item.title}</h4>
                    <p>{item.description}</p>
                    {item.panelId && (
                      <Link
                        className="start-here-path-link"
                        to={PANEL_ROUTES[item.panelId]}
                      >
                        Open this step
                      </Link>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="start-here-cta portal-spaced">
            <div className="start-here-section-heading">
              <p className="eyebrow">Next Steps</p>
              <h3>After this page</h3>
              <p className="start-here-section-lede">
                Jump directly to three core parts of the learning module.
              </p>
            </div>
            <div className="start-here-cta-actions">
              <Link className="button secondary" to="/background">
                Mission Background
              </Link>
              <Link className="button secondary" to="/viewer">
                Data Viewer
              </Link>
              <Link className="button primary" to="/worksheet">
                Student Worksheet
              </Link>
            </div>
          </div>
        </Section>
      </PanelShell>
    )
  }

  function renderOverview() {
    return (
      <PanelShell>
        <Section id="overview" eyebrow="01 / Overview" title="Project Overview" tone="research">
          <div className="two-column">
            <p>
              This portal presents an MIT PRIMES Math Junior project about how radio
              occultation measurements can support careful study of Saturn’s rings. The
              focus is mathematical structure, visualization, and local diagnostic tools.
            </p>
            <p>
              The current site is a research-support interface. It uses public or
              schematic material only, avoids unpublished PRIMES data, and does not claim
              final reconstruction results.
            </p>
          </div>
          <div className="contribution-panel portal-spaced">
            <div>
              <h3>Current role of the portal</h3>
              <p>
                The portal organizes background, algorithms, image references, and local
                radial-window tools so the research can be inspected in focused modules.
              </p>
            </div>
            <ul>
              {contributions.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </Section>
      </PanelShell>
    )
  }

  function renderBackground() {
    return (
      <PanelShell>
        <Section id="background" eyebrow="02 / Mission Context" title="Radio Occultation as a Window into Rings" tone="research">
          <figure className="panel-lead-figure research-figure">
            <img
              className="figure-fit-cover"
              src="/images/cassini-occultation.jpg"
              alt="Cassini radio occultation geometry through Saturn’s rings"
            />
            <figcaption>
              <FigureCaption
                as="div"
                caption="Figure: Radio occultation geometry for Saturn’s rings. The received waveform carries information about ring material without being a direct photograph."
                source={FIGURE_SOURCES.radioOccultation}
              />
            </figcaption>
          </figure>
          <div className="two-column">
            <p>
              In a radio occultation, a spacecraft sends a steady radio signal toward
              Earth while its line of sight passes behind or through a planetary ring
              system. Ring material weakens and shifts the signal before it reaches the
              receiver, so the measurement carries information about optical depth and
              fine radial structure.
            </p>
            <p>
              The mathematical challenge is that the observation is not a direct
              photograph of the rings. It is a transformed wave measurement, so geometry,
              diffraction, phase, and numerical reconstruction all matter.
            </p>
          </div>
          <figure className="panel-lead-figure research-figure portal-spaced">
            <img
              className="figure-fit-cover"
              src="/images/saturn-rings-labeled.jpg"
              alt="Labeled map of Saturn’s major rings and divisions"
            />
            <figcaption>
              <FigureCaption
                as="div"
                caption="Figure: Labeled Saturn ring regions used to connect mission geometry to radial windows in the Data Viewer."
                source={FIGURE_SOURCES.cassiniImagery}
              />
            </figcaption>
          </figure>
        </Section>
      </PanelShell>
    )
  }

  function renderMath() {
    return (
      <PanelShell>
        <Section id="math" eyebrow="03 / Mathematical Framework" title="Stationary Phase and Caustic Regions" tone="research">
          <figure className="panel-lead-figure research-figure">
            <img
              className="figure-fit-cover"
              src="/images/rings-and-waves.jpg"
              alt="Wave-like structure in Saturn’s rings related to diffraction and radial features"
            />
            <figcaption>
              <FigureCaption
                as="div"
                caption="Figure: Wave-like ring structure motivating stationary-phase analysis of radius-indexed occultation signals."
                source={FIGURE_SOURCES.scientificViz}
              />
            </figcaption>
          </figure>

          <div className="math-bridge-panel portal-spaced">
            <p className="eyebrow eyebrow-gold">From Viewer to model</p>
            <h3>How this page connects to the Data Viewer</h3>
            <p>
              The Data Viewer shows Cassini RSS samples as ring radius versus optical depth (or
              signal power). The formulas below describe why an occultation measurement is an
              inverse problem: the observed curve is not a direct map of ring structure, but a
              transformed wave measurement. Local radial windows in the Viewer are the practical
              place to inspect where a signal changes sharply before attempting stationary-phase
              or branch-based diagnostics.
            </p>
            <ul className="math-bridge-list">
              <li>
                <strong>Viewer x-axis</strong> → ring radius, the same radial coordinate appearing
                in phase models ψ(r).
              </li>
              <li>
                <strong>Viewer y-axis</strong> → normal optical depth (preferred) or normalized
                signal power, the observed quantity students inspect before modeling.
              </li>
              <li>
                <strong>Toy branch diagram</strong> → simplified picture of how stationary roots
                can split or merge as a parameter changes, related to careful bookkeeping in
                reconstruction experiments.
              </li>
            </ul>
            <Link className="button secondary" to="/viewer">
              Open Data Viewer
            </Link>
          </div>

          <div className="math-grid">
            {mathConcepts.map((concept) => (
              <article className="feature-card" key={concept.kicker}>
                <span className="card-kicker">{concept.kicker}</span>
                <div className="concept-symbol">{concept.symbol}</div>
                <h3>{concept.title}</h3>
                <p>{concept.text}</p>
              </article>
            ))}
          </div>
          <div className="formula-library">
            <div className="formula-library-heading">
              <h3>Formula Library</h3>
              <p>
                These formulas summarize the mathematical objects used throughout the portal:
                oscillatory integrals, stationary roots, curvature diagnostics, root-finding,
                and branch bookkeeping. They support interpretation of local Viewer windows; they
                do not claim a finished Saturn rings reconstruction.
              </p>
            </div>
            <div className="formula-panel">
              {formulaLibrary.map((item, index) => (
                <article className="formula-row" key={item.title}>
                  <div className="formula-index">{String(index + 1).padStart(2, '0')}</div>
                  <div className="formula-main">
                    <h4>{item.title}</h4>
                    <div className="formula-expression">{item.formula}</div>
                    <p className="formula-purpose">{item.purpose}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </Section>
        <StationaryPhaseDemo />
      </PanelShell>
    )
  }

  function renderTeam() {
    return (
      <PanelShell>
        <Section id="team" eyebrow="04 / Team Members" title="Paper-Based Contribution Dashboard">
          <div className="team-layout">
            <div className="team-grid">
              {teamMembers.map((member, index) => (
                <button
                  className={`member-card${selectedMemberIndex === index ? ' active' : ''}`}
                  type="button"
                  key={member.name}
                  onClick={() => setSelectedMemberIndex(index)}
                >
                  <h3>{member.name}</h3>
                  <p>{member.cardRole}</p>
                </button>
              ))}
            </div>
            <article className="member-detail">
              <span className="card-kicker">Selected member</span>
              <h3>{selectedMember.name}</h3>
              <div className="member-detail-grid">
                <section>
                  <h4>Role</h4>
                  <p>{selectedMember.role}</p>
                </section>
                <section>
                  <h4>Paper sections</h4>
                  <ul>
                    {selectedMember.paperSections.map((section) => (
                      <li key={section}>{section}</li>
                    ))}
                  </ul>
                </section>
                <section>
                  <h4>Focus</h4>
                  <p>{selectedMember.focus}</p>
                </section>
                <section>
                  <h4>Key ideas</h4>
                  <ul>
                    {selectedMember.keyIdeas.map((idea) => (
                      <li key={idea}>{idea}</li>
                    ))}
                  </ul>
                </section>
                <section>
                  <h4>Website module</h4>
                  <p>{selectedMember.module}</p>
                </section>
                <section>
                  <h4>Status</h4>
                  <p>{selectedMember.status}</p>
                </section>
              </div>
            </article>
          </div>
        </Section>
      </PanelShell>
    )
  }

  function renderAlgorithms() {
    const relatedMembers = [
      'Yutong Zhao / Dell Li',
      'Maiya Qiu / Dell Li',
      'Dell Li',
      'Maiya Qiu',
      'Dell Li',
      'Dell Li / Team',
    ]
    const statuses = [
      'Reference module in progress.',
      'Prototype workflow.',
      'Active implementation.',
      'Research prototype.',
      'Early diagnostic design.',
      'Visualization prototype.',
    ]

    if (selectedMethod) {
      return (
        <PanelShell>
          <Section id="method-detail" eyebrow={selectedMethod.tag} title={selectedMethod.name}>
            <Link className="back-button inline-back-button" to="/algorithms">
              ← Back to Algorithms
            </Link>
            <div className="method-detail-page">
              <div className="method-detail-copy">
                <span className="method-status">{selectedMethod.status}</span>
                <p className="method-detail-summary">{selectedMethod.does}</p>
                <div className="method-detail-grid">
                  <section>
                    <h3>Why It Matters</h3>
                    <p>{selectedMethod.matters}</p>
                  </section>
                  <section>
                    <h3>Example</h3>
                    <p>{selectedMethod.example}</p>
                  </section>
                  <section>
                    <h3>How It Works</h3>
                    <p>
                      This method is used as a research-support module: it takes local
                      samples, root candidates, or branch records and helps prepare a
                      more stable reconstruction experiment without claiming a final
                      published result.
                    </p>
                  </section>
                  <section>
                    <h3>Implementation Notes</h3>
                    <p>
                      Current status: {selectedMethod.status} Inputs, thresholds, and
                      validation checks should be reviewed against the paper discussion
                      before being treated as a finished algorithm.
                    </p>
                  </section>
                </div>
              </div>
              <figure className="method-detail-figure">
                <MethodIllustration type={selectedMethod.illustration} />
                <figcaption>{selectedMethod.caption}</figcaption>
              </figure>
            </div>
          </Section>
        </PanelShell>
      )
    }

    return (
      <PanelShell>
        <Section id="pipeline" eyebrow="05 / Algorithm Modules" title="Team Algorithm Modules">
          <div className="pipeline">
            {pipelineSteps.map((step, index) => (
              <button
                className={`pipeline-step${index === selectedPipelineIndex ? ' active' : ''}`}
                type="button"
                key={step.title}
                onClick={() => setSelectedPipelineIndex(index)}
              >
                <span className="step-number">{String(index + 1).padStart(2, '0')}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </button>
            ))}
          </div>
          <div className="pipeline-detail">
            <span className="card-kicker">Selected module</span>
            <h3>{selectedPipelineStep.title}</h3>
            <div className="detail-grid">
              <p><strong>Goal:</strong> {selectedPipelineStep.does}</p>
              <p><strong>Input / output:</strong> {selectedPipelineStep.io}</p>
              <p><strong>Current status:</strong> {statuses[selectedPipelineIndex]}</p>
              <p><strong>Related team member:</strong> {relatedMembers[selectedPipelineIndex]}</p>
            </div>
          </div>
          <div className="method-toolkit">
            <div className="method-toolkit-heading">
              <span className="card-kicker">Method library</span>
              <h3>Numerical Methods Toolkit</h3>
              <p>
                These methods connect the mathematical model to practical reconstruction
                experiments: approximating phase functions, locating stationary roots,
                tracking branches, and checking reliability.
              </p>
            </div>
            <div className="method-list">
              {numericalMethodsToolkit.map((method) => (
                <article className="method-row" key={method.name}>
                  <div className="method-name">
                    <span>{method.tag}</span>
                    <h4>{method.name}</h4>
                  </div>
                  <p><strong>What it does:</strong> {method.does}</p>
                  <p><strong>Why it matters:</strong> {method.matters}</p>
                  <div className="method-meta">
                    <div className="method-status">{method.status}</div>
                    <Link className="method-example-button" to={`/algorithms/${getMethodSlug(method.name)}`}>
                      View Example
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </Section>
      </PanelShell>
    )
  }

  function renderGallery() {
    return (
      <PanelShell>
        <Section id="figures" eyebrow="06 / Visual Gallery" title="Visual Gallery / Mission Context">
          <p className="gallery-intro">
            Public mission imagery provides context for the ring structures and
            occultation geometry behind this project. These images are used for
            background and communication, not as unpublished PRIMES data.
          </p>
          <article className="featured-reference">
            <div className="featured-reference-image">
              <img src={featuredReferenceImage.image} alt={featuredReferenceImage.title} />
            </div>
            <div className="featured-reference-body">
              <div>
                <h3>{featuredReferenceImage.title}</h3>
                <FigureCaption
                  as="div"
                  caption={`Figure: ${featuredReferenceImage.caption}`}
                  source={featuredReferenceImage.source}
                />
              </div>
              <a href={featuredReferenceImage.image} target="_blank" rel="noreferrer">
                Open full-resolution image
              </a>
            </div>
          </article>
          <div className="gallery-grid">
            {galleryImages.map((image) => (
              <article className="gallery-card" key={image.title}>
                <div className="gallery-image-frame">
                  <img src={image.image} alt={image.title} loading="lazy" />
                </div>
                <div className="gallery-card-body">
                  <h3>{image.title}</h3>
                  <FigureCaption
                    as="div"
                    caption={`Figure: ${image.caption}`}
                    source={image.source}
                  />
                  <a className="gallery-open-link" href={image.image} target="_blank" rel="noreferrer">
                    Open image
                  </a>
                </div>
              </article>
            ))}
          </div>
        </Section>
      </PanelShell>
    )
  }

  function renderDataViewer() {
    return (
      <div className="portal-panel-wrap data-viewer-page">
        <div className="data-viewer-section">
          <div className="data-viewer-shell">
            <Link className="back-button data-viewer-back" to="/">
              ← Back to Main Menu
            </Link>

            <header className="data-viewer-page-header">
              <div>
                <p className="eyebrow">07 / Real Data Viewer</p>
                <h1>Cassini Data Viewer</h1>
                <p className="data-viewer-page-lede">
                  Load Cassini RSS occultation samples (Rev007E, Rev010E, Rev054CE, Rev089CE,
                  Rev133E), inspect local radial windows of normal optical depth, review
                  statistics, and export the selected window. This tool supports inspection and
                  learning—it does not claim a finished reconstruction.
                </p>
              </div>
              <p className="viewer-edu-note">{VIEWER_EDUCATIONAL_NOTE}</p>
            </header>

            <CassiniDataViewer />
            <nav className="related-page-nav data-viewer-related-nav" aria-label="Related page">
              <Link to={RELATED_PAGES.data.to}>{RELATED_PAGES.data.label} →</Link>
            </nav>
          </div>
          <footer className="data-viewer-footer">
            <p>
              Research portfolio for an MIT PRIMES Math Junior project. Public imagery and sample
              data are used for context; unpublished PRIMES data is not displayed.
            </p>
          </footer>
        </div>
      </div>
    )
  }

  function renderProgress() {
    return (
      <PanelShell>
        <Section id="progress" eyebrow="08 / Progress" title="Progress & Next Steps">
          <div className="progress-grid">
            {progressGroups.map((group) => (
              <article className="progress-card" key={group.title}>
                <span className="card-kicker">{group.title}</span>
                <ul>
                  {group.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </Section>
      </PanelShell>
    )
  }

  function renderActivePanel() {
    if (activePanel === 'menu') return renderMenu()
    if (activePanel === 'start-here') return renderStartHere()
    if (activePanel === 'how-to-start-research') return renderHowToStartResearch()
    if (activePanel === 'data-hub') return renderDataHub()
    if (activePanel === 'worksheet') return renderStudentWorksheet()
    if (activePanel === 'impact') return renderImpactFeedback()
    if (activePanel === 'overview') return renderOverview()
    if (activePanel === 'background') return renderBackground()
    if (activePanel === 'math') return renderMath()
    if (activePanel === 'team') return renderTeam()
    if (activePanel === 'algorithms') return renderAlgorithms()
    if (activePanel === 'gallery') return renderGallery()
    if (activePanel === 'data') return renderDataViewer()
    if (activePanel === 'progress') return renderProgress()
    return renderMenu()
  }

  return (
    <div className="app-shell" id="top">
      <Helmet>
        <title>{seo.title}</title>
        <meta name="description" content={seo.description} />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Saturn Rings Reconstruction Lab" />
        <meta property="og:title" content={seo.title} />
        <meta property="og:description" content={seo.description} />
        <meta property="og:image" content={SOCIAL_IMAGE_URL} />
        <meta property="og:image:alt" content="Saturn and its rings" />
        <meta property="og:url" content={canonicalUrl} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={seo.title} />
        <meta name="twitter:description" content={seo.description} />
        <meta name="twitter:image" content={SOCIAL_IMAGE_URL} />
        <script type="application/ld+json">{JSON.stringify(learningResourceStructuredData)}</script>
      </Helmet>
      <NavBar />
      <main>{renderActivePanel()}</main>
      {isSaturnModelOpen && <SaturnModelModal onClose={() => setSaturnModelPath('')} />}
      {activePanel !== 'menu' && activePanel !== 'data' && (
        <footer className="site-footer">
          <p>
            Research portfolio for an MIT PRIMES Math Junior project. Public imagery and
            sample data are used for context; unpublished PRIMES data is not displayed.
          </p>
        </footer>
      )}
    </div>
  )
}

export default App
