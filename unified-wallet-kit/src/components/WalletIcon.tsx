import React, { type DetailedHTMLProps, type FC, type ImgHTMLAttributes } from 'react'
import type { Adapter } from '@solana/wallet-adapter-base'

export interface WalletIconProps
  extends DetailedHTMLProps<ImgHTMLAttributes<HTMLImageElement>, HTMLImageElement> {
  wallet: Adapter | null
  width?: number
  height?: number
}

export const WalletIcon: FC<WalletIconProps> = ({ wallet, width = 24, height = 24, ...props }) => {
  if (!wallet?.icon) {
    return <span style={{ width, height, display: 'inline-block' }}>👛</span>
  }
  return (
    <img
      src={wallet.icon}
      alt={`${wallet.name} icon`}
      width={width}
      height={height}
      {...props}
    />
  )
}
