import React, { useCallback, useMemo, useRef, useState } from 'react'
import type { Adapter } from '@solana/wallet-adapter-base'
import { WalletReadyState } from '@solana/wallet-adapter-base'
import { useUnifiedWallet } from '../../contexts/UnifiedWalletContext'
import { useUnifiedWalletContext } from '../../contexts/UnifiedWalletContext'
import { usePreviouslyConnected } from '../../contexts/WalletConnectionProvider/previouslyConnectedProvider'
import { useTranslation } from '../../contexts/TranslationProvider'
import { useOutsideClick, useReactiveEventListener } from '../../misc/utils'
import { useWalletConflicts } from '../../hooks/useWalletConflicts'
import { WalletListItem } from './WalletListItem'
import NotInstalled from './NotInstalled'
import OnboardingIntro from './Onboarding'

const TOP_WALLETS_COUNT = 3

type Screen = 'main' | 'onboarding' | 'not-installed'

interface IUnifiedWalletModal {
  onClose: () => void
}

const UnifiedWalletModal: React.FC<IUnifiedWalletModal> = ({ onClose }) => {
  const { wallets } = useUnifiedWallet()
  const { handleConnectClick, walletPrecedence, walletlistExplanation, theme, walletModalAttachments } =
    useUnifiedWalletContext()
  const previouslyConnected = usePreviouslyConnected()
  const conflicts = useWalletConflicts()
  const { t } = useTranslation()

  const [screen, setScreen] = useState<Screen>('main')
  const [notInstalledAdapter, setNotInstalledAdapter] = useState<Adapter | null>(null)
  const [showMore, setShowMore] = useState(false)

  const contentRef = useRef<HTMLDivElement>(null)
  useOutsideClick(contentRef, onClose)
  useReactiveEventListener('keydown', (event: KeyboardEvent) => {
    if (event.key === 'Escape') onClose()
  })

  // --- list building: dedupe by name, sort by precedence > previously connected > installed
  const { topWallets, moreWallets } = useMemo(() => {
    const seen = new Set<string>()
    const unique = wallets.filter((w) => {
      if (seen.has(w.adapter.name)) return false
      seen.add(w.adapter.name)
      return true
    })

    const rank = (adapter: Adapter): number => {
      const precedenceIdx = walletPrecedence?.indexOf(adapter.name) ?? -1
      if (precedenceIdx >= 0) return precedenceIdx
      const prevIdx = previouslyConnected.indexOf(adapter.name)
      if (prevIdx >= 0) return 100 + prevIdx
      const installed =
        adapter.readyState === WalletReadyState.Installed ||
        adapter.readyState === WalletReadyState.Loadable
      return installed ? 1000 : 10000
    }

    const sorted = [...unique].sort((a, b) => rank(a.adapter) - rank(b.adapter))
    return {
      topWallets: sorted.slice(0, TOP_WALLETS_COUNT),
      moreWallets: sorted.slice(TOP_WALLETS_COUNT),
    }
  }, [wallets, walletPrecedence, previouslyConnected])

  const hasPreviouslyConnected = previouslyConnected.length > 0

  const onWalletClick = useCallback(
    async (event: React.MouseEvent<HTMLElement, globalThis.MouseEvent>, adapter: Adapter) => {
      if (
        adapter.readyState !== WalletReadyState.Installed &&
        adapter.readyState !== WalletReadyState.Loadable
      ) {
        setNotInstalledAdapter(adapter)
        setScreen('not-installed')
      }
      await handleConnectClick(event, adapter)
    },
    [handleConnectClick],
  )

  return (
    <div className={`uwk uwk-overlay`}>
      <div ref={contentRef} className={`uwk-modal uwk-${theme}`} role="dialog" aria-modal="true">
        {screen === 'main' && (
          <>
            <div className="uwk-modal-header">
              <h2>{t('Connect Wallet')}</h2>
              <p>{t('Connect Wallet to Continue')}</p>
              <button type="button" className="uwk-close" onClick={onClose} aria-label="Close">
                ✕
              </button>
            </div>
            <div className="uwk-modal-body">
              {conflicts.map((conflict) => (
                <div key={conflict.walletName} className="uwk-conflict-banner" role="alert">
                  ⚠️ {conflict.walletName}: {t('may be intercepted by another wallet')}
                  {conflict.interceptedBy ? ` (${conflict.interceptedBy})` : ''}.{' '}
                  {conflict.interceptedBy
                    ? `${t('Disable the "default wallet" option in')} ${conflict.interceptedBy}.`
                    : t('Check your wallet extensions settings.')}
                </div>
              ))}
              <div className="uwk-section-title">
                {hasPreviouslyConnected ? t('Recently used') : t('Recommended wallets')}
              </div>
              <ul className="uwk-wallet-list">
                {topWallets.map((w) => (
                  <WalletListItem
                    key={w.adapter.name}
                    wallet={w.adapter}
                    handleClick={(e) => onWalletClick(e, w.adapter)}
                  />
                ))}
              </ul>

              {moreWallets.length > 0 && (
                <>
                  {showMore && (
                    <>
                      <div className="uwk-section-title">{t('More wallets')}</div>
                      <ul className="uwk-wallet-list">
                        {moreWallets.map((w) => (
                          <WalletListItem
                            key={w.adapter.name}
                            wallet={w.adapter}
                            handleClick={(e) => onWalletClick(e, w.adapter)}
                          />
                        ))}
                      </ul>
                    </>
                  )}
                  <button
                    type="button"
                    className="uwk-collapse-toggle"
                    onClick={() => setShowMore((s) => !s)}
                  >
                    {t('More wallets')} {showMore ? '▴' : '▾'}
                  </button>
                </>
              )}

              <button
                type="button"
                className="uwk-link-button"
                onClick={() => setScreen('onboarding')}
              >
                {t('I don’t have a wallet')}
              </button>

              <div className="uwk-footer-links">
                {walletlistExplanation?.href && (
                  <a href={walletlistExplanation.href} target="_blank" rel="noopener noreferrer">
                    {t('Can’t find your wallet?')}
                  </a>
                )}
              </div>

              {walletModalAttachments?.footer ?? null}
            </div>
          </>
        )}

        {screen === 'onboarding' && <OnboardingIntro onGoBack={() => setScreen('main')} />}

        {screen === 'not-installed' && notInstalledAdapter && (
          <NotInstalled
            adapter={notInstalledAdapter}
            onClose={() => setScreen('main')}
            onGoOnboarding={() => setScreen('onboarding')}
          />
        )}
      </div>
    </div>
  )
}

export default UnifiedWalletModal
