import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { Highlights } from './highlights'

const obra = { id: 1, codigoAcervo: 'a', titulo: 'Obra', artista: 'X', estilo: 'Y', caminhoImagem: 'a.jpg' }
const artista = (nome: string, visualizacoes: number, posicao: number) => ({ nome, quantidadeObras: 2, visualizacoes, posicao })
afterEach(cleanup)

describe('Highlights', () => {
  it('ordena os artistas mais vistos no frontend, a partir do percurso em ordem alfabética', () => {
    const artistasVistos = [artista('Ana', 2, 0), artista('Bruno', 9, 1), artista('Carla', 2, 2)]
    render(<Highlights destaques={{ recentes: [obra], maisVistas: [], artistasVistos }} onOpen={() => undefined} />)
    const itens = within(screen.getByRole('list', { name: 'Artistas mais vistos' })).getAllByRole('listitem')
    expect(itens.map(item => item.textContent)).toEqual(['1Bruno2 obras9 visualizações', '2Ana2 obras2 visualizações', '3Carla2 obras2 visualizações'])
  })
  it('mostra o estado vazio quando nenhum artista foi visto ou o backend não envia o campo', () => {
    render(<Highlights destaques={{ recentes: [], maisVistas: [] }} onOpen={() => undefined} />)
    expect(screen.getByText('Os artistas aparecem aqui quando uma de suas obras é aberta.')).toBeInTheDocument()
  })
})
