export const combine = ([head, ...[headTail, ...tailTail]], separator = ' - ') => {
  if (!headTail) return head

  const combined = headTail.reduce((acc, x) => {
    return acc.concat(head.map(h => `${h} - ${x}`))
  }, [])

  return combine([combined, ...tailTail])
}
