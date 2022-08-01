export function highlighter(str: string, term: string) {
  if (!str || typeof str !== 'string') {return str;}
  return str.replace(new RegExp(term, "gi"), (match) => `<mark>${match}</mark>`);
}

export function qsMatcher(str: string, term: string) {
  return str.match(new RegExp(term, "gi"));
}
