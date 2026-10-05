import { describe, expect, it } from 'vitest'
import { HEIGHTS, KEYS, MISSING_KEY, binaria, arvoreAvl, dedilhada, interpolacao, listaComSaltos, moverParaInicio, sequencial, simulate, transposicao } from './search-steps'

const last = (run: { steps: { comparisons: number; result?: string }[] }) => run.steps[run.steps.length - 1]

describe('simulações das buscas', () => {
  // Valores conferidos contra BuscasOrdenadas.java com as mesmas chaves.
  it('conta comparações como o backend nas buscas em tabela', () => {
    expect([3, 11, 24, 31, 57, 92].map(key => last(binaria(KEYS, key)).comparisons)).toEqual([3, 2, 4, 1, 2, 4])
    expect([3, 24, 76, 92, 100].map(key => last(interpolacao(KEYS, key)).comparisons)).toEqual([1, 3, 2, 1, 1])
    expect([3, 11, 24, 31, 57, 92].map(key => last(arvoreAvl(KEYS, key)).comparisons)).toEqual([3, 2, 4, 1, 2, 4])
    expect(last(arvoreAvl(KEYS, MISSING_KEY))).toMatchObject({ comparisons: 4, result: 'missing' })
    expect(arvoreAvl(KEYS, 24).steps[0].note).toBe('Raiz: 31 > 24, desce para o filho esquerdo.')
  })
  it('encontra todas as chaves e recusa ausentes em qualquer estratégia', () => {
    for (const tipo of ['SEQUENCIAL', 'TRANSPOSICAO', 'MOVER_PARA_INICIO', 'DEDILHADA', 'BINARIA', 'INTERPOLACAO', 'ARVORE_AVL', 'LISTA_COM_SALTOS']) {
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
})
