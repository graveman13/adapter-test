// Mirrors the public API of @jup-ag/wallet-adapter (Unified Wallet Kit)
export * from '@solana/wallet-adapter-base'

export {
  UnifiedWalletProvider,
  useUnifiedWallet,
  useUnifiedWalletContext,
} from './contexts/UnifiedWalletProvider'

// compat: the original re-exports @solana/wallet-adapter-react's useWallet
export { useWallet, WalletContext } from './contexts/WalletConnectionProvider'
export type { WalletContextState, Wallet } from './contexts/WalletConnectionProvider'

export {
  UnifiedWalletContext,
  MWA_NOT_FOUND_ERROR,
} from './contexts/UnifiedWalletContext'
export type { IUnifiedWalletContext, IUnifiedTheme } from './contexts/UnifiedWalletContext'

export { default as HardcodedWalletStandardAdapter } from './adapters/HardcodedWalletStandardAdapter'

export { UnifiedWalletButton } from './components/UnifiedWalletButton'
export { CurrentUserBadge } from './components/CurrentUserBadge'
export { WalletIcon } from './components/WalletIcon'
export { WalletListItem } from './components/UnifiedWalletModal/WalletListItem'
export { default as UnifiedWalletModal } from './components/UnifiedWalletModal'

export {
  TranslationProvider,
  useTranslation,
} from './contexts/TranslationProvider'
export {
  DEFAULT_LANGUAGE,
  OTHER_LANGUAGES,
  LANGUAGE_LABELS,
  i18n,
} from './contexts/TranslationProvider/i18n'

export {
  PreviouslyConnectedProvider,
  usePreviouslyConnected,
} from './contexts/WalletConnectionProvider/previouslyConnectedProvider'

export { HARDCODED_WALLET_STANDARDS, WRAPPED_SOL_MINT } from './misc/constants'
// isIosAndRedirectable is re-exported from wallet-adapter-base above
export {
  numberFormatter,
  formatNumber,
  shortenAddress,
  fromLamports,
  toLamports,
  useReactiveEventListener,
  isMobile,
  detectedSeparator,
  useOutsideClick,
  useDebouncedEffect,
} from './misc/utils'

export type {
  IUnifiedWalletConfig,
  IUnifiedWalletMetadata,
  IWalletNotification,
  IHardcodedWalletStandardAdapter,
  AllLanguage,
} from './types'
