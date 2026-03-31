export interface TokenBalance {
  tokenAddress: string
  symbol: string
  name: string
  decimals: number
  balance: string
  balanceFormatted: string
  usdPrice: number
  usdValue: number
  usdPrice24hrPercentChange: number
  chain: ChainKey
  logo?: string
}

export type ChainKey = 'ethereum' | 'arbitrum' | 'polygon' | 'bsc'

export interface Trade {
  transactionHash: string
  blockTimestamp: string
  fromAddress: string
  toAddress: string
  value: string
  valueFormatted: number
  tokenSymbol: string
  tokenDecimals: number
  type: 'buy' | 'sell'
  usdValue?: number
  sgdThen?: number
  sgdNow?: number
  fxImpact?: number
}

export interface OHLCCandle {
  time: number
  open: number
  high: number
  low: number
  close: number
}

export type TimeRange = '1' | '7' | '14' | '30' | '90' | '180' | '365' | 'max'

export interface TimeRangeOption {
  label: string
  days: TimeRange
}

export const TIME_RANGE_OPTIONS: TimeRangeOption[] = [
  { label: '1D', days: '1' },
  { label: '1W', days: '7' },
  { label: '2W', days: '14' },
  { label: '1M', days: '30' },
  { label: '3M', days: '90' },
  { label: '6M', days: '180' },
  { label: '1Y', days: '365' },
  { label: 'ALL', days: 'max' },
]
