export const researchModules = [
  {
    number: '01',
    slug: 'signal-and-phase',
    title: 'Signal & Phase Approximation',
    description:
      'Connect the measured signal and phase to the geometry needed for reconstruction calculations.',
    question:
      'How can the radio-occultation signal geometry and phase be evaluated accurately enough for repeated numerical reconstruction calculations?',
    contributors: [],
    figures: [],
    explanation: 'A reconstruction method needs a description of how a radio signal travels through the ring geometry, including its phase. This chapter introduces the measured quantities you can inspect before considering a numerical approximation.',
    reading: [
      'Radial distance is measured from Saturn’s center in kilometers. The plotted samples are calibrated ring profiles from Cassini’s Radio Science Subsystem (RSS), the instrument used for these radio-occultation observations.',
      'Normalized signal power compares the received signal power with its value without the rings. Normal optical depth includes the ring-opening-angle scaling specified in the source label; it is dimensionless.',
      'Phase shift is stored in degrees. The workbench shows unconnected phase samples and performs no phase unwrapping or continuity inference.',
    ],
    exercise: 'Open the example region, then switch from Normal Optical Depth to Normalized Signal Power and Phase Shift. Keep the radial window fixed and distinguish a different representation from a new observation.',
    details: [
      'The source definition relates measured oblique optical depth to the negative natural logarithm of normalized signal power. Normal optical depth additionally uses the sine of the absolute ring opening angle. The workbench preserves the supplied normal optical-depth values rather than recomputing them from incomplete geometry.',
      'These Diffraction-Limited Profiles (DLP) are calibrated profiles before reconstruction to remove diffraction effects. Their phase samples are inputs for understanding the signal, not a published approximation or a reconstruction result from this project.',
    ],
    next: 'Save a note identifying which variable you inspected, its unit, and one inference the plot does not support.',
    unavailable: 'Project phase approximations, error bounds, and research figures: not yet available.',
  },
  {
    number: '02',
    slug: 'stationary-roots-and-continuation',
    title: 'Stationary Roots & Continuation',
    description:
      'Follow stationary-angle solutions as geometry changes, and use a teaching model to examine branch behavior.',
    question:
      'How can stationary-angle solutions be found and followed when branches approach, fold, merge, or disappear as observation geometry changes?',
    contributors: [],
    figures: [],
    explanation: 'A stationary-angle calculation may have more than one solution for a given geometry. Following how those solutions change requires distinguishing a branch from an isolated root and recognizing where branches meet.',
    reading: [
      'In a stationary-phase formulation, stationary angles solve a condition of the form ∂Φ/∂θ = 0. A root is a solution at one geometry; continuation follows solutions as a parameter changes.',
      'The illustrative cubic below separates this mathematical idea from the observational data. Its x and y are dimensionless teaching variables, not ring radius, optical depth, or fitted Cassini parameters.',
      'A feature in an optical-depth profile is not, by itself, evidence of a stationary root or a branch transition.',
    ],
    exercise: 'Move the teaching parameter across the fold. Compare the number of distinct real roots and notice why a method looking only for sign changes needs care at a double root.',
    details: [
      'The teaching model is F(x, y) = y³ + xy − 1 = 0. At a fold, F = 0 and ∂F/∂y = 3y² + x = 0. Substitution gives y = −∛(1/2) and x = −∛(27/4).',
      'The diagram evaluates this cubic on monotone intervals separated by its derivative’s critical points, then uses bisection where a sign change brackets a root. Critical points are checked separately for a repeated root. These calculations illustrate the toy equation only; they are not a Cassini stationary-angle solver.',
    ],
    next: 'Return to an exact observation window and record separately what you measured and what would require a model to explain.',
    unavailable: 'Cassini stationary-root outputs, branch records, and continuation results: not yet available.',
  },
  {
    number: '03',
    slug: 'reliability-and-reconstruction',
    title: 'Reliability & Reconstruction Interface',
    description:
      'Trace data identity and numerical reliability requirements before passing results to reconstruction.',
    question:
      'How should branch identity, numerical reliability, and validation information pass from stationary-root computation into the reconstruction pipeline?',
    contributors: [],
    figures: [],
    explanation: 'A numerical result needs enough context to be checked and used by the next stage of a reconstruction. This chapter connects that research question to a task available now: tracing a plotted value to its observation, converted sample, and selected data window.',
    reading: [
      'The overview is a reduced set of source samples for navigation. Exact local samples are loaded separately; inspecting or exporting a window uses those converted records.',
      'Conversion checks concern data handling: product identity, record counts, ranges, binary hashes, and source comparisons. They do not establish the accuracy of a reconstruction method.',
      'A useful record separates an observed value, a possible interpretation, and the evidence still needed. Optical depth is not a direct measurement of mass density, and a single spike is not enough to claim a discovery.',
    ],
    exercise: 'Inspect two nearby exact samples. Save their observation and range with your note, then download the selected data and compare the sample identifiers and numerical values.',
    details: [
      'The data path is source PDS product → converted records → reduced display overview or exact local samples. Research-derived root, branch, diagnostic, and reconstructed products would form a separate downstream stage.',
      'Reproducibility requires a data version, variable definition, window bounds, source sample identity, and a stated processing mode. Keep these with the observation record; a view of a later data version should not be treated as an exact reproduction of a previous one.',
    ],
    next: 'Reopen your saved exploration, change the window size, and state how the additional context changes what you can assess.',
    unavailable: 'Project reliability diagnostics, reconstructed profiles, and validation figures: not yet available.',
  },
]

export function getResearchModule(moduleSlug) {
  return researchModules.find((module) => module.slug === moduleSlug)
}
