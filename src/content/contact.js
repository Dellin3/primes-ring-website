export const contact = {
  name: 'Dell Li',
  email: 'Zhuoxuan780123@gmail.com',
}

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

export function feedbackEmailBody({ category, message, name, email, page }) {
  const label = feedbackCategories.find(item => item.value === category)?.label || 'Website feedback'
  return [
    'Saturn — A Cassini Explorer',
    `Topic: ${label}`,
    page ? `Page: ${page}` : '',
    name.trim() ? `Name: ${name.trim()}` : '',
    email.trim() ? `Reply to: ${email.trim()}` : '',
    '',
    message.trim(),
  ].filter((line, index) => line || index === 5).join('\n')
}
