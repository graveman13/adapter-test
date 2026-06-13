// bs58@4 ships no type declarations
declare module 'bs58' {
  const bs58: {
    encode(buffer: Uint8Array | number[]): string
    decode(str: string): Uint8Array
  }
  export default bs58
}
