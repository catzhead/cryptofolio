import React from 'react'
import ReactDOM from 'react-dom/client'
import { WagmiProvider } from 'wagmi'
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import '@rainbow-me/rainbowkit/styles.css'
import { config } from './wagmiConfig'
import { queryClient, persister } from './queryClient'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WagmiProvider config={config}>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{
          persister,
          maxAge: 1000 * 60 * 60 * 24,
          dehydrateOptions: {
            shouldDehydrateQuery: (query) => query.state.status === 'success',
          },
        }}
      >
        <RainbowKitProvider theme={darkTheme()}>
          <App />
        </RainbowKitProvider>
      </PersistQueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>,
)
