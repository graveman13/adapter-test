# @local/unified-wallet-adapter

Репродукція логіки [`@jup-ag/wallet-adapter`](https://www.npmjs.com/package/@jup-ag/wallet-adapter) (Unified Wallet Kit від Jupiter) — без залежності від `@jup-ag/wallet-adapter` та `@solana/wallet-adapter-react`: уся логіка провайдера реалізована з нуля.

## Відтворений функціонал

| Можливість | Реалізація |
| --- | --- |
| `UnifiedWalletProvider` (wallets + config) | [src/contexts/UnifiedWalletProvider.tsx](src/contexts/UnifiedWalletProvider.tsx) |
| Логіка wallet-провайдера: `select/connect/disconnect`, `signTransaction/signAllTransactions/signMessage/signIn`, `sendTransaction`, відстеження `readyState`, події адаптерів | [src/contexts/WalletConnectionProvider/index.tsx](src/contexts/WalletConnectionProvider/index.tsx) |
| Автовиявлення гаманців через **Wallet Standard** (`register`/`unregister`) | [src/hooks/useStandardWalletAdapters.ts](src/hooks/useStandardWalletAdapters.ts) |
| `autoConnect` + збереження вибраного гаманця в `localStorage` (`localStorageKey`) | WalletConnectionProvider + [useLocalStorage](src/hooks/useLocalStorage.ts) |
| Історія підключень («Recently used») | [previouslyConnectedProvider.tsx](src/contexts/WalletConnectionProvider/previouslyConnectedProvider.tsx) |
| `UnifiedWalletButton` (+ `overrideContent`) та `CurrentUserBadge` | [src/components/UnifiedWalletButton](src/components/UnifiedWalletButton/index.tsx) |
| Модалка: топ-3 + «More wallets», сортування за `walletPrecedence` → previously connected → installed, екран **NotInstalled** (install-лінк + deepLink на мобільному), екран **Onboarding** («I don't have a wallet»), `walletlistExplanation`, `walletAttachments`, `walletModalAttachments.footer`, ESC/outside-click | [src/components/UnifiedWalletModal](src/components/UnifiedWalletModal/index.tsx) |
| `notificationCallback`: `onConnect` / `onConnecting` / `onDisconnect` / `onNotInstalled` | [src/contexts/UnifiedWalletProvider.tsx](src/contexts/UnifiedWalletProvider.tsx) |
| Теми `light` / `dark` / `jupiter` | [src/styles.ts](src/styles.ts) (CSS замість twin.macro/emotion) |
| i18n: `en, zh, vi, fr, ja, id, ru` (`lang` у config) | [src/contexts/TranslationProvider](src/contexts/TranslationProvider/index.tsx) |
| `HardcodedWalletStandardAdapter` + `HARDCODED_WALLET_STANDARDS` | [src/adapters/HardcodedWalletStandardAdapter.ts](src/adapters/HardcodedWalletStandardAdapter.ts), [src/misc/constants.ts](src/misc/constants.ts) |
| Утиліти: `shortenAddress`, `formatNumber`, `fromLamports`/`toLamports`, `isMobile`, `useOutsideClick`, `useDebouncedEffect`, `useReactiveEventListener`, `isIosAndRedirectable`, `WRAPPED_SOL_MINT` | [src/misc/utils.ts](src/misc/utils.ts) |
| Хуки: `useUnifiedWallet`, `useUnifiedWalletContext`, `useWallet` (сумісний з wallet-adapter-react), `useTranslation`, `usePreviouslyConnected` | реекспорт у [src/index.tsx](src/index.tsx) |

## Використання

API ідентичне оригіналу — достатньо замінити імпорт:

```tsx
import { UnifiedWalletProvider, UnifiedWalletButton, useUnifiedWallet } from '@local/unified-wallet-adapter'

<UnifiedWalletProvider
  wallets={[]}
  config={{
    autoConnect: false,
    env: 'mainnet-beta',
    metadata: { name: 'App', description: '', url: 'https://example.com', iconUrls: [] },
    notificationCallback: { onConnect, onConnecting, onDisconnect, onNotInstalled },
    walletlistExplanation: { href: 'https://station.jup.ag/docs/additional-topics/wallet-list' },
    hardcodedWallets: HARDCODED_WALLET_STANDARDS,
    walletPrecedence: ['Phantom', 'Solflare'],
    theme: 'dark',
    lang: 'en',
  }}
>
  <UnifiedWalletButton />
</UnifiedWalletProvider>
```

## Відмінності від оригіналу

- Стилі: чистий CSS (інжектиться `<style>`-тегом) замість `twin.macro`/`@emotion` — без додаткових peer-залежностей.
- Mobile Wallet Adapter (Android MWA) не інтегрований; константа `MWA_NOT_FOUND_ERROR` і обробка помилки в `handleConnectClick` збережені.
- Демо-компоненти доків оригінального репозиторію (AppHeader, CodeBlocks, Swap-приклад тощо) не відтворювалися — це сайт-документація, а не API бібліотеки.
