import React, { useCallback, type ReactNode } from 'react'
import { WalletReadyState } from '@solana/wallet-adapter-base'
import { useUnifiedWallet, useUnifiedWalletContext } from '../../contexts/UnifiedWalletContext'
import { useTranslation } from '../../contexts/TranslationProvider'
import { CurrentUserBadge } from '../CurrentUserBadge'

export const UnifiedWalletButton: React.FC<{
  overrideContent?: ReactNode
  buttonClassName?: string
  currentUserClassName?: string
}> = ({ overrideContent, buttonClassName, currentUserClassName }) => {
  const { setShowModal, theme } = useUnifiedWalletContext()
  const { disconnect, connect, connecting, wallet } = useUnifiedWallet()
  const { t } = useTranslation()

  const handleClick = useCallback(async () => {
    try {
      // a wallet was previously selected — try connecting it directly
      const isReady =
        wallet?.adapter.readyState === WalletReadyState.Installed ||
        wallet?.adapter.readyState === WalletReadyState.Loadable
      if (wallet?.adapter?.name && isReady) {
        // Reconnect to the already-selected, available wallet without the modal.
        // Message signing for backend login is an explicit, separate user action
        // (see useWalletLogin) — never auto-fire it here, or wallets pop an
        // unexpected signature request right after connect.
        await connect()
        return
      }
    } catch (error) {
      console.error(error)
    }
    setShowModal(true)
  }, [wallet, connect, setShowModal])

  const { connected } = useUnifiedWallet()

  if (connected) {
    return <CurrentUserBadge onClick={disconnect} className={currentUserClassName} />
  }

  if (overrideContent) {
    return (
      <div className="uwk" onClick={handleClick} style={{ cursor: 'pointer' }}>
        {overrideContent}
      </div>
    )
  }

  return (
    <button
      type="button"
      className={`uwk uwk-btn uwk-${theme} ${buttonClassName ?? ''}`}
      onClick={handleClick}
      disabled={connecting}
    >
      {connecting ? t('Connecting') + '...' : t('Connect Wallet')}
    </button>
  )
}
