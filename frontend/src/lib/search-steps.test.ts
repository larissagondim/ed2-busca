import { describe, expect, it } from 'vitest'
import { HEIGHTS, KEYS, MISSING_KEY, arvoreAfunilada, arvoreBalanceada, binaria, dedilhada, profundidades, fibonacci, interpolacao, listaComSaltos, moverParaInicio, sequencial, simulate, transposicao } from './search-steps'

const last = (run: { steps: { comparisons: number; result?: string }[] }) => run.steps[run.steps.length - 1]

describe('simulações das buscas', () => {
  // Valores conferidos contra BuscasOrdenadas.java com as mesmas chaves.
  it('conta comparações como o backend nas buscas em tabela', () => {
    expect([3, 11, 24, 31, 57, 92].map(key => last(binaria(KEYS, key)).comparisons)).toEqual([3, 2, 4, 1, 2, 4])
    expect([3, 24, 76, 92, 100].map(key => last(interpolacao(KEYS, key)).comparisons)).toEqual([1, 3, 2, 1, 1])
    expect([3, 8, 24, 46, 63, 92].map(key => last(fibonacci(KEYS, key)).comparisons)).toEqual([3, 2, 1, 2, 3, 5])
    expect(last(fibonacci(KEYS, MISSING_KEY))).toMatchObject({ comparisons: 4, result: 'missing' })
  })
  it('encontra todas as chaves e recusa ausentes em qualquer estratégia', () => {
    for (const tipo of ['SEQUENCIAL', 'TRANSPOSICAO', 'MOVER_PARA_INICIO', 'DEDILHADA', 'BINARIA', 'INTERPOLACAO', 'FIBONACCI', 'LISTA_COM_SALTOS', 'ARVORE_AFUNILADA']) {
      for (const key of KEYS) expect(simulate(tipo, key, { order: KEYS, finger: null }).steps.some(step => step.result === 'found'), `${tipo} ${key}`).toBe(true)
      expect(last(simulate(tipo, MISSING_KEY, { order: KEYS, finger: null })).result, tipo).toBe('missing')
    }
  })
  it('percorre a lista e marca os nós visitados', () => {
    const run = sequencial(KEYS, 19)
    expect(run.steps).toHaveLength(4); expect(last(run)).toMatchObject({ comparisons: 4, result: 'found', visited: [0, 1, 2] })
  })
  it('reorganiza a lista na transposição e no mover para o início', () => {
    expect(transposicao(KEYS, 19).order!.slice(0, 4)).toEqual([3, 8, 19, 11])
    expect(transposicao(KEYS, 3).order).toBe(KEYS)
    expect(moverParaInicio(KEYS, 19).order!.slice(0, 4)).toEqual([19, 3, 8, 11])
    expect(last(moverParaInicio(moverParaInicio(KEYS, 92).order!, 92)).comparisons).toBe(1)
  })
  it('a busca dedilhada recomeça do último acerto e dá a volta', () => {
    const primeira = dedilhada(KEYS, 57, null)
    expect(primeira.finger).toBe(8); expect(last(primeira).comparisons).toBe(9)
    expect(last(dedilhada(KEYS, 63, 8)).comparisons).toBe(2)
    expect(last(dedilhada(KEYS, 3, 8)).comparisons).toBe(5)
    expect(dedilhada(KEYS, MISSING_KEY, 8).finger).toBe(8)
  })
  it('desce pelos níveis da lista com saltos', () => {
    const run = listaComSaltos(KEYS, HEIGHTS, 57)
    expect(run.steps[0]).toMatchObject({ level: 3, probe: 7 })
    expect(last(run)).toMatchObject({ level: 0, probe: 8, result: 'found' })
    expect(run.steps.every((step, index) => index === 0 || step.level! <= run.steps[index - 1].level!)).toBe(true)
  })
  // Mesma carga balanceada e mesmo afunilamento de ArvoreAfunilada.java.
  it('afunila a chave encontrada até a raiz preservando a ordem', () => {
    const inicial = arvoreBalanceada()
    expect(KEYS[inicial.root]).toBe(31); expect(Math.max(...profundidades(inicial))).toBe(3)
    const run = arvoreAfunilada(inicial, KEYS, 3)
    expect(run.steps.filter(step => step.rotations === 0).map(step => step.comparisons)).toEqual([1, 2, 3])
    expect(KEYS[run.tree!.root]).toBe(3); expect(last(run)).toMatchObject({ result: 'found', rotations: 2 })
    expect(run.steps.some(step => step.note.startsWith('Zig-zig'))).toBe(true)
    const emOrdem: number[] = []
    const visitar = (node: number) => { if (node < 0) return; visitar(run.tree!.left[node]); emOrdem.push(KEYS[node]); visitar(run.tree!.right[node]) }
    visitar(run.tree!.root); expect(emOrdem).toEqual(KEYS)
    const denovo = arvoreAfunilada(run.tree!, KEYS, 3)
    expect(denovo.steps).toHaveLength(1); expect(last(denovo)).toMatchObject({ comparisons: 1, result: 'found' })
  })
  it('na ausência afunila o último nó visitado e mostra zig-zag e zig', () => {
    const run = arvoreAfunilada(arvoreBalanceada(), KEYS, MISSING_KEY)
    expect(run.steps.find(step => step.result === 'missing' && step.rotations === 0)!.note).toMatch(/último nó visitado \(46\)/)
    expect(KEYS[run.tree!.root]).toBe(46)
    expect(run.steps.some(step => step.note.startsWith('Zig-zag') || step.note.startsWith('Zig:'))).toBe(true)
    expect(KEYS[arvoreAfunilada(arvoreBalanceada(), KEYS, 8).tree!.root]).toBe(8)
  })
})
