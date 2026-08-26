// JS's built-in toUpperCase() is locale-unaware: it maps 'i' to 'I', not the
// correct Turkish 'İ'. CSS text-transform:uppercase has the same problem, so
// neither can be trusted for Turkish text — do the mapping ourselves first.
export function turkishUpperCase(value: string): string {
  return value.replace(/i/g, 'İ').replace(/ı/g, 'I').toUpperCase();
}
