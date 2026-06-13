import { useMemo } from 'react'
import {
  UnifiedWalletProvider,
  UnifiedWalletButton,
  useUnifiedWallet,
  randomNonce,
  HARDCODED_WALLET_STANDARDS,
} from '@local/unified-wallet-adapter'
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom'
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare'
import { CoinbaseWalletAdapter } from '@solana/wallet-adapter-coinbase'
import { TrustWalletAdapter } from '@solana/wallet-adapter-trust'
import { LedgerWalletAdapter } from '@solana/wallet-adapter-ledger'
import { WalletReadyState } from '@solana/wallet-adapter-base'

const POPULAR_WALLET_NAMES = ['Phantom', 'Solflare', 'Coinbase Wallet', 'Trust', 'Ledger']

// Структура props відповідає IWalletNotification з Unified Wallet Kit
interface WalletNotificationProps {
  publicKey: string
  shortAddress: string
  walletName: string
}

const WalletNotification = {
  onConnect: (props: WalletNotificationProps) => console.log('Підключено:', props),
  onConnecting: (props: WalletNotificationProps) => console.log('Підключення…', props),
  onDisconnect: (props: WalletNotificationProps) => console.log('Відключено:', props),
  onNotInstalled: (props: WalletNotificationProps) => console.log('Не встановлено:', props),
}

function WalletsOverview() {
  const { wallets, publicKey, connected, wallet } = useUnifiedWallet()

  const detected = wallets.filter(
    (w) =>
      w.adapter.readyState === WalletReadyState.Installed ||
      w.adapter.readyState === WalletReadyState.Loadable,
  )

  const popular = POPULAR_WALLET_NAMES.map((name) => {
    const found = wallets.find((w) => w.adapter.name === name)
    const readyState = found?.adapter.readyState
    return {
      name,
      icon: found?.adapter.icon,
      installed: readyState === WalletReadyState.Installed,
      status:
        readyState === WalletReadyState.Installed
          ? 'Встановлено'
          : readyState === WalletReadyState.Loadable
            ? 'Доступний (web)'
            : 'Не встановлено',
    }
  })

  return (
    <div className="container">
      <header>
        <h1>Jupiter Unified Wallet Kit — демо</h1>
        <UnifiedWalletButton
          // у проді nonce приходить з бекенду: () => fetch('/auth/nonce').then(r => r.json())
          getSignInInput={() => ({
            statement: 'Sign in to Jup Wallet Detect Demo',
            // SIWS nonce must be alphanumeric (no hyphens) — not crypto.randomUUID()
            nonce: randomNonce(),
          })}
          onSignIn={(result) => {
            console.log(`✅ ${result.method} verified=${result.verified}`, {
              publicKey: result.publicKey,
              message: result.message,
            })
            // у проді: fetch('/auth/verify', { method: 'POST', body: JSON.stringify(result) })
          }}
          onSignInError={(error) => console.warn('Sign-in error:', error)}
        />
      </header>

      {connected && publicKey && (
        <div className="card connected">
          <strong>Підключено:</strong> {wallet?.adapter.name}
          <code>{publicKey.toBase58()}</code>
        </div>
      )}

      <section className="card">
        <h2>🔍 Виявлені гаманці у браузері ({detected.length})</h2>
        {detected.length === 0 ? (
          <p className="muted">
            Жодного гаманця не виявлено. Встановіть розширення (наприклад, Phantom або Solflare).
          </p>
        ) : (
          <ul className="wallet-list">
            {detected.map((w) => (
              <li key={w.adapter.name}>
                <img src={w.adapter.icon} alt="" width={28} height={28} />
                <span>{w.adapter.name}</span>
                <span className="badge installed">{w.adapter.readyState}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card">
        <h2>⭐ Популярні гаманці</h2>
        <ul className="wallet-list">
          {popular.map((w) => (
            <li key={w.name}>
              {w.icon ? (
                <img src={w.icon} alt="" width={28} height={28} />
              ) : (
                <span className="icon-placeholder">💼</span>
              )}
              <span>{w.name}</span>
              <span className={w.installed ? 'badge installed' : 'badge'}>{w.status}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

export default function App() {
  // 5 популярних гаманців — показуються у списку навіть якщо не встановлені;
  // решта виявляється автоматично через Wallet Standard
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new CoinbaseWalletAdapter(),
      new TrustWalletAdapter(),
      new LedgerWalletAdapter(),
    ],
    [],
  )

  return (
    <UnifiedWalletProvider
      wallets={wallets}
      config={{
        autoConnect: false,
        env: 'mainnet-beta',
        metadata: {
          name: 'Jup Wallet Detect Demo',
          description: 'Демо виявлення гаманців через Unified Wallet Kit',
          url: 'https://jup.ag',
          iconUrls: ['https://jup.ag/favicon.ico'],
        },
        notificationCallback: WalletNotification,
        walletlistExplanation: {
          href: 'https://station.jup.ag/docs/additional-topics/wallet-list',
        },
        hardcodedWallets: HARDCODED_WALLET_STANDARDS,
        walletPrecedence: ['Phantom' as any, 'Solflare' as any],
        theme: 'dark',
        lang: 'en',
      }}
    >
      <WalletsOverview />
    </UnifiedWalletProvider>
  )
}
