export function requiresContinuityNeutralPoints(variable) {
  if (variable?.id !== 'phase_shift') return false
  return variable?.display_semantics?.continuity !== 'verified source continuity'
}
