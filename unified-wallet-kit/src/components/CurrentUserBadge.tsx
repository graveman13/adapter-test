import React from 'react'
import { useUnifiedWallet, useUnifiedWalletContext } from '../contexts/UnifiedWalletContext'
import { shortenAddress } from '../misc/utils'

export const CurrentUserBadge: React.FC<{ onClick?: () => void; className?: string }> = ({
  onClick,
  className,
}) => {
  const { wallet, publicKey } = useUnifiedWallet()
  const { theme } = useUnifiedWalletContext()

  if (!wallet || !publicKey) return null

  return (
    <button
      type="button"
      className={`uwk uwk-badge uwk-${theme} ${className ?? ''}`}
      onClick={onClick}
    >
      <img src={wallet.adapter.icon} alt={wallet.adapter.name} width={20} height={20} />
      <span>{shortenAddress(publicKey.toBase58())}</span>
    </button>
  )
}
