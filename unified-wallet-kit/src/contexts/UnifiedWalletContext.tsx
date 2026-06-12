import { createContext, useContext } from 'react'
import type { Adapter } from '@solana/wallet-adapter-base'
import type { IUnifiedTheme, IUnifiedWalletConfig } from '../types'
import { useWallet, type WalletContextState } from './WalletConnectionProvider'

export { MWA_NOT_FOUND_ERROR } from '../types'
export type { IUnifiedTheme }

export interface IUnifiedWalletContext {
  walletPrecedence: IUnifiedWalletConfig['walletPrecedence']
  handleConnectClick: (
    event: React.MouseEvent<HTMLElement, globalThis.MouseEvent>,
    wallet: Adapter,
  ) => Promise<void>
  showModal: boolean
  setShowModal: (showModal: boolean) => void
  walletlistExplanation: IUnifiedWalletConfig['walletlistExplanation']
  theme: IUnifiedTheme
  walletAttachments: IUnifiedWalletConfig['walletAttachments']
  walletModalAttachments: IUnifiedWalletConfig['walletModalAttachments']
}

export const UnifiedWalletContext = createContext<IUnifiedWalletContext>({
  walletPrecedence: undefined,
  handleConnectClick: async () => {},
  showModal: false,
  setShowModal: () => {},
  walletlistExplanation: undefined,
  theme: 'light',
  walletAttachments: undefined,
  walletModalAttachments: undefined,
})

export const useUnifiedWalletContext = (): IUnifiedWalletContext =>
  useContext(UnifiedWalletContext)

// The value context simply re-exposes the wallet context state, mirroring
// the original's UnifiedWalletValueContext indirection.
export const useUnifiedWallet = (): WalletContextState => useWallet()
