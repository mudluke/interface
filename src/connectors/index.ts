import { Web3Provider } from '@ethersproject/providers'
import { InjectedConnector } from '@web3-react/injected-connector'
import { WalletLinkConnector } from '@web3-react/walletlink-connector'
import { PortisConnector } from '@web3-react/portis-connector'

import { FortmaticConnector } from './Fortmatic'
import { NetworkConnector } from './NetworkConnector'
import { TPConnector } from './TPConnector'
import { WalletConnectConnector } from '@web3-react/walletconnect-connector'
// import { WalletConnectConnector } from './WCConnector'

const NETWORK_URL = process.env.REACT_APP_NETWORK_URL
const FORMATIC_KEY = process.env.REACT_APP_FORTMATIC_KEY
// const WC_PROJECT_ID = process.env.REACT_APP_WC_PROJECT_ID
const PORTIS_ID = process.env.REACT_APP_PORTIS_ID

export const NETWORK_CHAIN_ID: number = parseInt(process.env.REACT_APP_CHAIN_ID ?? '1')

if (typeof NETWORK_URL === 'undefined') {
  throw new Error(`REACT_APP_NETWORK_URL must be a defined environment variable`)
}

export const network = new NetworkConnector({
  urls: { [NETWORK_CHAIN_ID]: NETWORK_URL }
})

let networkLibrary: Web3Provider | undefined
export function getNetworkLibrary(): Web3Provider {
  return (networkLibrary = networkLibrary ?? new Web3Provider(network.provider as any))
}

export const injected = new InjectedConnector({
  supportedChainIds: [1, 3, 4, 5, 42, 168169]
})

export const tokenPocket = new TPConnector({
  supportedChainIds: [1, 3, 4, 5, 42, 168169]
})
export const walletconnect = new WalletConnectConnector({
  rpc: { 1: NETWORK_URL },
  bridge: 'https://bridge.walletconnect.org',
  qrcode: true,
  pollingInterval: 15000
})

// mainnet only
// export const walletconnect = new WalletConnectConnector({
//   metadata: {
//     name: 'Uniswap',
//     description: 'Uniswap',
//     url: '',
//     icons: []
//   },
//   rpcMap: {
//     168167: NETWORK_URL
//   },
//   chains: [1, 3, 4, 5, 42, 168167],
//   showQrModal: true,
//   projectId: WC_PROJECT_ID as string
// })

// mainnet only
export const fortmatic = new FortmaticConnector({
  apiKey: FORMATIC_KEY ?? '',
  chainId: 1
})

// mainnet only
export const portis = new PortisConnector({
  dAppId: PORTIS_ID ?? '',
  networks: [1]
})

// mainnet only
export const walletlink = new WalletLinkConnector({
  url: NETWORK_URL,
  appName: 'Uniswap',
  appLogoUrl:
    'https://mpng.pngfly.com/20181202/bex/kisspng-emoji-domain-unicorn-pin-badges-sticker-unicorn-tumblr-emoji-unicorn-iphoneemoji-5c046729264a77.5671679315437924251569.jpg'
})
