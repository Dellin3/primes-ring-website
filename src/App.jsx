import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import './App.css'

const SaturnModel = lazy(() => import('./components/SaturnModel.jsx'))

const SITE_URL = 'https://primes-ring-website-p9yv.vercel.app'
const RESEARCH_STARTER_LAB_URL = 'https://student-research-lab-theta.vercel.app/'
const SOCIAL_IMAGE_URL = `${SITE_URL}/images/saturn-rings-hero.jpg`

const PANEL_ROUTES = {
  menu: '/',
  'data-hub': '/data-hub',
  math: '/math',
  data: '/viewer',
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
  'data-hub': { to: '/viewer', label: 'Next step: Open the Data Viewer' },
  math: { to: '/viewer', label: 'Related tool: Cassini Data Viewer' },
  data: { to: '/math', label: 'Related page: Mathematical Framework' },
  overview: { to: '/background', label: 'Next step: Mission Background' },
  background: { to: '/data-hub', label: 'Next step: Cassini Data Hub' },
  team: { to: '/algorithms', label: 'Related page: Algorithm Modules' },
  algorithms: { to: '/math', label: 'Related page: Mathematical Framework' },
  gallery: { to: '/background', label: 'Related page: Mission Background' },
  progress: { to: '/overview', label: 'Related page: Project Results' },
}

const DEFAULT_DESCRIPTION =
  'Explore a MIT PRIMES Saturn-ring reconstruction project using Cassini RSS radio-occultation data, optical-depth profiles, stationary phase, branch diagnostics, and interactive numerical tools.'

const ROUTE_SEO = {
  '/': {
    title: 'New Methods Toward High-Resolution Reconstruction of Saturn’s Rings | MIT PRIMES 2026',
    description: DEFAULT_DESCRIPTION,
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
  '/overview': {
    title: 'Saturn Rings Reconstruction Results | MIT PRIMES Project',
    description: 'Review current results, diagnostics, and project contributions from the Saturn-ring reconstruction research portfolio.',
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
  schematic: 'Source: Author-generated schematic for this research project.',
  csv:
    'Source: NASA Planetary Data System, PDS Ring-Moon Systems Node, CORSS_8001 Cassini RSS ring occultation profiles. Converted from public PDS TAB products into local CSV files for educational visualization.',
}

const VIEWER_EDUCATIONAL_NOTE =
  'CSV files used on this site are educational local copies derived from public Cassini RSS occultation products. Unpublished PRIMES project data is not displayed.'

const researchPipelineSteps = [
  {
    title: 'Cassini RSS Data',
    detail: 'Real radio-occultation amplitude / phase profiles',
    to: '/viewer',
  },
  {
    title: 'Phase Model',
    detail: 'ψ(φ; ρ)',
    to: '/math',
  },
  {
    title: 'Stationary Roots',
    detail: '∂ψ/∂φ = 0',
    to: '/math',
  },
  {
    title: 'Root Tracking',
    detail: 'Newton / Halley / continuation / PAC',
    to: '/algorithms',
  },
  {
    title: 'Branch Bookkeeping',
    detail: 'identity + ψ + ψ″ + amplitude + status',
    to: '/algorithms/branch-bookkeeping',
  },
  {
    title: 'Reliability Diagnostics',
    detail: 'curvature + separation + jump + confidence',
    to: '/math',
  },
  {
    title: 'Reconstruction',
    detail: 'sum reliable contributions; flag delicate regions',
    to: '/overview',
  },
]

const coreResearchMethods = [
  {
    title: 'Phase Interpolation',
    text: 'Study numerical interpolation of the phase function to reduce repeated evaluation cost, including cubic spline, PCHIP, and Floater–Hormann comparisons.',
  },
  {
    title: 'Stationary Root Finding',
    text: 'A fixed profile parameter may have several stationary angles. One Newton or Halley run generally recovers only the root near its initial guess.',
  },
  {
    title: 'Continuation & PAC',
    text: 'Track roots as the profile parameter changes. Pseudo-arclength continuation is designed to follow a branch through folds where natural continuation can fail.',
  },
  {
    title: 'Branch Bookkeeping',
    text: 'The layer between root finding and reconstruction: preserve branch identity and attach the phase, curvature, amplitude, and status needed downstream.',
  },
  {
    title: 'Bifurcation Diagnostics',
    text: 'Use local Taylor information and a discriminant-style test to identify delicate configurations where roots approach, merge, or change character.',
  },
  {
    title: 'Multivariate Interpolation',
    text: 'Near a bifurcation, stationary-angle structure is genuinely multi-branch—not a collection of globally simple, single-valued functions.',
  },
]

const compactNavItems = [
  { id: 'menu', title: 'Home' },
  { id: 'overview', title: 'Research' },
  { id: 'math', title: 'Math' },
  { id: 'data-hub', title: 'Data' },
  { id: 'data', title: 'Viewer' },
  { id: 'background', title: 'Mission' },
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
      'Optical-depth statistics and moving-average residuals',
    ],
  },
  {
    title: 'In progress',
    items: [
      'Stationary-root reliability checks',
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
      'Expand branch confidence and bifurcation diagnostics',
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
        <a href={RESEARCH_STARTER_LAB_URL} target="_blank" rel="noopener noreferrer">
          Learn ↗
        </a>
      </nav>
    </header>
  )
}

// Retained for future diagram variants used by this research project.
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
        profile parameter ρ
      </text>
      <text className="schematic-axis" x="18" y="112" transform="rotate(-90 18 112)">
        stationary angle φ
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

function FigureCaption({ caption, source, className = '', as: Tag = 'figcaption' }) {
  if (!caption && !source) return null

  return (
    <Tag className={`figure-caption-block ${className}`.trim()}>
      {caption && <p className="research-figure-caption">{caption}</p>}
      {source && <p className="figure-source-note">{source}</p>}
    </Tag>
  )
}

function HeroScientificFigure({ onOpenModel }) {
  const figureRef = useRef(null)
  const [isActive, setIsActive] = useState(false)

  useEffect(() => {
    const figure = figureRef.current
    if (!figure || typeof IntersectionObserver === 'undefined') return undefined

    const observer = new IntersectionObserver(
      ([entry]) => setIsActive(entry.isIntersecting),
      { threshold: 0.18 },
    )
    observer.observe(figure)
    return () => observer.disconnect()
  }, [])

  return (
    <figure
      ref={figureRef}
      className={`research-figure mission-hero-figure hero-science-figure${isActive ? ' is-active' : ''}`}
    >
      <div className="hero-science-frame">
        <svg
          className="occultation-schematic"
          viewBox="0 0 600 440"
          role="img"
          aria-labelledby="occultation-title occultation-description"
        >
          <title id="occultation-title">Cassini RSS ring radio-occultation inverse problem</title>
          <desc id="occultation-description">
            Cassini transmits a coherent radio signal through Saturn’s ring plane. Earth-based Deep
            Space Network stations receive the altered amplitude and phase, from which the radial
            optical-depth structure is inferred.
          </desc>
          <defs>
            <marker id="hero-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto">
              <path d="M0 0 L8 4 L0 8 Z" />
            </marker>
            <clipPath id="amplitude-trace-clip">
              <rect x="400" y="277" width="172" height="54" />
            </clipPath>
            <clipPath id="phase-trace-clip">
              <rect x="400" y="345" width="172" height="46" />
            </clipPath>
          </defs>

          <text className="figure-overline" x="24" y="26">MEASUREMENT MODEL</text>
          <text className="figure-note end" x="576" y="26" textAnchor="end">SCHEMATIC · NOT TO SCALE</text>
          <line className="figure-rule" x1="24" y1="38" x2="576" y2="38" />

          <g className="figure-annotation propagation-annotation" tabIndex="0" role="group" aria-label="Radio signal propagation through the rings">
            <text className="figure-label stage-heading" x="300" y="63" textAnchor="middle">RADIO OCCULTATION</text>
            <text className="endpoint-label" x="42" y="100">CASSINI / TX</text>
            <text className="secondary-note" x="42" y="117">coherent radio source</text>
            <circle className="endpoint-mark tx" cx="75" cy="151" r="8" />
            <line className="signal-direction" x1="86" y1="151" x2="505" y2="151" markerEnd="url(#hero-arrow)" />
            <g className="incoming-wavefronts">
              <path d="M99 128 C124 119 147 119 172 128" />
              <path d="M99 151 C124 142 147 142 172 151" />
              <path d="M99 174 C124 165 147 165 172 174" />
              <path d="M177 128 C202 119 225 119 250 128" />
              <path d="M177 151 C202 142 225 142 250 151" />
              <path d="M177 174 C202 165 225 165 250 174" />
            </g>
            <g className="ring-plane">
              <path className="ring-plane-guide" d="M250 205 L338 93" />
              <path className="ring-plane-band light" d="M258 211 L346 99" />
              <path className="ring-plane-band medium" d="M269 218 L357 106" />
              <path className="ring-plane-band dark" d="M282 224 L370 112" />
              <path className="ring-plane-band gap" d="M295 231 L383 119" />
            </g>
            <text className="endpoint-label ring-plane-label" x="310" y="239" textAnchor="middle">SATURN RING PLANE</text>
            <text className="secondary-note ring-plane-note" x="310" y="254" textAnchor="middle">varying optical depth</text>
            <g className="diffracted-wavefronts">
              <path d="M351 128 C375 111 399 145 425 126 S468 142 493 127" />
              <path d="M351 151 C376 132 399 171 425 148 S468 167 493 149" />
              <path d="M351 174 C376 159 399 190 425 172 S468 185 493 173" />
            </g>
            <circle className="endpoint-mark rx" cx="522" cy="151" r="8" />
            <text className="endpoint-label" x="558" y="100" textAnchor="end">EARTH · DSN / RX</text>
            <text className="secondary-note" x="558" y="117" textAnchor="end">received on Earth</text>
          </g>

          <line className="figure-rule section-rule" x1="24" y1="269" x2="576" y2="269" />

          <g className="figure-annotation structure-annotation" tabIndex="0" role="group" aria-label="Inferred radial ring structure">
            <text className="figure-label" x="28" y="292">RING STRUCTURE</text>
            <text className="secondary-note" x="28" y="308">inferred radial optical depth τ(ρ)</text>
            <line className="plot-axis" x1="31" y1="382" x2="216" y2="382" />
            <line className="plot-axis" x1="31" y1="323" x2="31" y2="382" />
            <path className="structure-area" d="M31 376 L45 376 L45 361 L60 361 L60 337 L82 337 L82 374 L98 374 L98 351 L118 351 L118 330 L151 330 L151 357 L170 357 L170 344 L192 344 L192 369 L216 369 L216 382 L31 382 Z" />
            <path className="structure-profile" d="M31 376 L45 376 L45 361 L60 361 L60 337 L82 337 L82 374 L98 374 L98 351 L118 351 L118 330 L151 330 L151 357 L170 357 L170 344 L192 344 L192 369 L216 369" />
            <text className="axis-label" x="210" y="397">ρ</text>
            <text className="observation-status inferred" x="31" y="416">INFERRED</text>
          </g>

          <g className="figure-annotation signal-annotation" tabIndex="0" role="group" aria-label="Amplitude and phase received at Earth">
            <text className="figure-label" x="400" y="292">RECEIVED SIGNAL</text>
            <text className="trace-label" x="400" y="311">AMPLITUDE</text>
            <line className="plot-axis" x1="400" y1="329" x2="572" y2="329" />
            <g clipPath="url(#amplitude-trace-clip)">
              <path className="signal-trace-base" d="M400 317 C414 313 424 324 437 316 S460 309 474 320 S498 324 511 312 S536 307 548 317 S563 322 572 314" />
              <path className="signal-trace-draw" d="M400 317 C414 313 424 324 437 316 S460 309 474 320 S498 324 511 312 S536 307 548 317 S563 322 572 314" />
            </g>
            <text className="trace-label" x="400" y="351">PHASE</text>
            <line className="plot-axis" x1="400" y1="382" x2="572" y2="382" />
            <g clipPath="url(#phase-trace-clip)">
              <path className="signal-trace-base phase" d="M400 370 C417 368 424 354 440 363 S462 379 477 365 S501 350 515 362 S536 377 551 364 S565 355 572 359" />
              <path className="signal-trace-draw phase" d="M400 370 C417 368 424 354 440 363 S462 379 477 365 S501 350 515 362 S536 377 551 364 S565 355 572 359" />
            </g>
            <text className="observation-status observed" x="572" y="416" textAnchor="end">DIRECTLY OBSERVED</text>
          </g>

          <path className="inverse-path" markerEnd="url(#hero-arrow)" d="M464 404 C416 434 223 434 153 404" />
          <text className="inverse-label" x="307" y="413" textAnchor="middle">INVERSE RECONSTRUCTION</text>

        </svg>
      </div>
      <figcaption className="mission-hero-caption">
        <FigureCaption
          as="div"
          caption="FIG. 01 — RADIO OCCULTATION · Cassini transmits through the rings; Earth-based DSN stations receive the altered signal used to infer ring structure."
          source="Author-generated conceptual schematic; not raw Cassini data."
        />
        <button className="hero-model-link" type="button" onClick={onOpenModel}>
          Explore mission geometry in 3D →
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

function StationaryRootReliabilityExplorer() {
  const [rho, setRho] = useState(0.34)
  const foldRho = 1
  const plot = { left: 62, right: 620, top: 52, bottom: 330, midY: 190 }
  const xScale = (value) => plot.left + (value / 1.15) * (plot.right - plot.left)
  const yScale = (value) => plot.midY - (value / 1.3) * 128

  const branchPaths = useMemo(() => {
    const upper = []
    const lower = []
    for (let index = 0; index <= 140; index += 1) {
      const value = index / 140
      const root = Math.sqrt(Math.max(0, 1 - value))
      const mappedX = 62 + (value / 1.15) * (620 - 62)
      const upperY = 190 - (root / 1.3) * 128
      const lowerY = 190 - (-root / 1.3) * 128
      upper.push(`${index === 0 ? 'M' : 'L'} ${mappedX.toFixed(2)} ${upperY.toFixed(2)}`)
      lower.push(`${index === 0 ? 'M' : 'L'} ${mappedX.toFixed(2)} ${lowerY.toFixed(2)}`)
    }
    return { upper: upper.join(' '), lower: lower.join(' ') }
  }, [])

  const isBeforeFold = rho < foldRho
  const rootMagnitude = isBeforeFold ? Math.sqrt(foldRho - rho) : 0
  const separation = isBeforeFold ? 2 * rootMagnitude : 0
  const curvature = isBeforeFold ? 2 * rootMagnitude : 0
  const jump = isBeforeFold ? 1 / (2 * Math.max(rootMagnitude, 0.08)) : 6.25
  const confidence = isBeforeFold
    ? Math.max(0, Math.min(1, separation / 1.1, curvature / 1, 2.2 / jump))
    : 0
  const selectedX = xScale(rho)
  const selectedRoots = isBeforeFold ? [rootMagnitude, -rootMagnitude] : []

  const state =
    confidence > 0.66
      ? {
          key: 'stable',
          label: 'Stable',
          text: 'Two well-separated roots. Branch identity is clear.',
        }
      : confidence > 0.25
        ? {
            key: 'delicate',
            label: 'Delicate',
            text: 'Roots approach and local diagnostics warn that ordinary continuation may become unreliable.',
          }
        : {
            key: 'bifurcation',
            label: 'Bifurcation neighborhood',
            text: 'The branches merge or disappear. Flag this region for local refinement or special treatment.',
          }

  const confidenceLabel = confidence > 0.66 ? 'High' : confidence > 0.25 ? 'Medium' : 'Low'
  const diagnostics = [
    {
      label: 'Branch separation',
      symbol: 'Δφ',
      value: separation.toFixed(2),
      level: Math.min(1, separation / 1.6),
      title: 'Minimum angular separation between the two stationary-root branches.',
    },
    {
      label: 'Local curvature',
      symbol: '|ψ″|',
      value: curvature.toFixed(2),
      level: Math.min(1, curvature / 1.6),
      title: 'A schematic curvature proxy that becomes small as the roots meet.',
    },
    {
      label: 'Continuity / jump',
      symbol: 'q_jump',
      value: jump.toFixed(2),
      level: Math.min(1, jump / 4),
      inverse: true,
      title: 'A schematic branch-angle change rate; larger values indicate more delicate tracking.',
    },
    {
      label: 'Local confidence',
      symbol: 'C_s',
      value: confidence.toFixed(2),
      level: confidence,
      title: 'The minimum of normalized local diagnostics in this conceptual model.',
    },
  ]

  return (
    <section id="root-reliability" className="section root-reliability-section" aria-labelledby="root-reliability-title">
      <div className="section-heading">
        <p className="eyebrow eyebrow-gold">Interactive Explanation</p>
        <h2 id="root-reliability-title">Watch a stationary-root branch become unreliable</h2>
        <p className="section-lede">
          As the profile parameter ρ changes, stationary roots can approach, merge, or disappear.
          Track the branches and watch the local reliability diagnostics respond.
        </p>
      </div>

      <div className="root-explorer">
        <div className="root-figure-column">
          <figure className="root-branch-figure">
            <div className="root-figure-meta">
              <span>Stationary-root branches</span>
              <span>Interactive schematic — not Cassini measurement data.</span>
            </div>
            <svg
              className="root-branch-svg"
              viewBox="0 0 680 380"
              role="img"
              aria-labelledby="root-plot-title root-plot-description"
            >
              <title id="root-plot-title">Two stationary-root branches approaching a fold</title>
              <desc id="root-plot-description">
                Two roots approach as rho increases, meet at rho equals one, and are absent beyond
                the fold. A vertical guide marks the selected rho.
              </desc>
              {[0, 0.25, 0.5, 0.75, 1].map((value) => (
                <g key={`rho-${value}`}>
                  <line className="root-grid-line" x1={xScale(value)} x2={xScale(value)} y1={plot.top} y2={plot.bottom} />
                  <text className="root-tick" x={xScale(value)} y="351" textAnchor="middle">{value.toFixed(2)}</text>
                </g>
              ))}
              {[-1, -0.5, 0, 0.5, 1].map((value) => (
                <g key={`phi-${value}`}>
                  <line className="root-grid-line" x1={plot.left} x2={plot.right} y1={yScale(value)} y2={yScale(value)} />
                  <text className="root-tick" x="49" y={yScale(value) + 4} textAnchor="end">{value.toFixed(1)}</text>
                </g>
              ))}
              <line className="root-axis" x1={plot.left} x2={plot.right} y1={plot.bottom} y2={plot.bottom} />
              <line className="root-axis" x1={plot.left} x2={plot.left} y1={plot.top} y2={plot.bottom} />
              <rect className="fold-neighborhood" x={xScale(0.92)} y={plot.top} width={xScale(1.08) - xScale(0.92)} height={plot.bottom - plot.top} />
              <text className="fold-label" x={xScale(1)} y="70" textAnchor="middle">fold neighborhood</text>
              <path className="root-branch root-upper" d={branchPaths.upper} />
              <path className="root-branch root-lower" d={branchPaths.lower} />
              <line className="selected-rho-guide" x1={selectedX} x2={selectedX} y1={plot.top} y2={plot.bottom} />
              {selectedRoots.map((root, index) => {
                const markerY = yScale(root)
                return (
                  <g key={`${index}-${root.toFixed(4)}`}>
                    <line className="root-diagnostic-leader" x1={selectedX} x2={plot.right} y1={markerY} y2={markerY} />
                    <circle className="selected-root-halo" cx={selectedX} cy={markerY} r="8" />
                    <circle className="selected-root-marker" cx={selectedX} cy={markerY} r="4">
                      <title>Stationary root φ_s = {root.toFixed(3)}</title>
                    </circle>
                  </g>
                )
              })}
              {!isBeforeFold && (
                <g>
                  <circle className="fold-marker" cx={xScale(1)} cy={yScale(0)} r="5" />
                  <text className="no-root-note" x={selectedX} y={yScale(0) - 16} textAnchor="middle">
                    {rho === foldRho ? 'merged root' : 'no two-root branch'}
                  </text>
                </g>
              )}
              <text className="root-axis-label" x={(plot.left + plot.right) / 2} y="375" textAnchor="middle">profile parameter ρ</text>
              <text className="root-axis-label" x="15" y={(plot.top + plot.bottom) / 2} textAnchor="middle" transform={`rotate(-90 15 ${(plot.top + plot.bottom) / 2})`}>
                stationary angle φ_s
              </text>
            </svg>
            <div className="root-slider-wrap">
              <label htmlFor="root-rho-slider">
                <span>Selected profile parameter</span>
                <output htmlFor="root-rho-slider">ρ = {rho.toFixed(3)}</output>
              </label>
              <input
                id="root-rho-slider"
                type="range"
                min="0"
                max="1.15"
                step="0.002"
                value={rho}
                aria-describedby="root-slider-note"
                onChange={(event) => setRho(Number(event.target.value))}
              />
              <p id="root-slider-note">Use the arrow keys for fine control. The schematic fold occurs at ρ = 1.</p>
            </div>
          </figure>
        </div>

        <aside className="root-diagnostics" aria-live="polite">
          <div className={`root-state state-${state.key}`}>
            <span>Current regime</span>
            <strong>{state.label}</strong>
            <p>{state.text}</p>
          </div>
          <div className="diagnostic-list">
            {diagnostics.map((diagnostic) => (
              <div className="root-diagnostic" key={diagnostic.label} title={diagnostic.title}>
                <div className="diagnostic-heading">
                  <span>{diagnostic.label}</span>
                  <i>{diagnostic.symbol}</i>
                </div>
                <div className="diagnostic-reading">
                  <strong>{diagnostic.label === 'Local confidence' ? confidenceLabel : diagnostic.value}</strong>
                  <span>{diagnostic.label === 'Local confidence' ? `C_s = ${diagnostic.value}` : 'schematic units'}</span>
                </div>
                <div className={`diagnostic-meter${diagnostic.inverse ? ' inverse' : ''}`} aria-hidden="true">
                  <span style={{ width: `${diagnostic.level * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>

      <div className="root-explorer-why">
        <div>
          <span>Why this matters</span>
          <p>
            Branch bookkeeping preserves root identity as ρ changes. Local diagnostics attach
            reliability information before reconstruction, so numerically delicate neighborhoods
            can be treated explicitly rather than silently propagated downstream.
          </p>
        </div>
        <div className="root-contribution-link">
          <span>Student contribution — Dell Li</span>
          <p>Branch identity, bookkeeping, and local reliability diagnostics.</p>
          <a href="#dell-contribution">Explore Dell&apos;s contribution →</a>
        </div>
      </div>
    </section>
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
  const researchProjectStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'ResearchProject',
    name: 'New Methods Toward High-Resolution Reconstruction of Saturn’s Rings',
    url: `${SITE_URL}/`,
    description: DEFAULT_DESCRIPTION,
    about: [
      'Saturn rings',
      'Cassini radio occultation',
      'Inverse problems',
      'Applied mathematics',
    ],
    member: [
      { '@type': 'Person', name: 'Dell Li' },
      { '@type': 'Person', name: 'Maiya Qiu' },
      { '@type': 'Person', name: 'Yutong Zhao' },
    ],
  }

  useEffect(() => {
    if (!activePanel) {
      navigate('/', { replace: true })
      return
    }

    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [activePanel, navigate, normalizedPath])

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
            <p className="eyebrow eyebrow-gold">MIT PRIMES 2026 · Mathematics Research</p>
            <h1 className="hero-project-title">
              <span>NEW METHODS TOWARD</span>
              <span>HIGH-RESOLUTION</span>
              <span>RECONSTRUCTION OF</span>
              <span>SATURN’S RINGS</span>
            </h1>
            <p className="hero-authors">Dell Li · Maiya Qiu · Yutong Zhao</p>
            <p className="hero-mentor">Mentored by Dr. Ryan Maguire</p>
            <p className="hero-subtitle">
              Numerical methods for reconstructing Saturn’s ring structure from Cassini
              radio-occultation data, with a focus on stationary-phase root tracking, bifurcations,
              and reconstruction reliability.
            </p>
            <div className="research-topic-list" aria-label="Research topics">
              {['Radio Occultation', 'Inverse Problems', 'Stationary Phase', 'Numerical Continuation', 'Bifurcation Diagnostics'].map(
                (topic) => <span key={topic}>{topic}</span>,
              )}
            </div>
            <div className="hero-actions">
              <a className="button primary" href="#research-question">
                Explore the Research
              </a>
              <Link className="button secondary" to="/viewer">
                Open Cassini Data Viewer
              </Link>
              <Link className="hero-text-link" to="/math">
                See the Mathematics →
              </Link>
            </div>
          </div>
          <HeroScientificFigure onOpenModel={() => setSaturnModelPath(normalizedPath)} />
        </section>

        <section id="research-question" className="section research-question-section tone-why">
          <div className="section-heading">
            <p className="eyebrow eyebrow-navy">The Research Question</p>
            <h2>
              How can we reconstruct fine-scale structure in Saturn’s rings faster and more reliably
              when stationary-phase roots merge, split, or disappear?
            </h2>
            <p className="section-lede">
              The observed diffracted signal is modeled by a Huygens–Fresnel-type integral whose
              dominant contributions arise at stationary points of the phase.
            </p>
          </div>
          <div className="research-question-flow">
            {[
              ['Observation', 'Cassini radio signals pass through Saturn’s rings. Ring structure modifies the signal through attenuation, phase shift, and diffraction.'],
              ['Inverse Problem', 'Use the received radio-occultation signal to infer the underlying radial structure of the rings.'],
              ['Numerical Challenge', 'The stationary angles may form multiple branches. Near folds and bifurcations, roots can approach, merge, disappear, or become unstable to track.'],
            ].map(([title, text], index) => (
              <article className="research-question-stage" key={title}>
                <span className="stage-index">{String(index + 1).padStart(2, '0')}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>

        <StationaryRootReliabilityExplorer />

        <section className="section home-features-section tone-snapshot" aria-label="Core research methods">
          <div className="section-heading">
            <p className="eyebrow eyebrow-gold">Core Research Methods</p>
            <h2>Numerical structure of the reconstruction problem</h2>
            <p className="section-lede">
              The project investigates the full path from fast phase evaluation to multi-branch
              stationary-root records suitable for reliability-aware reconstruction.
            </p>
          </div>
          <div className="research-method-grid">
            {coreResearchMethods.map((method, index) => (
              <article className="research-method-card" key={method.title}>
                <span className="method-number">{String(index + 1).padStart(2, '0')}</span>
                <h3>{method.title}</h3>
                <p>{method.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="dell-contribution" className="section contributor-section tone-tools" aria-label="Contributor focus">
          <div className="section-heading">
            <p className="eyebrow eyebrow-blue">Contributor Focus</p>
            <h2>Dell Li · branch identity and local reliability</h2>
            <p className="section-lede">
              Dell’s work focuses on the interface between stationary-root computation and
              reconstruction: preserving branch identity, detecting numerically delicate regions,
              and attaching local reliability information to each stationary-root record.
            </p>
          </div>
          <div className="contributor-pipeline" aria-label="Dell contribution pipeline">
            <span>Root Finding</span><b>→</b>
            <strong>Branch Bookkeeping <em>— Dell</em></strong><b>→</b>
            <strong>Local Reliability Diagnostics <em>— Dell</em></strong><b>→</b>
            <span>Reconstruction</span>
          </div>
          <div className="returned-record">
            <span className="scientific-status status-draft">Stationary-Root Record</span>
            <p className="record-label">Returned stationary-root record</p>
            <div className="record-equation" aria-label="Stationary root record">
              ( φ<sub>s</sub>(ρ<sub>j</sub>), ψ(φ<sub>s</sub>;ρ<sub>j</sub>), ψ″(φ<sub>s</sub>;ρ<sub>j</sub>),
              a(φ<sub>s</sub>;ρ<sub>j</sub>), branch label, status flag, C<sub>s</sub>(ρ<sub>j</sub>) )
            </div>
          </div>
        </section>

        <section className="section bifurcation-feature-section" aria-label="Near a bifurcation">
          <div className="bifurcation-feature-grid">
            <figure className="bifurcation-home-figure">
              <SchematicBranchFigure />
              <FigureCaption
                caption="Figure 02. Author-generated toy branch schematic in (ρ, φ); not Cassini data."
                source={FIGURE_SOURCES.schematic}
              />
            </figure>
            <div>
              <p className="eyebrow eyebrow-gold">Near a Bifurcation</p>
              <h2>Do not interpolate one smooth branch through the event</h2>
              <ul className="bifurcation-notes">
                <li>Away from a bifurcation, branches are separated and can be tracked independently.</li>
                <li>Near a merge or fold, branch separation decreases and ψ″ may become small.</li>
                <li>Flag the neighborhood for local refinement or special treatment.</li>
              </ul>
              <Link className="home-tool-link" to="/math#stationary-demo">Inspect the branch mathematics →</Link>
            </div>
          </div>
        </section>

        <section className="section home-pipeline-section tone-pipeline" aria-label="Research pipeline">
          <div className="section-heading">
            <p className="eyebrow eyebrow-gold">Research Pipeline</p>
            <h2>From Cassini data to reliability-aware reconstruction</h2>
            <p className="section-lede">
              Each stage carries physical or numerical information forward; root identity and local
              reliability cannot be recovered after they have been discarded.
            </p>
          </div>
          <figure className="research-pipeline-figure">
            <ol className="research-pipeline">
              {researchPipelineSteps.map((step, index) => (
                <li className="research-pipeline-step" key={step.title}>
                  <Link to={step.to}>
                    <span className="pipeline-number">{String(index + 1).padStart(2, '0')}</span>
                    <strong>{step.title}</strong>
                    <span>{step.detail}</span>
                  </Link>
                  {index < researchPipelineSteps.length - 1 && (
                    <span className="research-pipeline-arrow" aria-hidden="true">→</span>
                  )}
                </li>
              ))}
            </ol>
            <figcaption>
              <FigureCaption
                as="div"
                caption="Figure 03. Proposed computational pipeline. Links open only existing research, mathematics, data, and algorithm pages."
                source={FIGURE_SOURCES.schematic}
              />
            </figcaption>
          </figure>
        </section>

        <section className="section reliability-preview-section tone-nav" aria-label="Reliability diagnostic preview">
          <div className="section-heading">
            <p className="eyebrow eyebrow-navy">Reliability-Diagnostic Preview</p>
            <h2>A local confidence score for each stationary contribution</h2>
            <p className="section-lede home-modules-lede">
              The project investigates a restrained diagnostic that combines curvature, nearby
              branch separation, and branch-angle jump. Thresholds remain in validation.
            </p>
          </div>
          <div className="reliability-preview-grid">
            <div className="reliability-equations">
              <span className="scientific-status status-validation">In Validation</span>
              <p><i>q</i><sub>curv</sub> = |ψ″|</p>
              <p><i>q</i><sub>sep</sub> = minimum separation from another stationary branch</p>
              <p><i>q</i><sub>jump</sub> = change in branch angle / Δρ</p>
              <p className="confidence-equation">
                C<sub>s</sub> = min(1, q<sub>curv</sub>/τ<sub>curv</sub>,
                q<sub>sep</sub>/τ<sub>sep</sub>, τ<sub>jump</sub>/(q<sub>jump</sub> + ε))
              </p>
              <Link className="home-tool-link" to="/math">See the mathematical framework →</Link>
            </div>
            <div className="confidence-scale">
              <div className="confidence-level high">
                <strong>High confidence</strong>
                <span>ordinary stationary-phase contribution is appropriate</span>
              </div>
              <div className="confidence-level intermediate">
                <strong>Intermediate</strong>
                <span>refine locally / reevaluate roots</span>
              </div>
              <div className="confidence-level low">
                <strong>Low confidence</strong>
                <span>flag for special local treatment</span>
              </div>
            </div>
          </div>
        </section>

        <section className="section data-provenance-section tone-updates" aria-label="Cassini data provenance">
          <div className="section-heading">
            <p className="eyebrow eyebrow-gold">Real Public Data</p>
            <h2>Cassini RSS data provenance</h2>
            <p className="section-lede">
              The viewer uses local CSV conversions of public Cassini Radio Science Subsystem ring
              occultation profiles from the NASA Planetary Data System Ring-Moon Systems Node.
            </p>
          </div>
          <div className="data-provenance-grid">
            <figure className="data-provenance-preview">
              <img src="/images/data viewer.png" alt="Cassini RSS Data Viewer showing a radial optical-depth profile" />
              <FigureCaption
                caption="Figure 04. Implemented viewer for real public Cassini/PDS-derived profiles."
                source={FIGURE_SOURCES.csv}
              />
            </figure>
            <div className="data-product-list">
              <span className="scientific-status status-implemented">Implemented</span>
              <p className="data-product-intro">Available local samples include:</p>
              <ul>
                {cassiniDatasets.map((dataset) => (
                  <li key={dataset.id}>
                    <strong>{dataset.rev} · {dataset.band}</strong>
                    <span>{dataset.productId} · {dataset.resolution}</span>
                  </li>
                ))}
              </ul>
              <div className="data-links">
                <Link className="button primary" to="/viewer">Open Cassini Data Viewer</Link>
                <Link className="button secondary" to="/data-hub">Inspect official data sources</Link>
              </div>
            </div>
          </div>
        </section>

        <section className="section home-research-starter-section learning-resources-section" aria-labelledby="research-starter-title">
          <div className="home-value-panel tone-callout">
            <div className="home-value-panel-copy">
              <p className="eyebrow eyebrow-navy">Research Learning Resources</p>
              <h2 id="research-starter-title">Learn from the project</h2>
              <p>
                The scientific project remains primary. Student pathways, worksheet material,
                teacher and club-leader guidance, toy models, and responsible research resources
                remain available as a secondary layer.
              </p>
              <div className="learning-link-row">
                <a className="button secondary" href={RESEARCH_STARTER_LAB_URL} target="_blank" rel="noopener noreferrer">
                  Open Research Starter Lab ↗
                </a>
                <Link className="button secondary" to="/background">Mission Background</Link>
                <Link className="button secondary" to="/gallery">Visual Resources</Link>
              </div>
            </div>
          </div>
        </section>

        <section className="section home-credits-section" aria-labelledby="sources-credits-title">
          <div className="section-heading">
            <p className="eyebrow eyebrow-navy">Sources &amp; Credits</p>
            <h2 id="sources-credits-title">Public data and scientific sources</h2>
          </div>
          <p>
            Cassini Radio Science Subsystem (RSS) data shown here are educational local copies
            derived from public NASA Planetary Data System products. This research portfolio does
            not display unpublished PRIMES data. Website-generated schematics and diagrams are
            labeled accurately, while NASA and JPL imagery retains its source credit.
          </p>
        </section>
      </div>
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

  function renderOverview() {
    return (
      <PanelShell>
        <Section id="overview" eyebrow="01 / Results" title="Current Results & Diagnostics" tone="research">
          <div className="two-column">
            <p>
              This MIT PRIMES Math Junior project investigates how radio-occultation measurements
              can support reconstruction of Saturn’s radial ring structure. Current results focus
              on mathematical structure, visualization, and local diagnostic tools.
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
                  analysis—it does not claim a finished reconstruction.
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
    if (activePanel === 'data-hub') return renderDataHub()
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
        <script type="application/ld+json">{JSON.stringify(researchProjectStructuredData)}</script>
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
