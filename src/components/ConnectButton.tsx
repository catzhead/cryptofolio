import { ConnectButton as RainbowConnectButton } from '@rainbow-me/rainbowkit'

export function ConnectButton() {
  return (
    <RainbowConnectButton.Custom>
      {({ account, chain, openConnectModal, openChainModal, openAccountModal, mounted }) => {
        const connected = mounted && account && chain

        return (
          <div
            {...(!mounted && {
              'aria-hidden': true,
              style: { opacity: 0, pointerEvents: 'none', userSelect: 'none' },
            })}
          >
            {!connected ? (
              <button
                onClick={openConnectModal}
                className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Connect Wallet
              </button>
            ) : (
              <button
                onClick={openAccountModal}
                className="bg-slate-800 hover:bg-slate-700 text-green-400 px-4 py-2 rounded-lg font-mono text-sm transition-colors"
              >
                {account.displayName}
              </button>
            )}
          </div>
        )
      }}
    </RainbowConnectButton.Custom>
  )
}
