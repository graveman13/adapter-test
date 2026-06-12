import React, { createContext, useContext, useEffect } from 'react'
import { useWallet } from './index'
import { useLocalStorage } from '../../hooks/useLocalStorage'

const PREVIOUSLY_CONNECTED_KEY = 'unified-wallet-previously-connected'

const PreviouslyConnectedContext = createContext<string[]>([])

const PreviouslyConnectedProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { wallet, connected } = useWallet()
  const [previouslyConnected, setPreviouslyConnected] = useLocalStorage<string[]>(
    PREVIOUSLY_CONNECTED_KEY,
    [],
  )

  useEffect(() => {
    if (connected && wallet) {
      const name = wallet.adapter.name as string
      // most recently connected first
      setPreviouslyConnected([name, ...previouslyConnected.filter((n) => n !== name)])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallet, connected])

  return (
    <PreviouslyConnectedContext.Provider value={previouslyConnected}>
      {children}
    </PreviouslyConnectedContext.Provider>
  )
}

const usePreviouslyConnected = () => useContext(PreviouslyConnectedContext)

export { PreviouslyConnectedProvider, usePreviouslyConnected }
export default PreviouslyConnectedContext
