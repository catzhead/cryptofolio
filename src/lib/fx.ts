const BASE = 'https://api.frankfurter.dev/v1'

export async function fetchFXRate(isoDate: string): Promise<number> {
  const res = await fetch(`${BASE}/${isoDate}?base=USD&symbols=SGD`)
  if (!res.ok) throw new Error(`Frankfurter error: ${res.status}`)
  const data = await res.json()
  return data.rates.SGD
}

export async function fetchCurrentFXRate(): Promise<number> {
  const res = await fetch(`${BASE}/latest?base=USD&symbols=SGD`)
  if (!res.ok) throw new Error(`Frankfurter error: ${res.status}`)
  const data = await res.json()
  return data.rates.SGD
}
