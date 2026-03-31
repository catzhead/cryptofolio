const MORALIS_BASE = 'https://deep-index.moralis.io/api/v2.2'

function headers(): HeadersInit {
  return { 'X-API-Key': import.meta.env.VITE_MORALIS_API_KEY }
}

interface MoralisTokenBalance {
  token_address: string
  symbol: string
  name: string
  decimals: number
  balance: string
  balance_formatted: string
  usd_price: number
  usd_price_24hr_percent_change: number
  usd_value: number
  logo: string | null
  possible_spam: boolean
}

export async function fetchTokenBalances(
  address: string,
  chain: string,
): Promise<MoralisTokenBalance[]> {
  const url = `${MORALIS_BASE}/${address}/erc20?chain=${chain}&exclude_spam=true`
  const res = await fetch(url, { headers: headers() })
  if (!res.ok) throw new Error(`Moralis balances error: ${res.status}`)
  const data: MoralisTokenBalance[] = await res.json()
  return data.filter((t) => !t.possible_spam)
}

interface MoralisTransferResponse {
  cursor: string | null
  result: MoralisTransfer[]
}

export interface MoralisTransfer {
  transaction_hash: string
  block_timestamp: string
  from_address: string
  to_address: string
  value: string
  token_symbol: string
  token_decimals: string
}

export async function fetchTokenTransfers(
  address: string,
  chain: string,
  contractAddress: string,
): Promise<MoralisTransfer[]> {
  const allTransfers: MoralisTransfer[] = []
  let cursor: string | null = null

  do {
    const params = new URLSearchParams({
      chain,
      'contract_addresses[]': contractAddress,
      order: 'ASC',
      limit: '100',
    })
    if (cursor) params.set('cursor', cursor)

    const url = `${MORALIS_BASE}/${address}/erc20/transfers?${params}`
    const res = await fetch(url, { headers: headers() })
    if (!res.ok) throw new Error(`Moralis transfers error: ${res.status}`)

    const data: MoralisTransferResponse = await res.json()
    allTransfers.push(...data.result)
    cursor = data.cursor
  } while (cursor)

  return allTransfers
}
