import type { Wallet as StandardWallet } from '@wallet-standard/base'

export interface IWalletConflict {
  /** the wallet whose identity is being hijacked */
  walletName: string
  /** the extension suspected of intercepting it, if identifiable */
  interceptedBy?: string
  reason: 'provider-impersonation' | 'duplicate-registration'
}

/**
 * A browser extension cannot be blocked from a web page, but interception
 * leaves traces we can detect:
 *  - the injected provider carries a foreign identity flag
 *    (e.g. window.phantom.solana.isBackpack === true when Backpack
 *    enables its "default wallet" mode)
 *  - two wallets register under the same name in the Wallet Standard
 */
export function detectWalletConflicts(
  standardWallets: readonly StandardWallet[] = [],
): IWalletConflict[] {
  const conflicts: IWalletConflict[] = []
  if (typeof window === 'undefined') return conflicts
  const w = window as any

  // Phantom provider hijacked by another extension
  const phantomProvider = w.phantom?.solana
  if (phantomProvider) {
    if (phantomProvider.isBackpack === true || (w.backpack && phantomProvider === w.backpack)) {
      conflicts.push({
        walletName: 'Phantom',
        interceptedBy: 'Backpack',
        reason: 'provider-impersonation',
      })
    } else if (phantomProvider.isPhantom !== true) {
      conflicts.push({ walletName: 'Phantom', reason: 'provider-impersonation' })
    }
  }

  // Solflare provider hijacked
  const solflareProvider = w.solflare
  if (solflareProvider && solflareProvider.isSolflare !== true) {
    conflicts.push({ walletName: 'Solflare', reason: 'provider-impersonation' })
  }

  // duplicate registrations in the Wallet Standard registry
  const counts = new Map<string, number>()
  for (const wallet of standardWallets) {
    counts.set(wallet.name, (counts.get(wallet.name) ?? 0) + 1)
  }
  for (const [name, count] of counts) {
    if (count > 1 && !conflicts.some((c) => c.walletName === name)) {
      conflicts.push({ walletName: name, reason: 'duplicate-registration' })
    }
  }

  return conflicts
}
