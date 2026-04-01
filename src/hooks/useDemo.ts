export function useDemo(): boolean {
  const params = new URLSearchParams(window.location.search)
  return params.get('demo') === 'true'
}
