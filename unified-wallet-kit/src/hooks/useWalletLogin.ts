import { useCallback, useState } from 'react'
import { useUnifiedWallet } from '../contexts/UnifiedWalletContext'
import {
  loginWithWallet,
  WalletAccountMismatchError,
  type LoginMessageParams,
  type LoginPayload,
} from '../misc/auth'

export type LoginStatus = 'idle' | 'signing' | 'success' | 'rejected' | 'mismatch' | 'error'

/**
 * React helper around `loginWithWallet` for backend authentication.
 *
 * Usage:
 *   const { login, status, payload } = useWalletLogin()
 *   const nonce = await fetch('/auth/nonce').then(r => r.text())
 *   const proof = await login({ nonce, statement: 'Sign in to MyApp' })
 *   await fetch('/auth/verify', { method: 'POST', body: JSON.stringify(proof) })
 *
 * `login` resolves only with a signature cryptographically verified to belong
 * to the connected account; on a wallet-conflict key swap it rejects with
 * status 'mismatch' instead of returning a bad proof.
 */
export function useWalletLogin() {
  const { wallet, connected } = useUnifiedWallet()
  const [status, setStatus] = useState<LoginStatus>('idle')
  const [payload, setPayload] = useState<LoginPayload | null>(null)
  const [error, setError] = useState<Error | null>(null)

  const login = useCallback(
    async (params: LoginMessageParams): Promise<LoginPayload> => {
      if (!wallet || !connected) throw new Error('No wallet connected')
      setStatus('signing')
      setError(null)
      try {
        const result = await loginWithWallet(wallet.adapter, params)
        setPayload(result)
        setStatus('success')
        return result
      } catch (e: any) {
        setError(e)
        if (e instanceof WalletAccountMismatchError) setStatus('mismatch')
        else if (/reject|denied|cancel/i.test(e?.message ?? '')) setStatus('rejected')
        else setStatus('error')
        throw e
      }
    },
    [wallet, connected],
  )

  const reset = useCallback(() => {
    setStatus('idle')
    setPayload(null)
    setError(null)
  }, [])

  return { login, status, payload, error, reset }
}
