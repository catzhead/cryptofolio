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
  usd_price: number | null
  usd_price_24hr_percent_change: number | null
  usd_value: number | null
  logo: string | null
  possible_spam: boolean
  native_token: boolean
  portfolio_percentage: number
}

interface MoralisWalletTokensResponse {
  result: MoralisTokenBalance[]
  cursor: string | null
}

export async function fetchTokenBalances(
  address: string,
  chain: string,
): Promise<MoralisTokenBalance[]> {
  const params = new URLSearchParams({
    chain,
    exclude_spam: 'true',
    exclude_unverified_contracts: 'true',
  })
  const url = `${MORALIS_BASE}/wallets/${address}/tokens?${params}`
  const res = await fetch(url, { headers: headers() })
  if (!res.ok) throw new Error(`Moralis balances error: ${res.status}`)
  const data: MoralisWalletTokensResponse = await res.json()
  return data.result.filter((t) => !t.possible_spam)
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
