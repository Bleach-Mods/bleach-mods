// Herramientas de dibujo compartidas por las firmas de cada bankai.

export type Theme = {
  grad: string[] // degradé del banner, de izquierda a derecha
  parts: string // partículas del reiatsu mientras se tipea la frase
  pcolors: string[]
  motion: 'fall' | 'rise' | 'drift' | 'burst'
  isDark?: boolean // la oscuridad lo cubre todo antes del golpe (Mugetsu)
}

export const ROWS = 6
export const M = 5 // margen del lienzo a cada lado del banner, para los efectos
export const SIG = 18 // cuadros de la firma de cada bankai

export type Grid = { ch: string[][]; co: string[][]; w: number }

// k: cuadro de la firma (0..SIG-1), q: progreso (0..1], f: cuadro global.
export type Ctx = { k: number; q: number; f: number; banner: string[]; width: number; th: Theme; g: Grid }

// Dibuja sobre el lienzo; puede devolver un temblor horizontal por fila.
export type Signature = (x: Ctx) => number[] | void

export const clamp01 = (v: number): number => Math.max(0, Math.min(1, v))

// Ruido determinístico: el mismo cuadro siempre se dibuja igual.
export function noise(a: number, b: number, c: number): number {
  let h = Math.imul(a + 1, 73856093) ^ Math.imul(b + 1, 19349663) ^ Math.imul(c + 1, 83492791)
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

export function mix(stops: string[], t: number, shade: number): string {
  const rgb = (h: string) => {
    const n = parseInt(h.slice(1), 16)
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
  }
  const x = clamp01(t) * (stops.length - 1)
  const i = Math.min(stops.length - 2, Math.floor(x))
  const u = x - i
  const a = rgb(stops[i]!)
  const b = rgb(stops[i + 1]!)
  return '#' + a.map((v, j) => Math.round((v + (b[j]! - v) * u) * shade).toString(16).padStart(2, '0')).join('')
}

export function newGrid(width: number): Grid {
  const w = width + 2 * M
  const blank = (fill: string) => Array.from({ length: ROWS }, () => Array.from({ length: w }, () => fill))
  return { ch: blank(' '), co: blank(''), w }
}

export function put(g: Grid, r: number, c: number, ch: string, color: string): void {
  if (r < 0 || r >= ROWS || c < 0 || c >= g.w) return
  g.ch[r]![c] = ch
  g.co[r]![c] = color
}

// El carácter del banner en la columna `c` del lienzo (o ' ').
export function bch(x: Ctx, r: number, c: number): string {
  const row = x.banner[r]
  const b = c - M
  return row !== undefined && b >= 0 && b < row.length ? row[b]! : ' '
}

export function grad(x: Ctx, r: number, c: number): string {
  return mix(x.th.grad, ((c - M) / x.width) * 0.75 + (r / 5) * 0.25, 1 - r * 0.05)
}

export function show(x: Ctx, r: number, c: number, color?: string): void {
  const ch = bch(x, r, c)
  if (ch !== ' ') put(x.g, r, c, ch, color ?? grad(x, r, c))
}

export function showAll(x: Ctx, pred?: (r: number, c: number) => boolean, color?: (r: number, c: number) => string | undefined): void {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < x.g.w; c++) {
      if (!pred || pred(r, c)) show(x, r, c, color?.(r, c))
    }
  }
}

export function fill(x: Ctx, ch: string, color: string, pred?: (r: number, c: number) => boolean): void {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < x.g.w; c++) {
      if (!pred || pred(r, c)) put(x.g, r, c, ch, color)
    }
  }
}

export const jolt = (f: number, amp: number): number[] =>
  Array.from({ length: ROWS }, (_, r) => Math.round((noise(f, r, 77) - 0.5) * amp))
