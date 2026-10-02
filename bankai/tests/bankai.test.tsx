import { expect, mock, test } from 'claude-code/testing'
import type { On, RenderPropsOf } from 'claude-code'
import { M, newGrid, SIG } from '../hooks/fx'
import type { Theme } from '../hooks/fx'
import { SIGNATURES } from '../hooks/signatures'

const BAND = (maxRows: number) => ({
  plugin: 'bankai',
  component: 'AbovePrompt' as const,
  props: {
    hasSurvey: false,
    isWorking: false,
    maxRows,
    bodyColumns: 100,
    scroll: { top: 0, bodyRows: maxRows, contentRows: 0 },
  } as unknown as RenderPropsOf['AbovePrompt'],
})

const TURN = {
  answer: 'listo',
  durationMs: 1000,
  isAborted: false,
  turnId: 't1',
  reason: 'answer' as const,
}

const world = (on: On) => {
  const clock = mock.clock(on)
  mock.store(on)
  on('tool.call', () => ({ result: 'ok' }) as never)
  on('turn.complete', () => ({ text: 'listo' }))
  on('session.measure', ($, e) => ({ changed: e.changed }) as never)
  on('ui.render', ($, e) => {
    const { Text } = $.ui.resolve(e)
    return <Text>engine</Text>
  })
  return clock
}

const MEASURE = (percent: number) =>
  ({ context: { tokens: percent * 2000, window: 200000, percent }, rateLimits: [], changed: ['context'] }) as never

test('una tarea exitosa anima el bankai y termina con el banner quieto', async ($, on) => {
  const clock = world(on)

  await $.tool.call({ tool: 'Bash', command: 'echo hi' } as never)
  await $.turn.complete(TURN)

  // Al arrancar: la frase se está tipeando (cursor) y todavía no hay nombre.
  const start = await $.ui.mount({ surface: 'terminal', ...BAND(30) })
  expect(await start.find({ type: 'Text', text: /▌/ })).toBeDefined()
  expect(await start.find({ type: 'Text', text: /卍|★/ })).toBeUndefined()
  await start.unmount()


  await clock.advance(10_000)
  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount({ surface, ...BAND(30) })
    expect(await ui.find({ type: 'Text', text: /卍 Bankai/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /"/ })).toBeDefined()
    await ui.unmount()
  }
})

test('una tarea de más de 5 minutos libera el Mugetsu secreto', async ($, on) => {
  const clock = world(on)

  await $.tool.call({ tool: 'Bash', command: 'sleep' } as never)
  await $.turn.complete({ ...TURN, durationMs: 6 * 60_000 })
  await clock.advance(10_000)

  const ui = await $.ui.mount({ surface: 'terminal', ...BAND(30) })
  expect(await ui.find({ type: 'Text', text: /Mugetsu/ })).toBeDefined()
  await ui.unmount()

  const out = await $.command.run({ command: 'bankai' } as never)
  expect(out.text).toContain('Secreto: Mugetsu')
})

test('/bankai muestra la colección', async ($, on) => {
  const clock = world(on)

  await $.tool.call({ tool: 'Bash', command: 'echo hi' } as never)
  await $.turn.complete(TURN)
  await clock.advance(10_000)

  const out = await $.command.run({ command: 'bankai' } as never)
  expect(out.text).toContain('1/20 liberados')
  expect(out.text).toContain('[x]')
  expect(out.text).toContain('[ ] ???')
})

test('una respuesta sin herramientas no libera bankai', async ($, on) => {
  world(on)

  await $.turn.complete(TURN)

  const ui = await $.ui.mount({ surface: 'terminal', ...BAND(30) })
  expect(await ui.find({ type: 'Text', text: /Bankai/ })).toBeUndefined()
  await ui.unmount()
})

test('el contexto alto dibuja la hollowificación y la máscara se arma', async ($, on) => {
  const clock = world(on)

  await $.session.measure(MEASURE(90))
  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount({ surface, ...BAND(30) })
    expect(await ui.find({ type: 'Text', text: /Hollowificación completa/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /90%/ })).toBeDefined()
    await ui.unmount()
  }

  await clock.advance(5_000)
  const ui = await $.ui.mount({ surface: 'terminal', ...BAND(30) })
  expect(await ui.find({ type: 'Text', text: /▄▄████████▄▄/ })).toBeDefined()
  await ui.unmount()
})

test('al compactar, la máscara se rompe y desaparece', async ($, on) => {
  const clock = world(on)

  await $.session.measure(MEASURE(90))
  await clock.advance(5_000)
  await $.session.measure(MEASURE(20))

  const breaking = await $.ui.mount({ surface: 'terminal', ...BAND(30) })
  expect(await breaking.find({ type: 'Text', text: /La máscara se rompe/ })).toBeDefined()
  await breaking.unmount()

  await clock.advance(5_000)
  const after = await $.ui.mount({ surface: 'terminal', ...BAND(30) })
  expect(await after.find({ type: 'Text', text: /máscara/ })).toBeUndefined()
  await after.unmount()
})

test('todos los temas dibujan cada cuadro sin errores', { timeoutMs: 120_000 }, async ($, on) => {
  const clock = world(on)
  const seen = new Set<string>()

  for (let turn = 0; turn < 60; turn++) {
    await $.tool.call({ tool: 'Bash', command: 'echo hi' } as never)
    await $.turn.complete({ ...TURN, durationMs: turn === 0 ? 6 * 60_000 : 1000 })
    for (let i = 0; i < 90; i++) {
      const ui = await $.ui.mount({ surface: i % 2 ? 'terminal' : 'desktop', ...BAND(30) })
      if (i === 89) {
        const name = await ui.find({ type: 'Text', text: /· / })
        if (name) seen.add(name.text)
      }
      await ui.unmount()
      await clock.advance(60)
    }
  }
  expect(seen.size).toBeGreaterThan(12)
})
test('las 21 firmas terminan con el banner completo', () => {
  const BANNER = ['██████╗  █████╗ ███╗   ██╗', '██╔══██╗██╔══██╗████╗  ██║', '██████╔╝███████║██╔██╗ ██║', '██╔══██╗██╔══██║██║╚██╗██║', '██████╔╝██║  ██║██║ ╚████║', '╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═══╝']
  const th: Theme = { grad: ['#ffffff', '#888888'], parts: '*', pcolors: ['#ffffff'], motion: 'burst' }
  const names = Object.keys(SIGNATURES)
  expect(names.length).toBe(21)
  for (const name of names) {
    let finalGrid = newGrid(BANNER[0]!.length)
    for (let k = 0; k < SIG; k++) {
      const g = newGrid(BANNER[0]!.length)
      SIGNATURES[name]!({ k, q: (k + 1) / SIG, f: 100 + k, banner: BANNER, width: BANNER[0]!.length, th, g })
      finalGrid = g
    }
    BANNER.forEach((row, r) => {
      const got = finalGrid.ch[r]!.slice(M, M + row.length).join('')
      if (got !== row) throw new Error(`${name}: la fila ${r} no quedó completa: "${got}"`)
    })
  }
})
test('/bankai <nombre> muestra ese bankai sin sumarlo a la colección', async ($, on) => {
  const clock = world(on)

  const out = await $.command.run({ command: 'bankai', args: 'byakuya' } as never)
  expect(out.text).toContain('Senbonzakura')
  await clock.advance(10_000)

  const ui = await $.ui.mount({ surface: 'terminal', ...BAND(30) })
  expect(await ui.find({ type: 'Text', text: /Senbonzakura Kageyoshi/ })).toBeDefined()
  await ui.unmount()

  const col = await $.command.run({ command: 'bankai' } as never)
  expect(col.text).toContain('0/20 liberados')

  const bad = await $.command.run({ command: 'bankai', args: 'aizen' } as never)
  expect(bad.text).toContain('No encontré')

  const tildes = await $.command.run({ command: 'bankai', args: 'Tōsen' } as never)
  expect(tildes.text).toContain('Enma')
})

test('/bankai todos los pasa uno tras otro', async ($, on) => {
  const clock = world(on)
  await $.command.run({ command: 'bankai', args: 'todos' } as never)

  const names = new Set<string>()
  for (let i = 0; i < 200; i++) {
    await clock.advance(1000)
    const ui = await $.ui.mount({ surface: 'terminal', ...BAND(30) })
    const row = await ui.find({ type: 'Text', text: /(Bankai|Saigo no) ─ / })
    if (row) names.add(row.text)
    await ui.unmount()
  }
  expect(names.size).toBe(21)
})