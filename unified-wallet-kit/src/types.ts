import type { ReactNode } from 'react'
import type {
  Adapter,
  SupportedTransactionVersions,
  WalletName,
} from '@solana/wallet-adapter-base'
import type { Cluster } from '@solana/web3.js'

export const MWA_NOT_FOUND_ERROR = 'MWA_NOT_FOUND_ERROR'

export type IUnifiedTheme = 'light' | 'dark' | 'jupiter'

export interface IWalletNotification {
  publicKey: string
  shortAddress: string
  walletName: string
  metadata: {
    name: string
    url: string
    icon: string
    supportedTransactionVersions?: SupportedTransactionVersions
  }
}

export interface IHardcodedWalletStandardAdapter {
  id: string
  name: WalletName
  url: string
  icon: string
  deepLink?: () => string
}

export interface IUnifiedWalletMetadata {
  name: string
  url: string
  description: string
  iconUrls: string[]
  additionalInfo?: string
}

export interface IUnifiedWalletConfig {
  autoConnect: boolean
  metadata: IUnifiedWalletMetadata
  env: Cluster
  walletPrecedence?: WalletName[]
  hardcodedWallets?: IHardcodedWalletStandardAdapter[]
  notificationCallback?: {
    onConnect: (props: IWalletNotification) => void
    onConnecting: (props: IWalletNotification) => void
    onDisconnect: (props: IWalletNotification) => void
    onNotInstalled: (props: IWalletNotification) => void
  }
  walletlistExplanation?: {
    href: string
  }
  theme?: IUnifiedTheme
  lang?: AllLanguage
  walletAttachments?: Record<string, { attachment: ReactNode }>
  walletModalAttachments?: {
    footer?: ReactNode
  }
}

export const DEFAULT_LANGUAGE = 'en' as const
export const OTHER_LANGUAGES = ['zh', 'vi', 'fr', 'ja', 'id', 'ru'] as const
export type AllLanguage = typeof DEFAULT_LANGUAGE | (typeof OTHER_LANGUAGES)[number]

export type { Adapter, WalletName, Cluster }
