import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { OtherQueries } from './other-queries'

const obra = { id: 3, codigoAcervo: 'm', titulo: 'Nenúfares', artista: 'Claude Monet', estilo: 'Impressionism', caminhoImagem: 'a.jpg' }
const consulta = (comparativo: unknown) => ({ tipo: 'CHAVE_SECUNDARIA', nome: 'Busca com chave secundária', obras: [obra], total: 1, comparacoes: 81444, tempoMicros: 900, comparativo })
afterEach(() => { cleanup(); vi.unstubAllGlobals() })

async function consultarArtista(resposta: unknown) {
  const fetch = vi.fn(() => Promise.resolve(new Response(JSON.stringify(resposta))))
  vi.stubGlobal('fetch', fetch)
  render(<OtherQueries onOpen={() => undefined} />)
  await userEvent.click(screen.getByRole('radio', { name: 'Por artista' }))
  await userEvent.type(screen.getByLabelText('Artista'), 'monet'); await userEvent.click(screen.getByRole('button', { name: 'Consultar' }))
  return fetch
}

describe('OtherQueries por artista', () => {
  it('mostra lado a lado as comparações da busca sequencial e da AVL', async () => {
    await consultarArtista(consulta({ comparacoesSequencial: 81444, comparacoesAvl: 9, tempoSequencialMicros: 900, tempoAvlMicros: 3, mesmoResultado: true }))
    const lado = await screen.findByRole('group', { name: 'Busca sequencial contra Árvore AVL' })
    expect(within(lado).getByText('81.444')).toBeInTheDocument(); expect(within(lado).getByText('comparações na busca sequencial')).toBeInTheDocument()
    expect(within(lado).getByText('9')).toBeInTheDocument(); expect(within(lado).getByText('comparações na busca pela AVL')).toBeInTheDocument()
    expect(within(lado).getByText('As duas devolvem exatamente as mesmas obras.')).toBeInTheDocument()
  })
  it('avisa se os resultados divergirem e não mostra o painel sem comparativo', async () => {
    await consultarArtista(consulta({ comparacoesSequencial: 5, comparacoesAvl: 2, tempoSequencialMicros: 1, tempoAvlMicros: 1, mesmoResultado: false }))
    expect(await screen.findByText(/as duas abordagens devolveram obras diferentes/)).toBeInTheDocument()
    cleanup()
    await consultarArtista(consulta(null))
    await screen.findByRole('heading', { level: 3, name: 'Busca com chave secundária' })
    expect(screen.queryByRole('group', { name: 'Busca sequencial contra Árvore AVL' })).not.toBeInTheDocument()
  })
})
