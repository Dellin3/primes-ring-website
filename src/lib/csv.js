export function parseNumericValue(value) {
  if (value === null || value === undefined) return null
  const text = String(value).trim()
  if (!text) return null
  const parsed = Number(text)
  return Number.isFinite(parsed) ? parsed : null
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

export function parseCsvText(csvText) {
  const lines = csvText.trim().split(/\r?\n/).filter((line) => (
    line.trim() && !line.trimStart().startsWith('#')
  ))
  if (lines.length < 2) return []

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

export function rowsToCsv(rows) {
  if (!rows.length) return ''
  const headers = Object.keys(rows[0])
  return [
    headers.join(','),
    ...rows.map((row) => headers.map((header) => escapeCsvValue(row[header])).join(',')),
  ].join('\n')
}

export function numericColumns(rows) {
  if (!rows.length) return []
  return Object.keys(rows[0]).filter((column) => {
    const validValues = rows
      .map((row) => parseNumericValue(row[column]))
      .filter((value) => value !== null)
    return validValues.length / rows.length > 0.8
  })
}

export function profilePoints(rows, yColumn = 'normal_optical_depth') {
  return rows
    .map((row) => ({
      x: parseNumericValue(row.ring_radius_km),
      y: parseNumericValue(row[yColumn]),
      row,
    }))
    .filter((point) => point.x !== null && point.y !== null)
    .sort((left, right) => left.x - right.x)
}
