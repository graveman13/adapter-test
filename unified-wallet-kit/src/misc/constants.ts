import { PublicKey } from '@solana/web3.js'
import type { WalletName } from '@solana/wallet-adapter-base'
import type { IHardcodedWalletStandardAdapter } from '../types'

export const WRAPPED_SOL_MINT = new PublicKey('So11111111111111111111111111111111111111112')

// Wallets shown in the list even when not detected, with install links.
export const HARDCODED_WALLET_STANDARDS: IHardcodedWalletStandardAdapter[] = [
  {
    id: 'Phantom',
    name: 'Phantom' as WalletName,
    url: 'https://phantom.app',
    icon: 'https://raw.githubusercontent.com/solana-labs/wallet-adapter/master/packages/wallets/icons/phantom.svg',
    deepLink: () =>
      `https://phantom.app/ul/browse/${encodeURIComponent(window.location.href)}?ref=${encodeURIComponent(window.location.origin)}`,
  },
  {
    id: 'Solflare',
    name: 'Solflare' as WalletName,
    url: 'https://solflare.com',
    icon: 'https://raw.githubusercontent.com/solana-labs/wallet-adapter/master/packages/wallets/icons/solflare.svg',
    deepLink: () =>
      `https://solflare.com/ul/v1/browse/${encodeURIComponent(window.location.href)}?ref=${encodeURIComponent(window.location.origin)}`,
  },
  {
    id: 'Backpack',
    name: 'Backpack' as WalletName,
    url: 'https://backpack.app',
    icon: 'https://raw.githubusercontent.com/coral-xyz/backpack/master/assets/backpack.png',
  },
  {
    id: 'Coinbase Wallet',
    name: 'Coinbase Wallet' as WalletName,
    url: 'https://www.coinbase.com/wallet',
    icon: 'https://raw.githubusercontent.com/solana-labs/wallet-adapter/master/packages/wallets/icons/coinbase.svg',
  },
  {
    id: 'Trust',
    name: 'Trust' as WalletName,
    url: 'https://trustwallet.com',
    icon: 'https://raw.githubusercontent.com/solana-labs/wallet-adapter/master/packages/wallets/icons/trust.svg',
  },
]
