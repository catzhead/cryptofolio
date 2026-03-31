import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ConnectButton } from './ConnectButton'

vi.mock('@rainbow-me/rainbowkit', () => ({
  ConnectButton: {
    Custom: ({ children }: { children: (props: any) => React.ReactNode }) =>
      children({
        account: undefined,
        chain: undefined,
        openConnectModal: vi.fn(),
        mounted: true,
      }),
  },
}))

describe('ConnectButton', () => {
  it('renders connect button when not connected', () => {
    render(<ConnectButton />)
    expect(screen.getByText('Connect Wallet')).toBeInTheDocument()
  })
})
