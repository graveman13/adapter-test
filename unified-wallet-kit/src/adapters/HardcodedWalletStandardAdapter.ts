import {
  BaseSignerWalletAdapter,
  WalletName,
  WalletNotReadyError,
  WalletReadyState,
} from '@solana/wallet-adapter-base'
import type { Keypair, Transaction, TransactionVersion, VersionedTransaction } from '@solana/web3.js'
import type { IHardcodedWalletStandardAdapter } from '../types'

/**
 * A placeholder adapter for wallets that are NOT detected in the browser.
 * It exists only so the wallet shows up in the modal list; clicking it
 * triggers the "not installed" flow (install link / deep link) instead of
 * a real connection.
 */
export default class HardcodedWalletStandardAdapter extends BaseSignerWalletAdapter {
  name: WalletName
  url: string
  icon: string
  deepLink?: () => string
  supportedTransactionVersions: ReadonlySet<TransactionVersion> = new Set(['legacy', 0])

  /**
   * Storing a keypair locally like this is not safe because any application
   * using this adapter could retrieve the secret key, and the keypair is lost
   * on disconnect or refresh. Kept null — this adapter never really connects.
   */
  private _keypair: Keypair | null = null
  readyState: WalletReadyState = WalletReadyState.NotDetected

  constructor({ name, url, icon, deepLink }: Omit<IHardcodedWalletStandardAdapter, 'id'>) {
    super()
    this.name = name
    this.url = url
    this.icon = icon
    this.deepLink = deepLink
  }

  get connecting() {
    return false
  }

  get publicKey() {
    return this._keypair?.publicKey ?? null
  }

  async connect(): Promise<void> {
    throw new WalletNotReadyError()
  }

  async disconnect(): Promise<void> {
    this._keypair = null
    this.emit('disconnect')
  }

  async signTransaction<T extends Transaction | VersionedTransaction>(_transaction: T): Promise<T> {
    throw new WalletNotReadyError()
  }
}
