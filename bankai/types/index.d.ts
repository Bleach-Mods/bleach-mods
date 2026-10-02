export type Release = { index: number; at: number }

export type MaskAnim = { kind: 'form' | 'shatter'; frame: number; stage: number }

declare module 'claude-code' {
  interface PluginState {
    bankai: {
      release: Release | null
      lastIndex: number
      percent: number | null
      stage: number
      frame: number
      mask: MaskAnim | null
    }
  }
}
