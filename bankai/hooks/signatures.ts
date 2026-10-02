// La firma de cada bankai: lo que pasa entre el reiatsu y el banner terminado.
// Cada una termina (k = SIG-1) con el banner completo a la vista.

import { bch, clamp01, fill, jolt, M, noise, put, ROWS, show, showAll, SIG } from './fx'
import type { Ctx, Signature } from './fx'

const last = (x: Ctx, n: number) => x.k >= SIG - n

// Ichigo: el Getsuga Tenshō, una media luna negra y roja que cruza y deja el banner atrás.
const ichigo: Signature = x => {
  const { g, q, f } = x
  const head = -8 + q * 1.25 * (g.w + 16)
  for (let r = 0; r < ROWS; r++) {
    const edge = Math.round(head - (r - 2.5) ** 2 * 0.9)
    for (let c = 0; c < edge - 2; c++) show(x, r, c)
    put(g, r, edge - 2, '▓', '#b00000')
    put(g, r, edge - 1, '█', '#1a1a1a')
    put(g, r, edge, '▓', '#ff2020')
    for (let c = edge + 1; c <= edge + 4; c++) if (noise(f, r, c) < 0.3) put(g, r, c, '·', '#ff4040')
  }
}

// Byakuya: mil pétalos que se arremolinan y cada uno vuela a su lugar en el banner.
const byakuya: Signature = x => {
  const { g, q, f } = x
  x.banner.forEach((row, r) => {
    ;[...row].forEach((ch, b) => {
      if (ch === ' ') return
      const t = clamp01(q * 1.5 - noise(r, b, 3) * 0.5)
      if (t >= 1) return show(x, r, b + M)
      const sr = noise(r, b, 1) * ROWS
      const sc = noise(b, r, 2) * g.w
      const wob = Math.sin(t * Math.PI) * (noise(b, r, 4) - 0.5) * 12
      const cr = Math.round(sr + (r - sr) * t)
      const cc = Math.round(sc + (b + M - sc) * t + wob)
      if (g.ch[cr]?.[cc] === ' ') put(g, cr, cc, noise(f, r, b) < 0.5 ? '*' : '·', noise(r, b, 6) < 0.5 ? '#ffb7c5' : '#ff69b4')
    })
  })
}

// Renji: Zabimaru, una serpiente de huesos que ondula y escupe fuego.
const renji: Signature = x => {
  const { g, q, f } = x
  const L = 16
  const head = Math.round(q * 1.3 * (g.w + L)) - 4
  const y = (c: number) => Math.round(2.5 + 2.2 * Math.sin(c * 0.35))
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < head - L; c++) show(x, r, c)
  for (let i = L; i >= 0; i--) {
    const c = head - i
    put(g, y(c), c, i === 0 ? '@' : i % 2 ? 'o' : '=', i === 0 || i % 4 === 0 ? '#ffffff' : '#e03a1e')
  }
  for (let d = 1; d <= 4; d++) if (noise(f, d, 1) < 0.75) put(g, y(head), head + d, d < 3 ? '≈' : '~', d < 3 ? '#ffd700' : '#ff4500')
}

// Hitsugaya: flores de hielo que brotan en seis puntos y la escarcha que se expande.
const hitsugaya: Signature = x => {
  const { g, q, f, k } = x
  const seeds = [0, 1, 2, 3, 4, 5].map(i => ({ r: i % 2 ? 1 : 4, c: M + Math.round(((i + 0.5) * x.width) / 6) }))
  const R = q * 15 - 2
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < g.w; c++) {
      const d = Math.min(...seeds.map(s => Math.hypot((r - s.r) * 2.2, c - s.c)))
      if (d < R - 1.5) show(x, r, c, last(x, 4) ? undefined : '#cfefff')
      else if (d < R + 0.5 && noise(f, r, c) < 0.6) put(g, r, c, noise(r, c, f) < 0.5 ? '*' : '+', '#ffffff')
    }
  }
  if (k < SIG - 4) {
    const p = Math.min(3, 1 + Math.floor(k / 3))
    for (const s of seeds) {
      for (let d = 1; d <= p; d++) {
        put(g, s.r, s.c - d * 2, '─', '#7fdbff')
        put(g, s.r, s.c + d * 2, '─', '#7fdbff')
      }
      put(g, s.r - 1, s.c, '│', '#7fdbff')
      put(g, s.r + 1, s.c, '│', '#7fdbff')
      put(g, s.r - 1, s.c - 2, '╲', '#b0e8ff')
      put(g, s.r + 1, s.c + 2, '╲', '#b0e8ff')
      put(g, s.r - 1, s.c + 2, '╱', '#b0e8ff')
      put(g, s.r + 1, s.c - 2, '╱', '#b0e8ff')
      put(g, s.r, s.c, '*', '#ffffff')
    }
  }
}

// Rukia: una ráfaga de hielo que congela todo, se raja y estalla en esquirlas.
const rukia: Signature = x => {
  const { g, q, f, k } = x
  const crack = SIG - 6
  const front = g.w - q * 1.6 * g.w
  for (let r = 0; r < ROWS; r++) {
    for (let c = Math.max(0, Math.floor(front)); c < g.w; c++) {
      show(x, r, c, k >= crack + 2 ? undefined : '#ffffff')
      if (k < crack && bch(x, r, c) === ' ' && noise(r, c, 3) < 0.3) put(g, r, c, '░', '#d8f3ff')
    }
    for (let d = 1; d <= 3; d++) {
      const c = Math.floor(front) - d
      if (noise(f, r, d) < 0.7) put(g, r, c, noise(r, d, f) < 0.5 ? '≈' : '*', '#ffffff')
    }
  }
  if (k >= crack && k < crack + 2) {
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < g.w; c++) {
      if (bch(x, r, c) !== ' ' && noise(r, c, 31) < 0.18) put(g, r, c, (r + c) % 2 ? '╱' : '╲', '#8fcbe8')
    }
  }
  if (k >= crack + 2) {
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < g.w; c++) {
      if (g.ch[r]![c] === ' ' && noise(f, r, c) < 0.03 * (SIG - 1 - k)) put(g, r, c, '·', '#cfefff')
    }
  }
}

// Kenpachi: el banner cae del cielo y el impacto sacude todo.
const kenpachi: Signature = x => {
  const { g, f, k } = x
  if (k < 8) {
    const d = Math.round((1 - (k + 1) / 8) ** 2 * 7)
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < g.w; c++) {
      const ch = bch(x, r + d, c)
      if (ch !== ' ') put(g, r, c, ch, '#ffff80')
    }
    return
  }
  showAll(x, undefined, () => (k < 11 ? '#ffffff' : undefined))
  const amp = Math.max(0, 6 - (k - 8))
  for (let c = 0; c < g.w; c++) {
    if (noise(f, 5, c) < 0.06 * amp) put(g, 5, c, '▓▒░'[c % 3]!, '#ffd700')
    if (noise(f, 4, c) < 0.02 * amp && bch(x, 4, c) === ' ') put(g, 4, c, '*', '#ffff66')
  }
  return jolt(f, amp)
}

// Komamura: la espada del gigante cae, impacta, y la armadura sube desde el piso.
const komamura: Signature = x => {
  const { g, k } = x
  const cx = M + Math.floor(x.width / 2)
  if (k < 6) {
    for (let r = 0; r <= Math.min(ROWS - 1, k); r++) for (let d = -1; d <= 1; d++) put(g, r, cx + d, '█', '#c0c0c0')
    put(g, 0, cx - 2, '═', '#a0703a')
    put(g, 0, cx + 2, '═', '#a0703a')
    return
  }
  const kk = k - 6
  const edge = ROWS - Math.ceil(clamp01((kk + 1) / (SIG - 8)) * ROWS)
  for (let r = edge; r < ROWS; r++) for (let c = 0; c < g.w; c++) show(x, r, c, last(x, 2) ? undefined : '#a0703a')
  if (edge > 0) for (let c = 0; c < g.w; c++) if (bch(x, edge - 1, c) !== ' ') put(g, edge - 1, c, '▀', '#e0c080')
  if (kk < 3) {
    const sp = (kk + 1) * 14
    for (let c = cx - sp; c <= cx + sp; c++) put(g, 5, c, '═', '#ffffff')
    return jolt(k, 4 - kk)
  }
}

// Mayuri: gas venenoso que avanza y, al disiparse, deja el banner corroído en oro.
const mayuri: Signature = x => {
  const { g, q, f } = x
  const front = g.w - q * 1.6 * g.w
  const thin = clamp01((q - 0.55) / 0.45)
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < g.w; c++) {
    if (c > front + 3) show(x, r, c, last(x, 3) ? undefined : noise(r, c, 9) < 0.5 ? '#ffd700' : '#da70d6')
    if (c > front && noise(f >> 1, r, c) < 0.65 * (1 - thin)) {
      put(g, r, c, noise(r, c, f) < 0.5 ? '░' : '▒', noise(c, r, f) < 0.5 ? '#9400d3' : '#da70d6')
    }
  }
}

// Soi Fon: un misil cruza y explota en una bola de fuego.
const soifon: Signature = x => {
  const { g, f, k } = x
  const c0 = Math.floor(g.w / 2)
  if (k < 6) {
    const head = Math.round(((k + 1) / 6) * c0)
    for (let c = 0; c < head - 4; c++) {
      if (noise(f, c, 1) < 0.5) put(g, 2, c, '~', '#888888')
      if (noise(f, c, 2) < 0.25) put(g, 3, c, '·', '#666666')
    }
    put(g, 2, head - 3, '=', '#ffd700')
    put(g, 2, head - 2, '=', '#ffd700')
    put(g, 2, head - 1, '=', '#ffffff')
    put(g, 2, head, '>', '#ffffff')
    return
  }
  const R = (k - 5) * 6
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < g.w; c++) {
    const d = Math.hypot((r - 2.5) * 2.4, c - c0)
    if (d < R - 3) {
      if (k < 11) put(g, r, c, '░', noise(f, r, c) < 0.5 ? '#ff8c00' : '#ffc300')
      else {
        show(x, r, c)
        if (bch(x, r, c) === ' ' && noise(f, r, c) < 0.05 * (SIG - 1 - k)) put(g, r, c, '·', '#777777')
      }
    } else if (d < R) put(g, r, c, noise(f, r, c) < 0.5 ? '▓' : '▒', noise(r, c, f) < 0.5 ? '#ffd700' : '#ff4500')
  }
  if (k < 9) return jolt(f, 3)
}

// Yamamoto: las llamas lo cubren todo, quedan cenizas, y el banner emerge al rojo blanco.
const yamamoto: Signature = x => {
  const { g, f, k } = x
  if (k < 7) {
    const h = ((k + 1) / 7) * 7
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < g.w; c++) {
      const up = ROWS - r
      if (up <= h && noise(f, r, c) < 0.75) {
        const heat = up / ROWS
        put(g, r, c, '^*░▒'[Math.floor(noise(c, r, f) * 4)]!, heat > 0.66 ? '#ffff66' : heat > 0.33 ? '#ff8c00' : '#d00000')
      }
    }
    return
  }
  if (k < 12) {
    const t = (k - 6) / 5
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < g.w; c++) {
      if (bch(x, r, c) !== ' ' && noise(r, c, 13) < t) show(x, r, c, '#ffffff')
      else if (noise(f, r, c) < 0.3 * (1 - t)) put(g, r, c, '·', '#777777')
    }
    return
  }
  const t = (k - 12) / (SIG - 13)
  showAll(x, undefined, () => (t < 0.4 ? '#ffff66' : t < 0.8 ? '#ff8c00' : undefined))
}

// Shunsui: la tragedia en cuatro actos. Se cierra el telón, y se vuelve a abrir.
const shunsui: Signature = x => {
  const { g, k } = x
  const half = g.w / 2
  const cover = k < 4 ? ((k + 1) / 4) * half : k < 8 ? half : Math.max(0, (1 - (k - 7) / (SIG - 9)) * half)
  if (k >= 8) showAll(x)
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < g.w; c++) {
    if (c < cover || c >= g.w - cover) put(g, r, c, c % 4 === 0 ? '▓' : '█', Math.floor(c / 4) % 2 ? '#b04aa0' : '#7a2a7a')
  }
  if (k >= 4 && k < 8) for (let c = 0; c < g.w; c++) put(g, 0, c, '▀', '#ffd700')
}

// Ikkaku: el emblema del dragón se carga de rojo y giran las tres hojas.
const ikkaku: Signature = x => {
  const { g, k } = x
  if (k < 8) {
    const to = ((k + 1) / 8) * g.w
    showAll(x, undefined, (_, c) => (c < to ? '#ff2020' : '#555555'))
    return
  }
  if (k < 14) {
    showAll(x, undefined, () => (k % 2 ? '#ff6347' : '#ffd700'))
    const i = k % 4
    for (const p of [0.2, 0.5, 0.8]) {
      const cc = Math.round(p * g.w)
      for (let t = -2; t <= 2; t++) {
        const r = i === 0 ? 2 + t : i === 2 ? 2 : i === 1 ? 2 - t : 2 + t
        const c = i === 0 ? cc : cc + t * 2
        put(g, r, c, '│╱─╲'[i]!, '#ffffff')
      }
    }
    return jolt(k, 2)
  }
  showAll(x)
}

// Shinji: el mundo al revés. Todo aparece invertido y espejado, y se da vuelta.
const FLIP: Record<string, string> = { '╔': '╚', '╚': '╔', '╗': '╝', '╝': '╗' }
const MIRROR: Record<string, string> = { '╔': '╗', '╗': '╔', '╚': '╝', '╝': '╚', '╱': '╲', '╲': '╱' }
const shinji: Signature = x => {
  const { g, k } = x
  const inverted = (r: number) =>
    [...x.banner[ROWS - 1 - r]!].reverse().map(ch => {
      const v = FLIP[ch] ?? ch
      return MIRROR[v] ?? v
    })
  const draw = (rows: number[], src: (r: number) => string[], color: string | undefined) => {
    for (const r of rows) src(r).forEach((ch, b) => ch !== ' ' && put(g, r, b + M, ch, color ?? '#9acd32'))
  }
  const normal = (r: number) => [...x.banner[r]!]
  if (k < 8) draw([0, 1, 2, 3, 4, 5], inverted, k % 3 === 0 ? '#e6ff80' : '#9acd32')
  else if (k === 8) draw([1, 2, 3, 4], inverted, '#e6ff80')
  else if (k === 9) draw([2, 3], inverted, '#ffffff')
  else if (k === 10) for (let b = 0; b < x.width; b++) put(g, 2, b + M, '━', '#ffd700')
  else if (k === 11) draw([2, 3], normal, '#ffffff')
  else if (k === 12) draw([1, 2, 3, 4], normal, '#e6ff80')
  else showAll(x)
}

// Urahara: el banner desarmado en bloques que se cosen de vuelta en su lugar.
const urahara: Signature = x => {
  const { g, q } = x
  const blocks: { r: number; b0: number; t: number; dr: number; dc: number }[] = []
  x.banner.forEach((_, r) => {
    for (let b0 = 0; b0 < x.width; b0 += 4) {
      const t = clamp01(q * 1.6 - noise(r, b0, 8) * 0.6)
      blocks.push({
        r, b0, t,
        dr: Math.round((noise(r, b0, 1) - 0.5) * 5 * (1 - t)),
        dc: Math.round((noise(b0, r, 2) - 0.5) * 18 * (1 - t)),
      })
    }
  })
  for (const bl of blocks) {
    if (bl.t >= 1) continue
    for (let j = 0; j < 4; j++) if (bch(x, bl.r, bl.b0 + j + M) !== ' ') put(g, bl.r, bl.b0 + j + M, '·', '#7a0a24')
  }
  for (const bl of blocks) {
    for (let j = 0; j < 4; j++) {
      const ch = bch(x, bl.r, bl.b0 + j + M)
      if (ch === ' ') continue
      if (bl.t >= 1) show(x, bl.r, bl.b0 + j + M)
      else put(g, bl.r + bl.dr, bl.b0 + j + M + bl.dc, ch, bl.t > 0.6 ? '#ff7aa8' : '#dc143c')
    }
  }
}

// Gin: la lanza se estira trece kilómetros en un instante, y vuelve.
const gin: Signature = x => {
  const { g, k } = x
  if (k < 3) {
    const len = Math.round(((k + 1) / 3) * g.w)
    for (let c = 0; c < len - 1; c++) put(g, 2, c, '━', '#ffffff')
    put(g, 2, len - 1, '>', '#ffffff')
    return
  }
  if (k < 5) {
    for (let c = 0; c < g.w; c++) {
      put(g, 2, c, '═', '#ffffff')
      put(g, 3, c, '─', '#c0c0c0')
    }
    return jolt(k, 2)
  }
  if (k < 7) {
    const len = Math.round((1 - (k - 4) / 3) * g.w)
    for (let c = 0; c < len; c++) put(g, 2, c, '━', '#c0c0c0')
    return
  }
  const span = ((k - 6) / (SIG - 8)) * 3.5
  showAll(x, r => Math.abs(r - 2.5) < span, () => (last(x, 2) ? undefined : '#e0e0e0'))
}

// Tōsen: la cúpula de Enma Kōrogi. Oscuridad total, sin sentidos, y se disuelve.
const tosen: Signature = x => {
  const { g, k } = x
  const cx = g.w / 2
  const dist = (r: number, c: number) => Math.hypot((r - 2.5) * 2.6, c - cx)
  if (k < 8) {
    const R = ((k + 1) / 8) * (g.w / 2 + 6)
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < g.w; c++) {
      const d = dist(r, c)
      if (d < R - 1) put(g, r, c, '█', '#1a1a2e')
      else if (d < R + 0.6) put(g, r, c, c < cx ? '(' : ')', '#9370db')
    }
    return
  }
  if (k < 12) {
    fill(x, '█', '#1a1a2e')
    showAll(x, undefined, () => '#2f2f4f')
    return
  }
  const t = (k - 11) / (SIG - 12)
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < g.w; c++) {
    if (noise(r, c, 17) > t) put(g, r, c, '█', '#1a1a2e')
    else show(x, r, c, t < 0.7 ? '#9a9a9a' : undefined)
  }
}

// Rōjūrō: el concierto. Barras de ecualizador doradas al ritmo, y el banner al final.
const rojuro: Signature = x => {
  const { g, k } = x
  const settle = clamp01((k - 9) / (SIG - 10))
  for (let b = 0; b < x.width; b++) {
    const c = b + M
    const h = Math.round((0.5 + 0.5 * Math.sin(b * 0.45 + k * 0.9)) * ROWS * Math.min(1, (k + 1) / 4) * (1 - settle))
    for (let r = ROWS - h; r < ROWS; r++) put(g, r, c, '█', r < 2 ? '#fff0a0' : r < 4 ? '#ffd700' : '#b8860b')
    if (settle > 0) for (let r = 0; r < ROWS - h; r++) show(x, r, c)
  }
  if (k < SIG - 3) {
    for (let r = 1; r <= 4; r++) for (let d = 0; d < 4; d++) if ((d + k) % 3 === 0) put(g, r, d, ')', '#ffd700')
  }
}

// Kensei: cinco puñetazos; cada impacto revela un pedazo.
const kensei: Signature = x => {
  const { g, k, f } = x
  const hits = [0, 1, 2, 3, 4].map(i => ({ t: 1 + i * 2, r: i % 2 ? 1 : 4, c: M + Math.round((0.1 + i * 0.2) * x.width) }))
  for (const h of hits) {
    if (k >= h.t) showAll(x, (_, c) => Math.abs(c - h.c) <= 6 + (k - h.t) * 2, () => (k - h.t < 2 ? '#ffffff' : undefined))
  }
  if (k >= 11) showAll(x)
  let shake: number[] | undefined
  for (const h of hits) {
    if (k !== h.t && k !== h.t + 1) continue
    const s = k === h.t ? 2 : 3
    const col = k === h.t ? '#ffffff' : '#7aa7d9'
    put(g, h.r, h.c, '*', '#ffffff')
    for (let d = 1; d <= s; d++) {
      put(g, h.r, h.c - d * 2, '─', col)
      put(g, h.r, h.c + d * 2, '─', col)
      put(g, h.r - d, h.c, '│', col)
      put(g, h.r + d, h.c, '│', col)
      put(g, h.r - d, h.c + d * 2, '╱', col)
      put(g, h.r + d, h.c - d * 2, '╱', col)
      put(g, h.r - d, h.c - d * 2, '╲', col)
      put(g, h.r + d, h.c + d * 2, '╲', col)
    }
    shake = jolt(f, 4)
  }
  return shake
}

// Hisagi: cadenas que envuelven el banner, se tensan, y se rompen.
const hisagi: Signature = x => {
  const { g, k, f } = x
  const reach = Math.min(1, (k + 1) / 6) * g.w
  const isTight = k >= 6 && k < 11
  const wave = (c: number, s: number) => Math.round(2.5 + s * 2.3 * Math.sin(c * 0.22 + (isTight ? k * 0.6 : 0)))
  if (k < 11) {
    if (k >= 3) showAll(x, undefined, () => '#3a4a32')
    for (let c = 0; c < reach; c++) for (const s of [1, -1]) put(g, wave(c, s), c, c % 2 ? 'o' : '-', '#a0a0a0')
    return isTight ? jolt(f, 2) : undefined
  }
  showAll(x)
  if (last(x, 1)) return
  const t = k - 11
  for (let c = 0; c < g.w; c++) {
    for (const s of [1, -1]) {
      if (noise(c, s + 2, 5) > 0.55 - t * 0.08) continue
      const r = wave(c, s) + Math.floor(t * (0.5 + noise(c, s + 2, 6)))
      if (r < ROWS) put(g, r, c, 'o', '#707070')
    }
  }
}

// Unohana: sangre que gotea desde arriba y se va acumulando.
const unohana: Signature = x => {
  const { g, k } = x
  const drip = (c: number) => noise(c, 1, 1) < 0.4
  const len = (c: number, kk: number) => Math.floor((kk + 1) * (0.4 + noise(c, 2, 2) * 0.8))
  const level = k < 9 ? ROWS : ROWS - Math.ceil(((k - 8) / (SIG - 9)) * ROWS)
  for (let c = 0; c < g.w; c++) {
    const n = drip(c) ? Math.min(ROWS, len(c, Math.min(k, 8))) : 0
    for (let r = 0; r < ROWS; r++) {
      if (r >= level) show(x, r, c, last(x, 2) ? undefined : '#8b0000')
      else if (r < n) {
        if (bch(x, r, c) !== ' ') show(x, r, c, '#8b0000')
        else put(g, r, c, r === n - 1 ? 'v' : '│', '#a00000')
      }
    }
  }
}

// Mugetsu: la oscuridad y un único corte. Después, el banner sale de la nada.
const mugetsu: Signature = x => {
  const { g, k } = x
  const lift = (k - (SIG - 4)) / 3 // la oscuridad se disipa en los últimos cuadros
  fill(x, '█', '#151515', (r, c) => noise(r, c, 23) >= lift)
  if (k < 8) {
    const reach = Math.round(((k + 1) / 8) * g.w * 1.2)
    for (let c = 0; c < Math.min(reach, g.w); c++) put(g, 2, c, c > reach - 4 ? '━' : '─', '#ffffff')
    return
  }
  const t = (k - 7) / (SIG - 8)
  showAll(x, (r, c) => noise(r, c, 5) < t, () => (t < 0.8 ? '#9a9a9a' : undefined))
}

export const SIGNATURES: Record<string, Signature> = {
  'Kurosaki Ichigo': ichigo,
  'Kuchiki Byakuya': byakuya,
  'Abarai Renji': renji,
  'Hitsugaya Tōshirō': hitsugaya,
  'Zaraki Kenpachi': kenpachi,
  'Komamura Sajin': komamura,
  'Kurotsuchi Mayuri': mayuri,
  'Soi Fon': soifon,
  'Yamamoto Genryūsai': yamamoto,
  'Kyōraku Shunsui': shunsui,
  'Kuchiki Rukia': rukia,
  'Madarame Ikkaku': ikkaku,
  'Hirako Shinji': shinji,
  'Urahara Kisuke': urahara,
  'Ichimaru Gin': gin,
  'Tōsen Kaname': tosen,
  'Ōtoribashi Rōjūrō': rojuro,
  'Muguruma Kensei': kensei,
  'Hisagi Shūhei': hisagi,
  'Unohana Retsu': unohana,
  mugetsu,
}
