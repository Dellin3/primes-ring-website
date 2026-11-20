export const feedbackCategories = [
  { value: 'content', label: 'Content or explanation' },
  { value: 'bug', label: 'Website bug' },
  { value: 'idea', label: 'Suggestion' },
  { value: 'other', label: 'Other' },
]

export function feedbackPagePath(value) {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || value.includes('\\') || [...value].some(char => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127)) return ''
  return value.slice(0, 1000)
}
