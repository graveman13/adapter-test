import React, { useCallback, type ReactNode } from 'react'
import { WalletReadyState, type Adapter } from '@solana/wallet-adapter-base'
import { PublicKey } from '@solana/web3.js'
import { ed25519 } from '@noble/curves/ed25519'
import { useUnifiedWallet, useUnifiedWalletContext } from '../../contexts/UnifiedWalletContext'
import { useTranslation } from '../../contexts/TranslationProvider'
import { CurrentUserBadge } from '../CurrentUserBadge'

/** Optional auth params — `nonce` should come from your backend in production. */
export interface SignInInput {
  domain?: string
  statement?: string
  nonce?: string
  issuedAt?: string
}

/** Result of a verified sign-in, ready to POST to a backend. */
export interface SignInResult {
  method: 'signIn' | 'signMessage'
  /** base58 public key that actually produced the signature */
  publicKey: string
  /** the UTF-8 message that was signed */
  message: string
  /** raw signed-message bytes */
  signedMessage: Uint8Array
  /** raw signature bytes */
  signature: Uint8Array
  /** ed25519-verified against `publicKey` */
  verified: boolean
}

function buildMessage(publicKey: string, input: SignInInput): string {
  const domain = input.domain ?? (typeof window !== 'undefined' ? window.location.host : 'app')
  const issuedAt = input.issuedAt ?? new Date().toISOString()
  const statement = input.statement ?? 'Sign in'
  const lines = [
    `${domain} wants you to sign in with your Solana account:`,
    publicKey,
    '',
    statement,
  ]
  if (input.nonce) lines.push('', `Nonce: ${input.nonce}`)
  lines.push(`Issued At: ${issuedAt}`)
  return lines.join('\n')
}

/**
 * Authenticates a wallet on click, preferring the modern Wallet Standard
 * Sign-In-With-Solana flow and degrading gracefully:
 *
 *   1. `signIn` (SIWS)  — one click connects + signs a standardized, domain/
 *      nonce-bound message; returns the signing account, so a hijacked key is
 *      caught immediately. This is the current recommended standard.
 *   2. `connect` + `signMessage` — fallback for wallets without SIWS
 *      (e.g. Ledger). We connect first, then sign and verify.
 *
 * Both paths verify the signature with ed25519 against the connected key —
 * the defense against a conflicting extension swapping in another account.
 */
export async function signInWithFallback(
  adapter: Adapter,
  input: SignInInput = {},
): Promise<SignInResult> {
  // 1. Sign-In With Solana
  if ('signIn' in adapter && typeof (adapter as any).signIn === 'function') {
    const output = await (adapter as any).signIn({
      domain: input.domain ?? (typeof window !== 'undefined' ? window.location.host : undefined),
      statement: input.statement,
      nonce: input.nonce,
      issuedAt: input.issuedAt ?? new Date().toISOString(),
    })

    const accountKey = new PublicKey(output.account.publicKey)
    const signedMessage: Uint8Array = output.signedMessage
    const signature: Uint8Array = output.signature
    const verified = safeVerify(signature, signedMessage, accountKey.toBytes())

    return {
      method: 'signIn',
      publicKey: accountKey.toBase58(),
      message: new TextDecoder().decode(signedMessage),
      signedMessage,
      signature,
      verified,
    }
  }

  // 2. Fallback: connect, then signMessage
  if (!adapter.connected) {
    await adapter.connect()
  }
  if (!('signMessage' in adapter) || typeof (adapter as any).signMessage !== 'function') {
    throw new Error(`Wallet "${adapter.name}" supports neither signIn nor signMessage`)
  }
  const publicKey = adapter.publicKey
  if (!publicKey) throw new Error('Wallet connected but exposed no public key')

  const message = buildMessage(publicKey.toBase58(), input)
  const signedMessage = new TextEncoder().encode(message)
  const signature: Uint8Array = await (adapter as any).signMessage(signedMessage)
  const verified = safeVerify(signature, signedMessage, publicKey.toBytes())

  return {
    method: 'signMessage',
    publicKey: publicKey.toBase58(),
    message,
    signedMessage,
    signature,
    verified,
  }
}

function safeVerify(signature: Uint8Array, message: Uint8Array, publicKey: Uint8Array): boolean {
  try {
    return ed25519.verify(signature, message, publicKey)
  } catch {
    return false
  }
}

export const UnifiedWalletButton: React.FC<{
  overrideContent?: ReactNode
  buttonClassName?: string
  currentUserClassName?: string
  /** Supply backend-issued auth params (nonce/statement). Called per click. */
  getSignInInput?: () => SignInInput | Promise<SignInInput>
  /** Receives the verified sign-in result, ready to send to a backend. */
  onSignIn?: (result: SignInResult) => void
  /** Receives connect/sign errors and user rejections. */
  onSignInError?: (error: unknown) => void
}> = ({
  overrideContent,
  buttonClassName,
  currentUserClassName,
  getSignInInput,
  onSignIn,
  onSignInError,
}) => {
  const { setShowModal, theme } = useUnifiedWalletContext()
  const { disconnect, connecting, wallet, connected } = useUnifiedWallet()
  const { t } = useTranslation()

  const handleClick = useCallback(async () => {
    const adapter = wallet?.adapter
    const isReady =
      adapter?.readyState === WalletReadyState.Installed ||
      adapter?.readyState === WalletReadyState.Loadable

    // No wallet chosen yet (or it's not installed) → let the user pick one.
    if (!adapter || !isReady) {
      setShowModal(true)
      return
    }

    try {
      const input = getSignInInput ? await getSignInInput() : { nonce: randomNonce() }
      const result = await signInWithFallback(adapter, input)
      if (!result.verified) {
        // signature did not match the connected key — likely an extension conflict
        throw new WalletSignInVerificationError(result.publicKey)
      }
      onSignIn?.(result)
    } catch (error) {
      onSignInError?.(error)
      console.error('[UnifiedWalletButton] sign-in failed:', error)
    }
  }, [wallet, getSignInInput, onSignIn, onSignInError, setShowModal])

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

export class WalletSignInVerificationError extends Error {
  constructor(public publicKey: string) {
    super(
      'Sign-in signature did not verify against the connected wallet. ' +
        'Another wallet extension may have intercepted the request.',
    )
    this.name = 'WalletSignInVerificationError'
  }
}

/**
 * SIWS / EIP-4361 require the nonce to be alphanumeric (`[a-zA-Z0-9]`) and at
 * least 8 chars — UUIDs are rejected ("invalid formatting") because of their
 * hyphens. Return 32 hex chars instead.
 */
export function randomNonce(): string {
  if (typeof crypto !== 'undefined' && 'getRandomValues' in crypto) {
    const bytes = new Uint8Array(16)
    crypto.getRandomValues(bytes)
    return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
  }
  return (Math.random().toString(16) + Date.now().toString(16)).replace(/[^a-z0-9]/gi, '')
}
