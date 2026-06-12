import React from 'react'
import { useTranslation } from '../../contexts/TranslationProvider'
import { HARDCODED_WALLET_STANDARDS } from '../../misc/constants'

const OnboardingIntro: React.FC<{ onGoBack: () => void }> = ({ onGoBack }) => {
  const { t } = useTranslation()

  return (
    <div className="uwk-screen">
      <h3>{t('New here?')}</h3>
      <p>{t('Welcome to SolanaFi! Create a crypto wallet to get started!')}</p>

      <div className="uwk-section-title" style={{ textAlign: 'left', marginTop: 18 }}>
        {t('Popular wallets to get started')}
      </div>
      <ul className="uwk-wallet-list">
        {HARDCODED_WALLET_STANDARDS.map((wallet) => (
          <li key={wallet.id}>
            <a href={wallet.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
              <span className="uwk-wallet-item" style={{ display: 'flex' }}>
                <img src={wallet.icon} alt={wallet.name} width={28} height={28} />
                <span>{wallet.name}</span>
                <span className="uwk-detected">↗</span>
              </span>
            </a>
          </li>
        ))}
      </ul>

      <p style={{ marginTop: 14 }}>{t('Once installed, refresh this page')}</p>
      <button type="button" className="uwk-secondary-btn" onClick={onGoBack}>
        ← {t('Go back')}
      </button>
    </div>
  )
}

export default OnboardingIntro
