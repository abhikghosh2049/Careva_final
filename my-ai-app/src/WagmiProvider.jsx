import { createWeb3Modal } from '@web3modal/wagmi/react'
import { defaultWagmiConfig } from '@web3modal/wagmi/react/config'
import { WagmiProvider } from 'wagmi'
import { celoAlfajores } from 'wagmi/chains'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// 0. Setup queryClient
const queryClient = new QueryClient()

// 1. Get a project ID from https://cloud.walletconnect.com
const projectId = 'e5846fe998bf8de9a36f6b81bbee6b90' // <-- PASTE YOUR ID HERE

// 2. Create wagmiConfig
const metadata = {
  name: 'Careva',
  description: 'Careva AI Healthcare',
  url: 'http://localhost:5173', // origin must match your domain & subdomain
  icons: ['https://avatars.githubusercontent.com/u/37784886']
}

const chains = [celoAlfajores]
const wagmiConfig = defaultWagmiConfig({
  chains,
  projectId,
  metadata,
  enableAnalytics: true // Optional - defaults to your Cloud configuration
})

// 3. Create modal
createWeb3Modal({
  wagmiConfig,
  projectId,
  chains,
  themeMode: 'light',
  themeVariables: {
    '--w3m-color-mix': '#d81b60', // Your app's primary-light color
    '--w3m-accent': '#004d40' // Your app's primary-dark color
  }
})

// 4. Create the provider component
export function Web3ModalProvider({ children }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  )
}