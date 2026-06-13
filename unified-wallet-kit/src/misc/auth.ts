import { ed25519 } from '@noble/curves/ed25519'
import bs58 from 'bs58'
import type { Adapter } from '@solana/wallet-adapter-base'

/**
 * Verifies an ed25519 signature against a base58 Solana public key.
 * This is the security backbone of wallet login: even if a conflicting
 * browser extension routes signing to a different wallet, a signature made
 * by the wrong key will NOT verify against the connected key.
 */
export function verifyEd25519(
  message: Uint8Array,
  signature: Uint8Array,
  publicKeyBase58: string,
): boolean {
  try {
    return ed25519.verify(signature, message, bs58.decode(publicKeyBase58))
  } catch {
    return false
  }
}

/** Thrown when the wallet returned a signature NOT made by the connected key. */
export class WalletAccountMismatchError extends Error {
  constructor(
    public expected: string,
    message = 'The signature was not produced by the connected wallet account. ' +
      'Another wallet extension likely intercepted the request.',
  ) {
    super(message)
    this.name = 'WalletAccountMismatchError'
  }
}

export interface LoginMessageParams {
  /** Human-readable statement shown to the user in the wallet popup. */
  statement?: string
  /** Single-use nonce — MUST come from your backend in production. */
  nonce: string
  /** Defaults to the current origin. */
  domain?: string
  /** ISO timestamp; defaults to now. */
  issuedAt?: string
}

export interface LoginPayload {
  /** base58 public key of the connected account (the claimed identity) */
  publicKey: string
  /** the exact UTF-8 message that was signed */
  message: string
  /** raw bytes of the signed message */
  signedMessageBytes: Uint8Array
  /** base58 signature, verified against `publicKey` */
  signature: string
  /** which standard feature produced it */
  method: 'signIn' | 'signMessage'
}

function buildMessage(publicKey: string, params: LoginMessageParams): string {
  const domain = params.domain ?? (typeof window !== 'undefined' ? window.location.host : 'app')
  const issuedAt = params.issuedAt ?? new Date().toISOString()
  const statement = params.statement ?? 'Sign in'
  return [
    `${domain} wants you to sign in with your Solana account:`,
    publicKey,
    '',
    statement,
    '',
    `Nonce: ${params.nonce}`,
    `Issued At: ${issuedAt}`,
  ].join('\n')
}

/**
 * Produces a login payload that is GUARANTEED to be signed by the currently
 * connected account, or throws.
 *
 * Strategy:
 *  1. Prefer Sign-In-With-Solana (`signIn`) — it returns the signing account,
 *     so we can compare it directly and it binds domain + nonce.
 *  2. Fall back to `signMessage` for wallets without SIWS.
 *  3. In BOTH cases verify the signature against the connected key with
 *     ed25519 — this is what defeats extension-conflict key swaps.
 *
 * The returned `signature` + `publicKey` + `message` are ready to POST to a
 * backend, which MUST verify them again server-side against the same nonce.
 */
export async function loginWithWallet(
  adapter: Adapter,
  params: LoginMessageParams,
): Promise<LoginPayload> {
  const connectedKey = adapter.publicKey?.toBase58()
  if (!connectedKey) {
    throw new Error('Wallet is not connected')
  }

  // 1. Sign-In With Solana (preferred)
  if ('signIn' in adapter && typeof (adapter as any).signIn === 'function') {
    const issuedAt = params.issuedAt ?? new Date().toISOString()
    const output = await (adapter as any).signIn({
      domain: params.domain ?? (typeof window !== 'undefined' ? window.location.host : undefined),
      statement: params.statement,
      nonce: params.nonce,
      issuedAt,
      address: connectedKey,
    })

    const signedBy = bs58.encode(output.account.publicKey)
    const signedMessageBytes: Uint8Array = output.signedMessage
    const signature: Uint8Array = output.signature

    if (signedBy !== connectedKey || !verifyEd25519(signedMessageBytes, signature, connectedKey)) {
      throw new WalletAccountMismatchError(connectedKey)
    }

    return {
      publicKey: connectedKey,
      message: new TextDecoder().decode(signedMessageBytes),
      signedMessageBytes,
      signature: bs58.encode(signature),
      method: 'signIn',
    }
  }

  // 2. Fallback: plain signMessage
  if ('signMessage' in adapter && typeof (adapter as any).signMessage === 'function') {
    const message = buildMessage(connectedKey, params)
    const signedMessageBytes = new TextEncoder().encode(message)
    const signature: Uint8Array = await (adapter as any).signMessage(signedMessageBytes)

    if (!verifyEd25519(signedMessageBytes, signature, connectedKey)) {
      throw new WalletAccountMismatchError(connectedKey)
    }

    return {
      publicKey: connectedKey,
      message,
      signedMessageBytes,
      signature: bs58.encode(signature),
      method: 'signMessage',
    }
  }

  throw new Error(`Wallet "${adapter.name}" supports neither signIn nor signMessage`)
}
