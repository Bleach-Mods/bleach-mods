import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, Timer } from 'claude-code'

import type { MaskAnim, Release } from '../types'
import { M, mix, newGrid, noise, SIG } from './fx'
import type { Theme } from './fx'
import { SIGNATURES } from './signatures'

const release = atom({ plugin: 'bankai', key: 'release' } as const, null)
const lastIndex = atom({ plugin: 'bankai', key: 'lastIndex' } as const, -1)
const percent = atom({ plugin: 'bankai', key: 'percent' } as const, null)
const stage = atom({ plugin: 'bankai', key: 'stage' } as const, 0)
// Cuadro de la animación de liberación; -1 = terminada (banner quieto).
const frame = atom({ plugin: 'bankai', key: 'frame' } as const, -1)
const mask = atom({ plugin: 'bankai', key: 'mask' } as const, null)

// ── Temas: los colores y las partículas de cada bankai (la firma está en signatures.ts) ──

type Bankai = { who: string; name: string; line: string; key: string; theme: Theme }

const T = (grad: string[], parts: string, pcolors: string[], motion: Theme['motion']): Theme => ({ grad, parts, pcolors, motion })

const BANKAIS: Bankai[] = [
  { who: 'Kurosaki Ichigo', name: 'Tensa Zangetsu', line: 'Katsu tame ni tatakau n ja nai. Mamoru tame ni tatakau n da.',
    theme: T(['#ff3b3b', '#b00000', '#5a0000'], '░▒▓', ['#ff2020', '#555555'], 'rise') },
  { who: 'Kuchiki Byakuya', name: 'Senbonzakura Kageyoshi', line: 'Sen no yaiba no kaben, sono kage sura mienu darou.',
    theme: T(['#ffd1dc', '#ff69b4', '#c71585'], '*+·', ['#ffb7c5', '#ff69b4'], 'fall') },
  { who: 'Abarai Renji', name: 'Sōō Zabimaru', line: 'Itsuka kanarazu, ano hito wo koete miseru.',
    theme: T(['#ff7a3d', '#e03a1e', '#8b1a1a'], '~≈', ['#ff4500', '#ffffff'], 'rise') },
  { who: 'Hitsugaya Tōshirō', name: 'Daiguren Hyōrinmaru', line: 'Hitsugaya taichou da. Toushirou ja nee.',
    theme: T(['#ffffff', '#7fdbff', '#1e6fd9'], '*·+', ['#e0ffff', '#7fdbff'], 'drift') },
  { who: 'Zaraki Kenpachi', name: '(sin nombre)', line: 'Namae nanza shiranakute yokatta... kyou made wa na.',
    theme: T(['#ffff80', '#ffd700', '#b8860b'], '▓▒░', ['#ffd700', '#ffff66'], 'burst') },
  { who: 'Komamura Sajin', name: 'Kokujō Tengen Myōō', line: 'Waga se ni, yoroi no kyojin ga tachiagaru.',
    theme: T(['#e0c080', '#a0703a', '#5c3a1a'], '▒░', ['#c0a060', '#8b4513'], 'rise') },
  { who: 'Kurotsuchi Mayuri', name: 'Konjiki Ashisogi Jizō', line: 'Jitsu ni kyoumibukai. Kiroku sasete morau yo.',
    theme: T(['#ffd700', '#da70d6', '#7a00c0'], '░▒·', ['#9400d3', '#ffd700'], 'rise') },
  { who: 'Soi Fon', name: 'Jakuhō Raikōben', line: 'Kono bankai wa kirai da. Onmitsu no kakera mo nai.',
    theme: T(['#fff2a0', '#ffc300', '#ff8c00'], '·*', ['#ffd700', '#ffffff'], 'burst') },
  { who: 'Yamamoto Genryūsai', name: 'Zanka no Tachi', line: 'Banshou issai, kaijin to nase.',
    theme: T(['#ffff66', '#ff8c00', '#d00000'], '^*░', ['#ff4500', '#ffd700'], 'rise') },
  { who: 'Kyōraku Shunsui', name: 'Katen Kyōkotsu: Karamatsu Shinjū', line: 'Shimaku no higeki sa. Hontou ni sumanai ne.',
    theme: T(['#ff8fc8', '#b04aa0', '#4b0082'], '·*', ['#ff69b4', '#9370db'], 'drift') },
  { who: 'Kuchiki Rukia', name: 'Hakka no Togame', line: 'Zettai reido. Toki sae mo tomaru.',
    theme: T(['#ffffff', '#d8f3ff', '#8fcbe8'], '*·', ['#ffffff', '#cfefff'], 'fall') },
  { who: 'Madarame Ikkaku', name: 'Ryūmon Hōzukimaru', line: 'Ore ga bankai dekiru koto wa, dare ni mo shirarecha naranee.',
    theme: T(['#ffd27a', '#ff6347', '#a0281a'], '▒░*', ['#ff6347', '#ffd700'], 'burst') },
  { who: 'Hirako Shinji', name: 'Sakashima Yokoshima Happō Fusagari', line: 'Ue wa shita ya. Omae wa mou maketoru.',
    theme: T(['#e6ff80', '#9acd32', '#3c7a1e'], '·~', ['#9acd32', '#ffd700'], 'drift') },
  { who: 'Urahara Kisuke', name: 'Kannonbiraki Benihime Aratame', line: 'Tada no dagashiya ssu yo... misecha ikenai mono wo motta, ne.',
    theme: T(['#ff7aa8', '#dc143c', '#7a0a24'], '·*', ['#dc143c', '#ffffff'], 'drift') },
  { who: 'Ichimaru Gin', name: 'Kamishini no Yari', line: 'Juusan kiro ya. Kannin na, kowagarasete shimota?',
    theme: T(['#ffffff', '#c0c0c0', '#707070'], '─·', ['#e0e0e0', '#a9a9a9'], 'drift') },
  { who: 'Tōsen Kaname', name: 'Suzumushi Tsuishiki: Enma Kōrogi', line: 'Waga yami no naka de wa, dare mo miezu, dare mo kikoenu.',
    theme: T(['#b9a3ff', '#7a5cc7', '#2f2f4f'], '·░', ['#9370db', '#4b4b6b'], 'drift') },
  { who: 'Ōtoribashi Rōjūrō', name: 'Kinshara Butōdan', line: 'Saa, ensoukai wo hajimeyou.',
    theme: T(['#fff0a0', '#ffd700', '#b8860b'], '~·', ['#ffd700', '#ffffff'], 'drift') },
  { who: 'Muguruma Kensei', name: 'Tekken Tachikaze', line: 'Damatte tatakae.',
    theme: T(['#e8e8e8', '#7aa7d9', '#2f5f8f'], '▒░', ['#c0c0c0', '#4682b4'], 'burst') },
  { who: 'Hisagi Shūhei', name: 'Fushi no Kōjaku', line: 'Yatto tsukaikonaseta... soredemo kirai da.',
    theme: T(['#c8d8c0', '#7a8f6a', '#3a4a32'], '·─', ['#a0a0a0', '#556b2f'], 'drift') },
  { who: 'Unohana Retsu', name: 'Minazuki', line: 'Shodai Kenpachi wa, doko ni mo itte wa imasen.',
    theme: T(['#f0e8ff', '#b05070', '#6a0000'], '·*', ['#e6e6fa', '#8b0000'], 'fall') },
].map(b => ({ ...b, key: b.who }))

// El secreto: sale solo cuando una tarea tarda más de 5 minutos.
const MUGETSU_INDEX = BANKAIS.length
const MUGETSU: Bankai = {
  who: 'Kurosaki Ichigo',
  name: 'Mugetsu ─ Saigo no Getsuga Tenshou',
  line: 'Kore ga saigo no Getsuga Tenshou da.',
  key: 'mugetsu',
  theme: { ...T(['#f4f4f4', '#9a9a9a', '#3a3a3a'], '█▓', ['#151515', '#222222'], 'burst'), isDark: true },
}
const MUGETSU_MS = 5 * 60_000

const bankaiAt = (i: number): Bankai | undefined => (i === MUGETSU_INDEX ? MUGETSU : BANKAIS[i])

const BANNER = [
  '██████╗  █████╗ ███╗   ██╗██╗  ██╗ █████╗ ██╗',
  '██╔══██╗██╔══██╗████╗  ██║██║ ██╔╝██╔══██╗██║',
  '██████╔╝███████║██╔██╗ ██║█████╔╝ ███████║██║',
  '██╔══██╗██╔══██║██║╚██╗██║██╔═██╗ ██╔══██║██║',
  '██████╔╝██║  ██║██║ ╚████║██║  ██╗██║  ██║██║',
  '╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═══╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝',
]

// Ichigo lo grita en dos tiempos: BAN-KAI. El guion va entre la N (col 26) y la K.
const DASH = ['       ', '       ', '█████╗ ', '╚════╝ ', '       ', '       ']
const BANNER_ICHIGO = BANNER.map((row, i) => `${row.slice(0, 26)} ${DASH[i]}${row.slice(26)}`)
const ICHIGO = 'Kurosaki Ichigo'

const LETTERS: Record<string, string[]> = {
  M: ['███╗   ███╗', '████╗ ████║', '██╔████╔██║', '██║╚██╔╝██║', '██║ ╚═╝ ██║', '╚═╝     ╚═╝'],
  U: ['██╗   ██╗', '██║   ██║', '██║   ██║', '██║   ██║', '╚██████╔╝', ' ╚═════╝ '],
  G: [' ██████╗ ', '██╔════╝ ', '██║  ███╗', '██║   ██║', '╚██████╔╝', ' ╚═════╝ '],
  E: ['███████╗', '██╔════╝', '█████╗  ', '██╔══╝  ', '███████╗', '╚══════╝'],
  T: ['████████╗', '╚══██╔══╝', '   ██║   ', '   ██║   ', '   ██║   ', '   ╚═╝   '],
  S: ['███████╗', '██╔════╝', '███████╗', '╚════██║', '███████║', '╚══════╝'],
}
const BANNER_MUGETSU = [0, 1, 2, 3, 4, 5].map(r =>
  [...'MUGETSU']
    .map(l => {
      const rows = LETTERS[l]!
      const w = Math.max(...rows.map(x => x.length))
      return rows[r]!.padEnd(w)
    })
    .join(''),
)

const bannerOf = (i: number, b: Bankai): string[] =>
  i === MUGETSU_INDEX ? BANNER_MUGETSU : b.who === ICHIGO ? BANNER_ICHIGO : BANNER

// La máscara de Ichigo; los cuernos aparecen recién en Vasto Lorde.
const HORNS = '▄▀            ▀▄'
const MASK = [
  '  ▄▄████████▄▄  ',
  ' ███▀▀████▀▀███ ',
  ' ███  ▄██▄  ███ ',
  '  ▀█▐▌▐▌▐▌▐▌█▀  ',
]
const STRIPES = new Set([2, 3]) // las franjas rojas del lado izquierdo

type Stage = { min: number; title: string; line: string; color: string }

const STAGES: Stage[] = [
  { min: 0, title: '', line: '', color: 'gray' },
  { min: 50, title: '░ Reiatsu inestable', line: 'Algo se mueve adentro tuyo...', color: 'white' },
  { min: 70, title: '▒ Media máscara', line: 'Che, rey... ¿me prestás el cuerpo un rato?', color: 'white' },
  { min: 85, title: '▓ Hollowificación completa', line: '¿Cuál es la diferencia entre un rey y su caballo?', color: 'red' },
  { min: 95, title: '█ VASTO LORDE', line: 'Compactación inminente. Ya no hay vuelta atrás.', color: 'red' },
]

const stageOf = (pct: number): number => {
  let at = 0
  STAGES.forEach((s, i) => {
    if (pct >= s.min) at = i
  })
  return at
}

const maskRowsOf = (st: number): string[] => (st >= 4 ? [HORNS, ...MASK] : MASK)

const pickIndex = (avoid: number): number => {
  const n = Math.floor(Math.random() * (BANKAIS.length - 1))
  return n >= avoid && avoid >= 0 ? n + 1 : n
}

// ── Animación: tipeo → reiatsu → golpe → aparición → destello → brillo ──
const FRAME_MS = 60
const TYPE_CHARS = 2
const SHAKE = 12
const FLASH = 3
const SHIMMER = 16
const INDENT = 7
const GLITCH = '!<>-_/[]{}=+*^?#░▒▓'

const MASK_MS = 70
const FORM = 14
const SHATTER = 20

type Phases = { type: number; shake: number; sig: number; flash: number; total: number }

function phasesOf(line: string): Phases {
  const type = Math.ceil(line.length / TYPE_CHARS)
  const shake = type + SHAKE
  const sig = shake + SIG
  const flash = sig + FLASH
  return { type, shake, sig, flash, total: flash + SHIMMER }
}

// Una fila de partículas que se mueven según el tema.
function particles(th: Theme, f: number, r: number, width: number, density: number): string {
  const step = f >> 1
  let out = ''
  for (let c = 0; c < width; c++) {
    const n =
      th.motion === 'fall' ? noise(c, r - step, 3)
      : th.motion === 'rise' ? noise(c, r + step, 3)
      : th.motion === 'drift' ? noise(c + step * 2, r, 3)
      : noise(f, r, c)
    out += n < density ? th.parts[Math.floor(noise(c, r, f >> 2) * th.parts.length)] : ' '
  }
  return out
}

// En Windows no hay reproductor para $.audio: se usa el SoundPlayer de .NET.
async function playSlash($: EngineInterface): Promise<void> {
  const root = $.plugin.root
  try {
    if (/^[A-Za-z]:[\\/]/.test(root)) {
      const wav = `${root}\\sounds\\slash.wav`.replace(/'/g, "''")
      await $.process.run(['powershell', '-NoProfile', '-NonInteractive', '-Command', `(New-Object Media.SoundPlayer '${wav}').PlaySync()`])
    } else {
      await $.audio.play({ asset: 'sounds/slash.wav' })
    }
  } catch {
    // Sin sonido no pasa nada: la animación sigue igual.
  }
}

// La animación en curso y el turno de la demo vigente (una nueva corta la anterior).
let animTimer: Timer | undefined
let demoRun = 0

// Muestra un bankai y corre su animación cuadro por cuadro.
async function animate($: EngineInterface, index: number, isSoundOn: boolean, onEnd?: () => void): Promise<void> {
  const b = bankaiAt(index)!
  const ph = phasesOf(b.line)
  const soundAt = Math.max(0, ph.shake - 5) // PowerShell tarda en arrancar: se adelanta
  const shown: Release = { index, at: await $.clock.now() }
  let f = 0
  animTimer?.cancel()
  await update($, release, () => shown)
  await update($, frame, () => 0)
  animTimer = $.clock.every(FRAME_MS, () => {
    f += 1
    if (f === soundAt && isSoundOn) void playSlash($)
    if (f >= ph.total) {
      animTimer?.cancel()
      onEnd?.()
    }
    void update($, frame, () => (f >= ph.total ? -1 : f))
  })
}

async function demoAll($: EngineInterface, isSoundOn: boolean, run: number, i: number): Promise<void> {
  if (run !== demoRun || i > BANKAIS.length) return
  await animate($, i, isSoundOn, () => {
    $.clock.after(1200, () => void demoAll($, isSoundOn, run, i + 1))
  })
}

const norm = (s: string): string =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

function findBankai(arg: string): number | undefined {
  if (arg.length >= 3 && 'mugetsu'.startsWith(arg)) return MUGETSU_INDEX
  const i = BANKAIS.findIndex(b => norm(`${b.who} ${b.name}`).split(/[\s:()]+/).some(w => w.startsWith(arg)))
  return i < 0 ? undefined : i
}

async function recordRelease($: EngineInterface, b: Bankai): Promise<string | undefined> {
  const counts = ((await $.store.get('counts')) ?? {}) as Record<string, number>
  const isNew = !counts[b.key]
  counts[b.key] = (counts[b.key] ?? 0) + 1
  await $.store.set('counts', counts)
  if (!isNew) return undefined
  if (b.key === MUGETSU.key) return '★ ¡Secreto desbloqueado: MUGETSU! ★'
  const have = BANKAIS.filter(x => counts[x.key]).length
  return `卍 ¡Nuevo bankai desbloqueado! ${b.name} (${have}/${BANKAIS.length}) ─ mirá tu colección con /bankai`
}

async function collectionText($: EngineInterface): Promise<string> {
  const counts = ((await $.store.get('counts')) ?? {}) as Record<string, number>
  const have = BANKAIS.filter(x => counts[x.key]).length
  const total = Object.values(counts).reduce((s, n) => s + n, 0)
  const nameW = Math.max(...BANKAIS.map(b => b.who.length))
  const lines = BANKAIS.map(b => {
    const n = counts[b.key]
    return n
      ? `  [x] ${b.who.padEnd(nameW)}  ${b.name}  x${n}`
      : `  [ ] ${'???'.padEnd(nameW)}  ???`
  })
  const secret = counts[MUGETSU.key]
    ? `  [★] Secreto: ${MUGETSU.name}  x${counts[MUGETSU.key]}`
    : '  [?] Secreto: ??? (dicen que aparece cuando una batalla dura demasiado...)'
  return [
    `卍 Colección de Bankai ─ ${have}/${BANKAIS.length} liberados · ${total} liberaciones en total`,
    '',
    ...lines,
    '',
    secret,
  ].join('\n')
}

export const register: Register = (on, options) => {
  const isSoundOn = options.sound === true
  let tools = 0
  let maskTimer: Timer | undefined

  on('session.start', async ($, e, next) => {
    // Una recarga corta los temporizadores: nada queda a medio animar.
    await update($, frame, () => -1)
    await update($, mask, () => null)
    await $.command.register({ name: 'bankai', description: 'Colección de Bankais · /bankai <nombre> para verlo · /bankai todos' })
    const { context } = await $.session.usage()
    if (context.percent !== undefined) {
      await update($, percent, () => context.percent ?? null)
      await update($, stage, () => stageOf(context.percent ?? 0))
      $.ui.status(`☽ Reiatsu ${context.percent}%`)
    }
    return next(e)
  })

  // /bankai → colección · /bankai <nombre> → ver ese · /bankai todos → los 21 seguidos
  on('command.run', { command: 'bankai' }, async ($, e) => {
    const arg = norm(e.args ?? '')
    if (arg === '') return { text: await collectionText($) }
    if (arg === 'todos' || arg === 'all') {
      demoRun += 1
      void demoAll($, isSoundOn, demoRun, 0)
      return { text: `卍 Modo prueba: los ${BANKAIS.length + 1} bankais seguidos (~2 min). No cuentan para la colección.` }
    }
    const index = findBankai(arg)
    if (index === undefined) {
      return { text: `No encontré "${(e.args ?? '').trim()}". Probá con un nombre o apellido (ej: /bankai byakuya), "mugetsu" o "todos".` }
    }
    demoRun += 1
    await animate($, index, isSoundOn)
    return { text: `卍 Modo prueba: ${bankaiAt(index)!.name}. No cuenta para la colección.` }
  })

  on('session.measure', async ($, e, next) => {
    const pct = e.context.percent
    if (pct === undefined) return next(e)
    const before = await read($, percent)
    const was = await read($, stage)
    const now = stageOf(pct)
    await update($, percent, () => pct)
    await update($, stage, () => now)
    $.ui.status(`☽ Reiatsu ${pct}%`)

    const isCompacted = before !== null && before >= 70 && pct <= before - 30
    const anim: MaskAnim | null =
      isCompacted && was >= 2 ? { kind: 'shatter', frame: 0, stage: was }
      : !isCompacted && now > was && now >= 2 ? { kind: 'form', frame: 0, stage: now }
      : null

    if (isCompacted) {
      $.ui.toast('La máscara se rompió. Contexto compactado: Ichigo recupera el control.', { timeoutMs: 6000 })
    } else if (now > was && now >= 1) {
      $.ui.toast(`Tu reiatsu cambia... ${STAGES[now]!.title.slice(2)}`, { timeoutMs: 5000 })
    }

    if (anim) {
      const last = anim.kind === 'form' ? FORM : SHATTER
      let k = 0
      maskTimer?.cancel()
      await update($, mask, () => anim)
      maskTimer = $.clock.every(MASK_MS, () => {
        k += 1
        if (k >= last) maskTimer?.cancel()
        void update($, mask, () => (k >= last ? null : { ...anim, frame: k }))
      })
    }
    return next(e)
  })

  on('prompt.submit', ($, e, next) => {
    tools = 0
    return next(e)
  })

  on('tool.call', ($, e, next) => {
    if (e.agentId === undefined) tools += 1
    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    const isSuccess = e.reason === 'answer' && !e.isAborted && e.agentId === undefined && tools > 0
    if (isSuccess) {
      const index = e.durationMs >= MUGETSU_MS ? MUGETSU_INDEX : pickIndex(await read($, lastIndex))
      if (index !== MUGETSU_INDEX) await update($, lastIndex, () => index)
      demoRun += 1 // una liberación real corta cualquier demo en curso
      const unlocked = await recordRelease($, bankaiAt(index)!)
      await animate($, index, isSoundOn, () => {
        if (unlocked) $.ui.toast(unlocked, { timeoutMs: 7000 })
      })
    }
    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey) return next(e)

    const shown = await read($, release)
    const pct = await read($, percent)
    const at = await read($, stage)
    const anim = await read($, mask)
    const showHollow = (pct !== null && at >= 1) || anim !== null
    if (shown === null && !showHollow) return next(e)

    const { Box, Text } = $.ui.resolve(e)
    const cols = e.props.bodyColumns
    const rows = e.props.maxRows
    const f = await read($, frame)
    const pad = (n: number) => ' '.repeat(Math.max(0, n))

    const bankai = shown === null ? undefined : bankaiAt(shown.index)

    const bankaiTree = shown !== null && bankai && (() => {
      const th = bankai.theme
      const banner = bannerOf(shown.index, bankai)
      const width = banner[0]!.length
      const isRoomy = cols >= width + INDENT + M + 2 && rows >= (showHollow ? 14 : 9)
      const ph = phasesOf(bankai.line)
      const isDone = f < 0 || !isRoomy
      const accent = th.grad[1]!

      // El banner pintado en degradé; `shine` es la columna del brillo que lo cruza.
      const paint = (row: string, r: number, shine: number | null, key: string) => {
        const segs = []
        for (let c = 0; c < row.length; c += 3) {
          const isShine = shine !== null && Math.abs(c + 1 - (shine - r * 2)) <= 2
          const color = isShine ? '#ffffff' : mix(th.grad, (c / width) * 0.75 + (r / 5) * 0.25, 1 - r * 0.05)
          segs.push(<Text color={color} bold>{row.slice(c, c + 3)}</Text>)
        }
        return <Text key={key}>{pad(INDENT)}{segs}</Text>
      }

      // La frase: se tipea con ruido adelante, después tiembla con el reiatsu.
      let quote
      if (!isDone && f < ph.type) {
        const n = f * TYPE_CHARS
        const glitch = [0, 1, 2]
          .map(i => (n + i < bankai.line.length ? GLITCH[Math.floor(noise(f, i, 7) * GLITCH.length)] : ''))
          .join('')
        quote = (
          <Text>
            <Text italic color="gray">  "{bankai.line.slice(0, n)}</Text>
            <Text color={accent}>{glitch}</Text>
            <Text color="white">▌</Text>
          </Text>
        )
      } else if (!isDone && f < ph.shake) {
        const jitter = Math.floor(noise(f, 0, 1) * 3)
        quote = (
          <Text italic bold color={f % 2 === 0 ? 'white' : accent}>
            {pad(2 + jitter)}"{bankai.line}"
          </Text>
        )
      } else {
        quote = <Text italic color="gray">  "{bankai.line}"</Text>
      }

      // La firma: un lienzo con margen a los costados, pintado por tramos de color.
      const sigRows = (() => {
        if (isDone || f < ph.shake || f >= ph.sig) return []
        const k = f - ph.shake
        const g = newGrid(width)
        const sign = SIGNATURES[bankai.key] ?? SIGNATURES['Kurosaki Ichigo']!
        const shakes = sign({ k, q: (k + 1) / SIG, f, banner, width, th, g }) ?? []
        return g.ch.map((cells, r) => {
          const segs = []
          for (let c = 0; c < g.w; ) {
            const color = g.co[r]![c]!
            let e = c
            while (e < g.w && g.co[r]![e] === color) e++
            const text = cells.slice(c, e).join('')
            segs.push(color ? <Text color={color} bold>{text}</Text> : <Text>{text}</Text>)
            c = e
          }
          return <Text key={`b${r}`}>{pad(INDENT - M + (shakes[r] ?? 0))}{segs}</Text>
        })
      })()

      // El lienzo de 6 filas donde pasa todo.
      const canvas = banner.map((row, r) => {
        const key = `b${r}`
        if (isDone) return paint(row, r, null, key)

        if (f < ph.type) {
          if (th.isDark) return <Text key={key}> </Text>
          return <Text color={th.pcolors[0]} dimColor key={key}>{pad(INDENT)}{particles(th, f, r, width, 0.03)}</Text>
        }

        if (f < ph.shake) {
          const k = f - ph.type
          if (th.isDark) {
            // Mugetsu: la oscuridad se come todo.
            const dark = particles(th, f, r, width, (k + 1) / SHAKE)
            return <Text color="#151515" key={key}>{pad(INDENT)}{dark}</Text>
          }
          const density = 0.05 + (0.3 * k) / SHAKE
          const jitter = Math.floor(noise(f, r, 99) * 3)
          return (
            <Text color={th.pcolors[(f + r) % th.pcolors.length]} key={key}>
              {pad(INDENT - 1 + jitter)}{particles(th, f, r, width, density)}
            </Text>
          )
        }

        if (f < ph.sig) {
          return sigRows[r]!
        }

        if (f < ph.flash) {
          const k = f - ph.sig
          if (k < 2) {
            return (
              <Text color="#ffffff" bold inverse={k === 0} key={key}>
                {pad(INDENT)}{row}
              </Text>
            )
          }
          return paint(row, r, null, key)
        }

        // Un brillo que cruza el banner una sola vez, en diagonal.
        const k = f - ph.flash
        const shine = Math.round((k / (SHIMMER - 1)) * (width + 16)) - 4
        return paint(row, r, shine, key)
      })

      const shout = shown.index === MUGETSU_INDEX ? 'MUGETSU' : bankai.who === ICHIGO ? 'BAN-KAI!' : 'BANKAI!'
      const label = shown.index === MUGETSU_INDEX ? '★' : '卍'
      return (
        <Box flexDirection="column" key="bankai">
          {quote}
          {isRoomy && canvas}
          {isDone || f >= ph.sig ? (
            <Text>
              <Text color={accent} bold>  {label} {isRoomy ? (shown.index === MUGETSU_INDEX ? 'Saigo no' : 'Bankai') : shout} ─ {bankai.name}</Text>
              <Text dimColor>  · {bankai.who}</Text>
            </Text>
          ) : (
            <Text> </Text>
          )}
        </Box>
      )
    })()

    const hollowTree = showHollow && (() => {
      const isShatter = anim?.kind === 'shatter'
      const viewStage = anim ? anim.stage : at
      const s = STAGES[isShatter ? viewStage : at]!
      const width = Math.max(10, Math.min(24, cols - 40))
      const isRoomy = cols >= 50 && rows >= 9

      // Etapa 1: sin máscara. Etapa 2: media. Etapa 3+: completa con franjas.
      const isFull = viewStage >= 3
      const cell = (ch: string, r: number, c: number, row: string) => {
        const isLeft = c < row.length / 2
        if (!isFull && !isLeft) return <Text dimColor>{ch === ' ' ? ' ' : '·'}</Text>
        const isStripe = isFull && STRIPES.has(c) && ch !== ' '
        return <Text color={isStripe || (viewStage >= 4 && r === 0) ? 'red' : 'white'}>{ch}</Text>
      }

      let maskView: unknown[] = []
      if (anim?.kind === 'form') {
        // La máscara se arma pedazo a pedazo.
        const q = (anim.frame + 1) / FORM
        maskView = maskRowsOf(anim.stage).map((row, r) => (
          <Text key={`m${r}`}>
            {[...row].map((ch, c) =>
              ch === ' ' ? <Text> </Text>
              : noise(r, c, 11) < q ? cell(ch, r, c, row)
              : noise(r, c, anim.frame) < 0.3 ? <Text color="red">{'╱╲'[c % 2]}</Text>
              : <Text> </Text>,
            )}
          </Text>
        ))
      } else if (anim?.kind === 'shatter') {
        // Se raja, y los pedazos se caen.
        const src = maskRowsOf(anim.stage)
        const k = anim.frame
        const height = src.length + 3
        const grid: string[][] = Array.from({ length: height }, () => Array.from({ length: src[0]!.length }, () => ' '))
        src.forEach((row, r) =>
          [...row].forEach((ch, c) => {
            if (ch === ' ') return
            if (k < 5) {
              grid[r]![c] = noise(r, c, 21) < k * 0.12 ? '╱╲'[(r + c) % 2]! : ch
              return
            }
            const fall = Math.floor((k - 5) * (0.4 + noise(c, r, 2) * 0.9))
            const drift = Math.round((noise(r, c, 4) - 0.5) * (k - 5) * 0.4)
            const nr = r + fall
            const nc = c + drift
            if (nr < height && nc >= 0 && nc < src[0]!.length) grid[nr]![nc] = ch
          }),
        )
        maskView = grid.map((row, r) => (
          <Text key={`m${r}`} color={k < 5 ? 'white' : '#8a8a8a'} dimColor={k > 12}>{row.join('')}</Text>
        ))
      } else if (at >= 2) {
        maskView = maskRowsOf(at).map((row, r) => (
          <Text key={`m${r}`}>{[...row].map((ch, c) => cell(ch, r, c, row))}</Text>
        ))
      }

      const bar = (() => {
        const p = pct ?? 0
        const filled = Math.round((p / 100) * width)
        return '█'.repeat(filled) + '░'.repeat(width - filled)
      })()

      return (
        <Box flexDirection="row" key="hollow">
          {maskView.length > 0 && isRoomy && (
            <Box flexDirection="column" marginRight={1}>
              {maskView}
            </Box>
          )}
          <Box flexDirection="column">
            {isShatter ? (
              <Text color="white" bold> ░ La máscara se rompe...</Text>
            ) : (
              <Text color={s.color} bold inverse={at >= 4}> {s.title} </Text>
            )}
            <Text>
              <Text color={at >= 3 ? 'red' : 'white'}>{bar}</Text>
              <Text bold> {pct ?? 0}%</Text>
              <Text dimColor> del contexto</Text>
            </Text>
            {isShatter ? (
              <Text italic color="gray">"Ichigo recupera el control."</Text>
            ) : (
              <Text italic color={at >= 3 ? 'red' : 'gray'}>"{s.line}"</Text>
            )}
          </Box>
        </Box>
      )
    })()

    return (
      <Box flexDirection="column">
        {bankaiTree}
        {hollowTree}
      </Box>
    )
  })
}
