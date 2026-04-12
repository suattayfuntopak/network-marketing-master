export function buildPageWindow(currentPage: number, totalPages: number, maxVisible = 5) {
  if (totalPages <= 0) return []

  const safeMaxVisible = Math.max(1, maxVisible)
  const half = Math.floor(safeMaxVisible / 2)

  let start = Math.max(1, currentPage - half)
  const end = Math.min(totalPages, start + safeMaxVisible - 1)

  if (end - start + 1 < safeMaxVisible) {
    start = Math.max(1, end - safeMaxVisible + 1)
  }

  return Array.from({ length: end - start + 1 }, (_, index) => start + index)
}
