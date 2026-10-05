import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { StructuresInside } from './structures-inside'

const estruturas = {
  skipLists: [{ nome: 'Por ID (global)', tamanho: 81444, niveis: 17 }], recentes: 3, capacidadeRecentes: 50, maisVistas: 2,
  arvores: { artistas: 1119, alturaAvl: 12, alturaAbb: 145, alturaMinimaTeorica: 11, rotacoes: { simplesEsquerda: 285, simplesDireita: 91, duplaEsquerdaDireita: 154, duplaDireitaEsquerda: 96 }, comparacoesMediasAvl: 9.35, comparacoesMediasAbb: 72.69, obras: 81444 },
}
afterEach(() => { cleanup(); vi.unstubAllGlobals() })

describe('StructuresInside', () => {
  it('mostra AVL x ABB, comparações e rotações por tipo com números grandes', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(new Response(JSON.stringify(estruturas)))))
    render(<StructuresInside />)
    const alturas = await screen.findByRole('group', { name: 'Altura da AVL contra a ABB' })
    expect(within(alturas).getByText('12')).toHaveClass('big-number'); expect(within(alturas).getByText('níveis na AVL')).toBeInTheDocument()
    expect(within(alturas).getByText('145')).toHaveClass('big-number'); expect(within(alturas).getByText(/Altura mínima possível: 11/)).toBeInTheDocument()
    expect(within(alturas).getByText(/a 1 nível do mínimo/)).toBeInTheDocument()
    const comparacoes = screen.getByRole('group', { name: 'Comparações médias de busca por artista' })
    expect(within(comparacoes).getByText('9,4')).toBeInTheDocument(); expect(within(comparacoes).getByText('72,7')).toBeInTheDocument(); expect(within(comparacoes).getByText('81.444')).toBeInTheDocument()
    const rotacoes = screen.getByRole('group', { name: 'Rotações da AVL por tipo' })
    expect(within(rotacoes).getByText('626 rotações no total. Uma rotação dupla conta uma vez.')).toBeInTheDocument()
    for (const [rotulo, valor] of [['simples à esquerda', '285'], ['simples à direita', '91'], ['dupla esquerda-direita', '154'], ['dupla direita-esquerda', '96']]) expect(within(within(rotacoes).getByText(rotulo).parentElement!).getByText(valor)).toBeInTheDocument()
    const demais = screen.getByRole('group', { name: 'Demais estruturas' })
    expect(within(demais).getByRole('row', { name: /Lista com saltos: Por ID \(global\) 81\.444 17/ })).toBeInTheDocument()
    expect(within(demais).getByRole('row', { name: /Vistas recentemente \(capacidade 50\) 3/ })).toBeInTheDocument()
  })
  it('anuncia falha da API', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(new Response(JSON.stringify({ mensagem: 'Sem métricas' }), { status: 500 }))))
    render(<StructuresInside />)
    expect(await screen.findByRole('alert')).toHaveTextContent('Sem métricas')
  })
})
