import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FC,
  type PropsWithChildren,
} from 'react'
import {
  WalletAdapterNetwork,
  WalletError,
  WalletNotConnectedError,
  WalletNotReadyError,
  WalletReadyState,
  type Adapter,
  type MessageSignerWalletAdapterProps,
  type SignerWalletAdapterProps,
  type SignInMessageSignerWalletAdapterProps,
  type WalletAdapterProps,
  type WalletName,
} from '@solana/wallet-adapter-base'
import type { Connection, PublicKey, Transaction, TransactionSignature, VersionedTransaction } from '@solana/web3.js'
import type { IUnifiedWalletConfig } from '../../types'
import HardcodedWalletStandardAdapter from '../../adapters/HardcodedWalletStandardAdapter'
import { useLocalStorage } from '../../hooks/useLocalStorage'
import { useStandardWalletAdapters } from '../../hooks/useStandardWalletAdapters'
import { PreviouslyConnectedProvider } from './previouslyConnectedProvider'

export interface Wallet {
  adapter: Adapter
  readyState: WalletReadyState
}

// Mirror of WalletContextState from @solana/wallet-adapter-react
export interface WalletContextState {
  autoConnect: boolean
  wallets: Wallet[]
  wallet: Wallet | null
  publicKey: PublicKey | null
  connecting: boolean
  connected: boolean
  disconnecting: boolean
  select(walletName: WalletName | null): void
  connect(): Promise<void>
  disconnect(): Promise<void>
  sendTransaction(
    transaction: Transaction | VersionedTransaction,
    connection: Connection,
    options?: Parameters<WalletAdapterProps['sendTransaction']>[2],
  ): Promise<TransactionSignature>
  signTransaction: SignerWalletAdapterProps['signTransaction'] | undefined
  signAllTransactions: SignerWalletAdapterProps['signAllTransactions'] | undefined
  signMessage: MessageSignerWalletAdapterProps['signMessage'] | undefined
  signIn: SignInMessageSignerWalletAdapterProps['signIn'] | undefined
}

const EMPTY_ARRAY: Wallet[] = []

export const WalletContext = createContext<WalletContextState>({} as WalletContextState)

export function useWallet(): WalletContextState {
  return useContext(WalletContext)
}

const WalletConnectionProvider: FC<
  PropsWithChildren & {
    wallets: Adapter[]
    config: IUnifiedWalletConfig
    localStorageKey?: string
  }
> = ({ wallets: passedWallets, config, localStorageKey = 'walletName', children }) => {
  // 1. Merge explicitly passed adapters with wallet-standard detected ones
  const withStandardAdapters = useStandardWalletAdapters(passedWallets)

  // 2. Append hardcoded (not-installed placeholder) wallets that aren't already present
  const adaptersWithHardcoded = useMemo(() => {
    const hardcoded = (config.hardcodedWallets ?? [])
      .filter((hc) => !withStandardAdapters.some((adapter) => adapter.name === hc.name))
      .map((hc) => new HardcodedWalletStandardAdapter(hc))
    return [...withStandardAdapters, ...hardcoded]
  }, [withStandardAdapters, config.hardcodedWallets])

  const [walletName, setWalletName] = useLocalStorage<WalletName | null>(localStorageKey, null)

  const [{ wallet, adapter, publicKey, connected }, setState] = useState<{
    wallet: Wallet | null
    adapter: Adapter | null
    publicKey: PublicKey | null
    connected: boolean
  }>({ wallet: null, adapter: null, publicKey: null, connected: false })

  const [connecting, setConnecting] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)
  const isConnectingRef = useRef(false)
  const isDisconnectingRef = useRef(false)
  const isUnloadingRef = useRef(false)

  // 3. Track readyState of every adapter
  const [wallets, setWallets] = useState<Wallet[]>(() =>
    adaptersWithHardcoded.map((a) => ({ adapter: a, readyState: a.readyState })),
  )

  useEffect(() => {
    setWallets((prev) =>
      adaptersWithHardcoded.map((a) => {
        const existing = prev.find((w) => w.adapter === a)
        return existing ?? { adapter: a, readyState: a.readyState }
      }),
    )

    function handleReadyStateChange(this: Adapter, readyState: WalletReadyState) {
      setWallets((prev) => {
        const index = prev.findIndex((w) => w.adapter === this)
        if (index === -1) return prev
        const next = [...prev]
        next[index] = { ...next[index], readyState }
        return next
      })
    }

    adaptersWithHardcoded.forEach((a) => a.on('readyStateChange', handleReadyStateChange, a))
    return () => {
      adaptersWithHardcoded.forEach((a) => a.off('readyStateChange', handleReadyStateChange, a))
    }
  }, [adaptersWithHardcoded])

  // 4. Resolve the selected wallet from the stored wallet name
  useEffect(() => {
    const selected = wallets.find((w) => w.adapter.name === walletName) ?? null
    setState((prev) => {
      if (selected?.adapter === prev.adapter) return prev
      return {
        wallet: selected,
        adapter: selected?.adapter ?? null,
        publicKey: selected?.adapter.publicKey ?? null,
        connected: selected?.adapter.connected ?? false,
      }
    })
  }, [wallets, walletName])

  // 5. Wire adapter events
  useEffect(() => {
    if (!adapter) return

    const handleConnect = (pk: PublicKey) => {
      setState((prev) => ({ ...prev, publicKey: pk, connected: true }))
      setConnecting(false)
      isConnectingRef.current = false
      setDisconnecting(false)
      isDisconnectingRef.current = false
    }

    const handleDisconnect = () => {
      if (isUnloadingRef.current) return
      setState((prev) => ({ ...prev, publicKey: null, connected: false }))
      setConnecting(false)
      isConnectingRef.current = false
      setDisconnecting(false)
      isDisconnectingRef.current = false
    }

    const handleError = (error: WalletError) => {
      console.error('[wallet-error]', error)
    }

    adapter.on('connect', handleConnect)
    adapter.on('disconnect', handleDisconnect)
    adapter.on('error', handleError)

    return () => {
      adapter.off('connect', handleConnect)
      adapter.off('disconnect', handleDisconnect)
      adapter.off('error', handleError)
    }
  }, [adapter])

  // 6. Don't react to disconnect events fired by the browser closing
  useEffect(() => {
    const beforeUnload = () => (isUnloadingRef.current = true)
    window.addEventListener('beforeunload', beforeUnload)
    return () => window.removeEventListener('beforeunload', beforeUnload)
  }, [])

  // 7. Auto-connect to the previously selected wallet
  const didAttemptAutoConnectRef = useRef(false)
  useEffect(() => {
    if (
      didAttemptAutoConnectRef.current ||
      !config.autoConnect ||
      !adapter ||
      isConnectingRef.current ||
      connected
    )
      return
    if (
      adapter.readyState !== WalletReadyState.Installed &&
      adapter.readyState !== WalletReadyState.Loadable
    )
      return

    didAttemptAutoConnectRef.current = true
    ;(async () => {
      isConnectingRef.current = true
      setConnecting(true)
      try {
        await adapter.connect()
      } catch (error) {
        // do not clear the stored wallet name — user may approve next time
        console.error(error)
      } finally {
        setConnecting(false)
        isConnectingRef.current = false
      }
    })()
  }, [config.autoConnect, adapter, connected])

  const select = useCallback(
    (name: WalletName | null) => {
      if (adapter && adapter.name !== name) {
        adapter.disconnect()
      }
      setWalletName(name)
    },
    [adapter, setWalletName],
  )

  const connect = useCallback(async () => {
    if (isConnectingRef.current || isDisconnectingRef.current || connected) return
    if (!adapter) throw new WalletNotConnectedError()

    if (
      adapter.readyState !== WalletReadyState.Installed &&
      adapter.readyState !== WalletReadyState.Loadable
    ) {
      setWalletName(null)
      if (typeof window !== 'undefined' && adapter.url) {
        window.open(adapter.url, '_blank')
      }
      throw new WalletNotReadyError()
    }

    isConnectingRef.current = true
    setConnecting(true)
    try {
      await adapter.connect()
    } catch (error) {
      setWalletName(null)
      throw error
    } finally {
      setConnecting(false)
      isConnectingRef.current = false
    }
  }, [adapter, connected, setWalletName])

  const disconnect = useCallback(async () => {
    if (isDisconnectingRef.current) return
    if (!adapter) {
      setWalletName(null)
      return
    }
    isDisconnectingRef.current = true
    setDisconnecting(true)
    try {
      await adapter.disconnect()
      setWalletName(null)
    } finally {
      setDisconnecting(false)
      isDisconnectingRef.current = false
    }
  }, [adapter, setWalletName])

  const sendTransaction: WalletContextState['sendTransaction'] = useCallback(
    async (transaction, connection, options) => {
      if (!adapter) throw new WalletNotConnectedError()
      if (!connected) throw new WalletNotConnectedError()
      return adapter.sendTransaction(transaction, connection, options)
    },
    [adapter, connected],
  )

  const signTransaction = useMemo(
    () =>
      adapter && 'signTransaction' in adapter
        ? async <T extends Transaction | VersionedTransaction>(transaction: T): Promise<T> => {
            if (!connected) throw new WalletNotConnectedError()
            return (adapter as any).signTransaction(transaction)
          }
        : undefined,
    [adapter, connected],
  )

  const signAllTransactions = useMemo(
    () =>
      adapter && 'signAllTransactions' in adapter
        ? async <T extends Transaction | VersionedTransaction>(transactions: T[]): Promise<T[]> => {
            if (!connected) throw new WalletNotConnectedError()
            return (adapter as any).signAllTransactions(transactions)
          }
        : undefined,
    [adapter, connected],
  )

  const signMessage = useMemo(
    () =>
      adapter && 'signMessage' in adapter
        ? async (message: Uint8Array): Promise<Uint8Array> => {
            if (!connected) throw new WalletNotConnectedError()
            return (adapter as any).signMessage(message)
          }
        : undefined,
    [adapter, connected],
  )

  const signIn = useMemo(
    () =>
      adapter && 'signIn' in adapter
        ? async (input?: any) => {
            return (adapter as any).signIn(input)
          }
        : undefined,
    [adapter],
  )

  const contextValue: WalletContextState = useMemo(
    () => ({
      autoConnect: config.autoConnect,
      wallets: wallets.length ? wallets : EMPTY_ARRAY,
      wallet,
      publicKey,
      connecting,
      connected,
      disconnecting,
      select,
      connect,
      disconnect,
      sendTransaction,
      signTransaction,
      signAllTransactions,
      signMessage,
      signIn,
    }),
    [
      config.autoConnect,
      wallets,
      wallet,
      publicKey,
      connecting,
      connected,
      disconnecting,
      select,
      connect,
      disconnect,
      sendTransaction,
      signTransaction,
      signAllTransactions,
      signMessage,
      signIn,
    ],
  )

  return (
    <WalletContext.Provider value={contextValue}>
      <PreviouslyConnectedProvider>{children}</PreviouslyConnectedProvider>
    </WalletContext.Provider>
  )
}

export { WalletAdapterNetwork }
export default WalletConnectionProvider
