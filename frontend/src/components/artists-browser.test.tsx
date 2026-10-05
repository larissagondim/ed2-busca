import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ArtistsBrowser } from './artists-browser'

const obra = { id: 7, codigoAcervo: 'monet_a', titulo: 'Impressão, nascer do sol', artista: 'Claude Monet', estilo: 'Impressionism', caminhoImagem: 'a.jpg' }
const monet = { nome: 'Claude Monet', quantidadeObras: 2, visualizacoes: 3, posicao: 1 }
const degas = { nome: 'Edgar Degas', quantidadeObras: 1, visualizacoes: 0, posicao: 0 }
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status })

function servidor() {
  const fetch = vi.fn((url: string) => {
    if (url.startsWith('/api/artistas?')) return Promise.resolve(json({ conteudo: [degas, monet], pagina: 0, tamanho: 24, totalElementos: 2, totalPaginas: 1 }))
    if (url === '/api/artistas/Claude%20Monet/obras?page=0&size=24') return Promise.resolve(json({ artista: monet, conteudo: [obra], pagina: 0, tamanho: 24, totalElementos: 2, totalPaginas: 1, comparacoes: 3, profundidade: 2 }))
    return Promise.resolve(json({ codigo: 'ARTISTA_NAO_ENCONTRADO', mensagem: 'Artista inexistente: Ninguém' }, 404))
  })
  vi.stubGlobal('fetch', fetch)
  return fetch
}
const acoes = () => ({ flipped: null, onFlip: vi.fn(), onZoom: vi.fn(), onSearch: vi.fn() })
afterEach(() => { cleanup(); vi.unstubAllGlobals() })

describe('ArtistsBrowser', () => {
  it('lista os artistas na ordem recebida, com posição, obras e visualizações', async () => {
    servidor(); render(<ArtistsBrowser {...acoes()} />)
    const lista = await screen.findByRole('list', { name: 'Artistas em ordem alfabética' })
    const itens = within(lista).getAllByRole('listitem')
    expect(itens[0]).toHaveTextContent('Edgar Degas'); expect(itens[0]).toHaveTextContent('1 obra · 0 visualizações')
    expect(itens[1]).toHaveTextContent('Claude Monet'); expect(itens[1]).toHaveTextContent('2 obras · 3 visualizações')
    expect(screen.getByText('2 artistas em ordem alfabética, paginados pela Árvore AVL.')).toBeInTheDocument()
  })
  it('abre um artista, mostra as comparações e a profundidade na AVL e volta à lista', async () => {
    servidor(); render(<ArtistsBrowser {...acoes()} />)
    await userEvent.click(await screen.findByRole('button', { name: 'Abrir obras de Claude Monet' }))
    expect(await screen.findByRole('heading', { level: 2, name: 'Claude Monet' })).toBeInTheDocument()
    expect(screen.getByText('Encontrado em 3 comparações, profundidade 2 na AVL.')).toBeInTheDocument()
    expect(screen.getByText(/posição alfabética 2/)).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: 'Impressão, nascer do sol' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Voltar à lista de artistas' }))
    expect(await screen.findByRole('list', { name: 'Artistas em ordem alfabética' })).toBeInTheDocument()
  })
  it('busca por nome e anuncia artista inexistente', async () => {
    const fetch = servidor(); render(<ArtistsBrowser {...acoes()} />)
    await screen.findByRole('list', { name: 'Artistas em ordem alfabética' })
    expect(screen.getByRole('button', { name: 'Buscar artista' })).toBeDisabled()
    await userEvent.type(screen.getByLabelText('Nome do artista'), 'Claude Monet{Enter}')
    expect(await screen.findByRole('heading', { level: 2, name: 'Claude Monet' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Voltar à lista de artistas' }))
    await userEvent.clear(screen.getByLabelText('Nome do artista')); await userEvent.type(screen.getByLabelText('Nome do artista'), 'Ninguém{Enter}')
    expect(await screen.findByRole('alert')).toHaveTextContent('Artista inexistente: Ninguém')
    await waitFor(() => expect(fetch).toHaveBeenCalledWith('/api/artistas/Ningu%C3%A9m/obras?page=0&size=24', expect.anything()))
  })
  it('anuncia falha ao carregar a lista', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(json({ mensagem: 'Servidor fora do ar' }, 500))))
    render(<ArtistsBrowser {...acoes()} />)
    expect(await screen.findByRole('alert')).toHaveTextContent('Servidor fora do ar')
  })
})
