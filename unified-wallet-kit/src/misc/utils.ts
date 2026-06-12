import { useEffect, useRef, type RefObject } from 'react'

export const numberFormatter = new Intl.NumberFormat('en-US', {
  style: 'decimal',
  minimumFractionDigits: 0,
  maximumFractionDigits: 9,
})

export const formatNumber = {
  format: (val?: number, precision?: number): string => {
    if (val === undefined || isNaN(val)) return '--'
    if (precision !== undefined) return val.toFixed(precision)
    return numberFormatter.format(val)
  },
}

export function shortenAddress(address: string, chars = 4): string {
  return `${address.slice(0, chars)}...${address.slice(-chars)}`
}

export function fromLamports(lamportsAmount?: number, decimals?: number, rate = 1): number {
  if (!lamportsAmount) return 0
  return (lamportsAmount / Math.pow(10, decimals ?? 9)) * rate
}

export function toLamports(lamportsAmount: number, decimals: number): number {
  let amount = Number(lamportsAmount)
  let dec = Number(decimals)
  if (Number.isNaN(amount)) amount = 0
  return Math.round(amount * Math.pow(10, dec))
}

export function useReactiveEventListener(
  eventName: string,
  handler: (event: any) => void,
  element: (Window & typeof globalThis) | null = typeof window !== 'undefined' ? window : null,
): void {
  const savedHandler = useRef<(event: any) => void>()

  useEffect(() => {
    savedHandler.current = handler
  }, [handler])

  useEffect(() => {
    const isSupported = Boolean(element && element.addEventListener)
    if (!isSupported || !element) return
    const eventListener = (event: any) => savedHandler.current?.(event)
    element.addEventListener(eventName, eventListener)
    return () => element.removeEventListener(eventName, eventListener)
  }, [eventName, element])
}

export const isMobile = (): boolean =>
  typeof window !== 'undefined' && window.screen && window.screen.width <= 480

export const detectedSeparator = formatNumber.format(1.1).includes(',') ? ',' : '.'

export function useOutsideClick(
  ref: RefObject<HTMLElement>,
  handler: (e: MouseEvent) => void,
): void {
  useEffect(() => {
    const listener = (event: MouseEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) return
      handler(event)
    }
    document.addEventListener('mousedown', listener)
    return () => document.removeEventListener('mousedown', listener)
  }, [ref, handler])
}

export function useDebouncedEffect(fn: Function, deps: any[], time: number): void {
  useEffect(() => {
    const timeout = setTimeout(() => fn(), time)
    return () => clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, time])
}

/**
 * Users on iOS can be redirected into a wallet's in-app browser automatically,
 * if that wallet has a universal link configured to do so.
 * But should not be redirected from within a webview (e.g. already inside a
 * wallet's browser).
 */
export function isIosAndRedirectable(): boolean {
  if (typeof navigator === 'undefined') return false
  const userAgent = navigator.userAgent.toLowerCase()
  const isIos = userAgent.includes('iphone') || userAgent.includes('ipad')
  const isSafari = userAgent.includes('safari')
  // in-app browsers (webviews) don't include "safari" in their user agent
  return isIos && isSafari
}
