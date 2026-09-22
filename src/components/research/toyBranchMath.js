// Teaching equation retained from the previous StationaryPhaseDemo in this repository.
// It is independent of Cassini data and is not a reconstruction algorithm.
export const toyFold = { x: -Math.cbrt(27 / 4), y: -Math.cbrt(1 / 2) }

export function toyEquation(x, y) {
  return y ** 3 + x * y - 1
}

export function toyRoots(x) {
  if (!Number.isFinite(x) || x < -8 || x > 2) return []
  const critical = x < 0 ? Math.sqrt(-x / 3) : 0
  const boundaries = x < 0 ? [-5, -critical, critical, 5] : [-5, 5]
  const roots = boundaries.filter((y) => Math.abs(toyEquation(x, y)) < 1e-12)
  for (let index = 1; index < boundaries.length; index += 1) {
    let low = boundaries[index - 1]
    let high = boundaries[index]
    let lowValue = toyEquation(x, low)
    const highValue = toyEquation(x, high)
    if (Math.abs(lowValue) < 1e-12 || Math.abs(highValue) < 1e-12 || lowValue * highValue >= 0) continue
    for (let step = 0; step < 50; step += 1) {
      const middle = (low + high) / 2
      const value = toyEquation(x, middle)
      if (lowValue * value <= 0) high = middle
      else { low = middle; lowValue = value }
    }
    roots.push((low + high) / 2)
  }
  return roots.sort((a, b) => a - b).filter((value, index, values) => index === 0 || Math.abs(value - values[index - 1]) > 1e-8)
}
