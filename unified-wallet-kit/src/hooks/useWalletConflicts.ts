import { useEffect, useMemo, useState } from 'react'
import { getWallets } from '@wallet-standard/app'
import { detectWalletConflicts, type IWalletConflict } from '../misc/walletConflicts'

/** Re-evaluates conflicts as wallets (un)register in the Wallet Standard. */
export function useWalletConflicts(): IWalletConflict[] {
  const { get, on } = useMemo(() => getWallets(), [])
  const [conflicts, setConflicts] = useState<IWalletConflict[]>(() => detectWalletConflicts(get()))

  useEffect(() => {
    const refresh = () => setConflicts(detectWalletConflicts(get()))
    const listeners = [on('register', refresh), on('unregister', refresh)]
    return () => listeners.forEach((off) => off())
  }, [get, on])

  return conflicts
}
