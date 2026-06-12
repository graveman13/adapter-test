import { useEffect, useMemo, useState } from 'react'
import type { Adapter } from '@solana/wallet-adapter-base'
import {
  StandardWalletAdapter,
  isWalletAdapterCompatibleWallet,
  type WalletAdapterCompatibleWallet,
} from '@solana/wallet-standard-wallet-adapter-base'
import { getWallets } from '@wallet-standard/app'
import type { Wallet as StandardWallet } from '@wallet-standard/base'

/**
 * Detects browser wallets that register themselves through the Wallet Standard
 * and wraps them into regular wallet adapters. Explicitly passed adapters with
 * the same name are replaced by the detected standard wallet (it is the live,
 * installed one).
 */
export function useStandardWalletAdapters(adapters: Adapter[]): Adapter[] {
  const { get, on } = useMemo(() => getWallets(), [])
  const [standardWallets, setStandardWallets] = useState<readonly StandardWallet[]>(() => get())

  useEffect(() => {
    const listeners = [
      on('register', () => setStandardWallets(get())),
      on('unregister', () => setStandardWallets(get())),
    ]
    return () => listeners.forEach((off) => off())
  }, [get, on])

  return useMemo(() => {
    const standardAdapters = standardWallets
      .filter(isWalletAdapterCompatibleWallet)
      .map(
        (wallet) =>
          new StandardWalletAdapter({ wallet: wallet as WalletAdapterCompatibleWallet }),
      )

    return [
      ...standardAdapters,
      // keep explicit adapters that were not detected via wallet-standard
      ...adapters.filter(
        (adapter) => !standardAdapters.some((standard) => standard.name === adapter.name),
      ),
    ]
  }, [adapters, standardWallets])
}
