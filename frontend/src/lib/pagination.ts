export function visiblePages(current: number, total: number, compact = false): Array<number | 'ellipsis'> {
  if (total <= 1) return total === 1 ? [0] : []
  const radius = compact ? 0 : 1
  const keep = new Set([0, total - 1, ...Array.from({ length: radius * 2 + 1 }, (_, index) => current - radius + index)])
  const pages = [...keep].filter(page => page >= 0 && page < total).sort((a, b) => a - b)
  const result: Array<number | 'ellipsis'> = []
  pages.forEach((page, index) => {
    if (index && page - pages[index - 1] > 1) result.push('ellipsis')
    result.push(page)
  })
  return result
}
