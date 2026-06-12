import { useCallback, useState } from 'react'

export function useLocalStorage<T>(key: string, defaultState: T): [T, (value: T) => void] {
  const [value, setValueInner] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key)
      if (stored) return JSON.parse(stored) as T
    } catch (error) {
      console.error(error)
    }
    return defaultState
  })

  const setValue = useCallback(
    (newValue: T) => {
      setValueInner(newValue)
      try {
        if (newValue === null || newValue === undefined) {
          localStorage.removeItem(key)
        } else {
          localStorage.setItem(key, JSON.stringify(newValue))
        }
      } catch (error) {
        console.error(error)
      }
    },
    [key],
  )

  return [value, setValue]
}
