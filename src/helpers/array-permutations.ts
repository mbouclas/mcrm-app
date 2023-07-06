export const combine = ([head, ...[headTail, ...tailTail]], separator = ' - ', prefix = '') => {
  if (!headTail) return head;

  const combined = headTail.reduce((acc, x) => {
    return acc.concat(head.map((h) => `${prefix ? `${prefix} ${separator}` : ''} ${h} ${separator} ${x}`));
  }, []);

  return combine([combined, ...tailTail]);
};
