import React, { type MouseEventHandler } from 'react'
import type { Adapter } from '@solana/wallet-adapter-base'
import { WalletReadyState } from '@solana/wallet-adapter-base'
import { useUnifiedWalletContext } from '../../contexts/UnifiedWalletContext'
import { useTranslation } from '../../contexts/TranslationProvider'
import { WalletIcon } from '../WalletIcon'

export interface WalletListItemProps {
  handleClick: MouseEventHandler<HTMLButtonElement>
  wallet: Adapter
}

export const WalletListItem = ({ handleClick, wallet }: WalletListItemProps) => {
  const { walletAttachments } = useUnifiedWalletContext()
  const { t } = useTranslation()
  const attachment = walletAttachments?.[wallet.name]?.attachment
  const detected =
    wallet.readyState === WalletReadyState.Installed ||
    wallet.readyState === WalletReadyState.Loadable

  return (
    <li>
      <button type="button" className="uwk-wallet-item" onClick={handleClick}>
        <WalletIcon wallet={wallet} width={28} height={28} />
        <span>{wallet.name}</span>
        {attachment ? <span className="uwk-attachment">{attachment}</span> : null}
        {detected ? <span className="uwk-detected">{t('Detected')}</span> : null}
      </button>
    </li>
  )
}
