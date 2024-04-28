import { AbstractConnector } from '@web3-react/abstract-connector'
import { ConnectorUpdate } from '@web3-react/types'
import { AbstractConnectorArguments } from '@web3-react/types'

const __DEV__ = false

export type SendReturnResult = { result: any }
export type SendReturn = any

export type Send = (method: string, params?: any[]) => Promise<SendReturnResult | SendReturn>
export type SendOld = ({ method }: { method: string }) => Promise<SendReturnResult | SendReturn>

export type TokenPocketProvider = { isTokenPocket?: boolean; isConnected?: () => boolean }

export type TPConnectorArguments = AbstractConnectorArguments

function parseSendReturn(sendReturn: SendReturnResult | SendReturn): any {
  return sendReturn.hasOwnProperty('result') ? sendReturn.result : sendReturn
}

export class NoTokenPocketProviderError extends Error {
  public constructor() {
    super()
    this.name = this.constructor.name
    this.message = 'No Token Pocket provider was found on window.tokenpocket'
  }
}

export class UserRejectedRequestError extends Error {
  public constructor() {
    super()
    this.name = this.constructor.name
    this.message = 'The user rejected the request.'
  }
}

export class TPConnector extends AbstractConnector {
  constructor(config: TPConnectorArguments) {
    super(config)

    this.handleNetworkChanged = this.handleNetworkChanged.bind(this)
    this.handleChainChanged = this.handleChainChanged.bind(this)
    this.handleAccountsChanged = this.handleAccountsChanged.bind(this)
    this.handleClose = this.handleClose.bind(this)
  }

  async activate(): Promise<ConnectorUpdate<string | number>> {
    if (!(window as any).tokenpocket) throw new NoTokenPocketProviderError()

    const eth = (window as any).tokenpocket.ethereum
    if (!!eth.on) {
      eth.on('chainChanged', this.handleChainChanged as any)
      eth.on('accountsChanged', this.handleAccountsChanged as any)
      eth.on('close', this.handleClose as any)
      eth.on('networkChanged', this.handleNetworkChanged as any)
    }

    if (eth.isMetaMask) {
      ;(eth as any).autoRefreshOnNetworkChange = false
    }

    let account
    try {
      account = await eth.request({ method: 'eth_requestAccounts' }).then((result: any) => parseSendReturn(result)[0])
    } catch (err) {
      if (err.code === 4001) throw new UserRejectedRequestError()
      console.warn('eth_requestAccounts was unsuccessful, falling back to enable')
    }
    if (!account) {
      account = await eth.enable().then((result: any) => result && parseSendReturn(result)[0])
    }

    return {
      provider: eth,
      account
    }
  }
  async getProvider(): Promise<TokenPocketProvider | undefined> {
    return (window as any).tokenpocket?.ethereum
  }

  async getChainId(): Promise<string | number> {
    if (!(window as any).tokenpocket) throw new NoTokenPocketProviderError()
    const eth = (window as any).tokenpocket.ethereum
    let chainId
    try {
      chainId = await eth.request({ method: 'eth_chainId' }).then(parseSendReturn)
    } catch {
      console.warn('eth_chainId was unsuccessful, falling back to net_version')
    }
    if (!chainId) {
      try {
        chainId = await eth.request({ method: 'net_version' }).then(parseSendReturn)
      } catch {
        console.warn('net_version was unsuccessful')
      }
    }
    if (!chainId) {
      if ((eth as any).isDapper) {
        chainId = (eth as any).cachedResults?.net_version
      } else {
        chainId = eth.chainId || eth.networkVersion || (eth as any)._chainId
      }
    }

    return chainId
  }

  async getAccount(): Promise<string | null> {
    if (!(window as any).tokenpocket) throw new NoTokenPocketProviderError()
    const eth = (window as any).tokenpocket.ethereum

    let account
    try {
      account = await eth.request({ method: 'eth_accounts' }).then((result: any) => parseSendReturn(result)[0])
    } catch {
      console.warn('eth_accounts was unsuccessful, falling back to enable')
    }
    if (!account) {
      try {
        account = await eth.enable().then((result: any) => result && parseSendReturn(result)[0])
      } catch {
        console.warn('enable was unsuccessful')
      }
    }
    return account
  }
  deactivate(): void {
    const eth = (window as any).tokenpocket?.ethereum
    if (!eth || !eth.removeListener) return
    eth.removeListener('chainChanged', this.handleChainChanged)
    eth.removeListener('accountsChanged', this.handleAccountsChanged)
    eth.removeListener('close', this.handleClose)
    eth.removeListener('networkChanged', this.handleNetworkChanged)
  }

  private handleChainChanged(chainId: string | number): void {
    if (__DEV__) {
      console.log("Handling 'chainChanged' event with payload", chainId)
    }
    this.emitUpdate({ chainId, provider: (window as any).tokenpocket?.ethereum })
  }

  private handleAccountsChanged(accounts: string[]): void {
    if (__DEV__) {
      console.log("Handling 'accountsChanged' event with payload", accounts)
    }
    if (accounts.length === 0) {
      this.emitDeactivate()
    } else {
      this.emitUpdate({ account: accounts[0] })
    }
  }

  private handleClose(code: number, reason: string): void {
    if (__DEV__) {
      console.log("Handling 'close' event with payload", code, reason)
    }
    this.emitDeactivate()
  }

  private handleNetworkChanged(networkId: string | number): void {
    if (__DEV__) {
      console.log("Handling 'networkChanged' event with payload", networkId)
    }
    this.emitUpdate({ chainId: networkId, provider: (window as any).tokenpocket?.ethereum })
  }
}
