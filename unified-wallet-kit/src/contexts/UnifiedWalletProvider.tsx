import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Adapter } from '@solana/wallet-adapter-base'
import { WalletReadyState } from '@solana/wallet-adapter-base'
import type { IUnifiedWalletConfig, IWalletNotification } from '../types'
import { MWA_NOT_FOUND_ERROR } from '../types'
import { shortenAddress } from '../misc/utils'
import { TranslationProvider } from './TranslationProvider'
import WalletConnectionProvider, { useWallet } from './WalletConnectionProvider'
import { UnifiedWalletContext, useUnifiedWallet, useUnifiedWalletContext } from './UnifiedWalletContext'
import UnifiedWalletModal from '../components/UnifiedWalletModal'
import { injectStyles } from '../styles'

const buildNotification = (adapter: Adapter): IWalletNotification => ({
  publicKey: adapter.publicKey?.toBase58() ?? '',
  shortAddress: adapter.publicKey ? shortenAddress(adapter.publicKey.toBase58()) : '',
  walletName: adapter.name,
  metadata: {
    name: adapter.name,
    url: adapter.url,
    icon: adapter.icon,
    supportedTransactionVersions: adapter.supportedTransactionVersions,
  },
})

const UnifiedWalletValueProvider = ({
  config,
  children,
}: {
  config: IUnifiedWalletConfig
  children: React.ReactNode
}) => {
  const walletState = useWallet()
  const [showModal, setShowModal] = useState(false)
  const previousAdapterRef = useRef<Adapter | null>(null)

  injectStyles()

  // Fire onConnect / onDisconnect notifications on state transitions
  const wasConnectedRef = useRef(false)
  useEffect(() => {
    const adapter = walletState.wallet?.adapter ?? previousAdapterRef.current
    if (walletState.connected && !wasConnectedRef.current && walletState.wallet) {
      previousAdapterRef.current = walletState.wallet.adapter
      config.notificationCallback?.onConnect(buildNotification(walletState.wallet.adapter))
    }
    if (!walletState.connected && wasConnectedRef.current && adapter) {
      config.notificationCallback?.onDisconnect(buildNotification(adapter))
    }
    wasConnectedRef.current = walletState.connected
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walletState.connected, walletState.wallet])

  const handleConnectClick = useCallback(
    async (event: React.MouseEvent<HTMLElement, globalThis.MouseEvent>, adapter: Adapter) => {
      event.preventDefault()

      try {
        // Not installed → notify and let the modal show the NotInstalled screen
        if (
          adapter.readyState !== WalletReadyState.Installed &&
          adapter.readyState !== WalletReadyState.Loadable
        ) {
          config.notificationCallback?.onNotInstalled(buildNotification(adapter))
          return
        }

        config.notificationCallback?.onConnecting(buildNotification(adapter))
        walletState.select(adapter.name)

        // wallet selection is async (state update) — connect directly on the adapter
        await adapter.connect()
        setShowModal(false)
      } catch (error: any) {
        console.error(error)
        if (error?.message === MWA_NOT_FOUND_ERROR) {
          // Mobile Wallet Adapter not available in this environment
          config.notificationCallback?.onNotInstalled(buildNotification(adapter))
        }
      }
    },
    [config, walletState],
  )

  const value = useMemo(
    () => ({
      walletPrecedence: config.walletPrecedence,
      handleConnectClick,
      showModal,
      setShowModal,
      walletlistExplanation: config.walletlistExplanation,
      theme: config.theme ?? 'light',
      walletAttachments: config.walletAttachments,
      walletModalAttachments: config.walletModalAttachments,
    }),
    [config, handleConnectClick, showModal],
  )

  return (
    <UnifiedWalletContext.Provider value={value}>
      <ModalHost />
      {children}
    </UnifiedWalletContext.Provider>
  )
}

const ModalHost = () => {
  const { showModal, setShowModal } = useUnifiedWalletContext()
  if (!showModal) return null
  return <UnifiedWalletModal onClose={() => setShowModal(false)} />
}

const UnifiedWalletProvider = ({
  wallets,
  config,
  children,
  localStorageKey,
}: {
  wallets: Adapter[]
  config: IUnifiedWalletConfig
  children: React.ReactNode
  localStorageKey?: string
}) => {
  return (
    <TranslationProvider lang={config.lang}>
      <WalletConnectionProvider wallets={wallets} config={config} localStorageKey={localStorageKey}>
        <UnifiedWalletValueProvider config={config}>{children}</UnifiedWalletValueProvider>
      </WalletConnectionProvider>
    </TranslationProvider>
  )
}

export { UnifiedWalletProvider, useUnifiedWallet, useUnifiedWalletContext }
