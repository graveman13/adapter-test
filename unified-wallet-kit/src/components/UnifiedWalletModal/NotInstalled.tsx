import React from 'react'
import type { Adapter } from '@solana/wallet-adapter-base'
import { useTranslation } from '../../contexts/TranslationProvider'
import { isMobile } from '../../misc/utils'

const NotInstalled: React.FC<{
  adapter: Adapter
  onClose: () => void
  onGoOnboarding: () => void
}> = ({ adapter, onClose, onGoOnboarding }) => {
  const { t } = useTranslation()

  return (
    <div className="uwk-screen">
      <img className="uwk-big-icon" src={adapter.icon} alt={adapter.name} />
      <h3>
        {t('Have you installed')} {adapter.name}?
      </h3>

      <a href={adapter.url} target="_blank" rel="noopener noreferrer">
        <button type="button" className="uwk-primary-btn">
          {t('Install')} {adapter.name} ↗
        </button>
      </a>

      <div className="uwk-hint">
        <strong>{t('On mobile:')}</strong>
        <p>{t('You should open the app instead')}</p>
        {isMobile() && 'deepLink' in adapter && typeof (adapter as any).deepLink === 'function' ? (
          <a href={(adapter as any).deepLink()}>
            <button type="button" className="uwk-secondary-btn">
              {adapter.name} app
            </button>
          </a>
        ) : null}
        <strong>{t('On desktop:')}</strong>
        <p>{t('Install and refresh the page')}</p>
      </div>

      <button type="button" className="uwk-secondary-btn" onClick={onGoOnboarding}>
        {t('I don’t have a wallet')}
      </button>
      <button type="button" className="uwk-secondary-btn" onClick={onClose}>
        ← {t('Go back')}
      </button>
    </div>
  )
}

export default NotInstalled
