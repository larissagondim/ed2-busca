import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App } from './App'

const obra = { id: 0, codigoAcervo: '232331', titulo: 'Obra 232331', artista: 'Artista desconhecido', estilo: 'Academic Art', caminhoImagem: 'data/wikiart/232331.jpg' }
const resumo = { periodo: null, quantidadeObras: 1, estrategias: [] }
const pagina = { conteudo: [obra], pagina: 0, tamanho: 24, totalElementos: 1, totalPaginas: 1 }
const ok = (body: unknown) => new Response(JSON.stringify(body), { status: 200 })
afterEach(() => { cleanup(); vi.unstubAllGlobals() })

describe('App', () => {
  it('carrega o catálogo, abre detalhes e compara por ID', async () => {
    const fetch = vi.fn().mockResolvedValueOnce(ok([{ slug: 'academic-art', nome: 'Academic Art', quantidade: 1 }])).mockResolvedValueOnce(ok(pagina)).mockResolvedValueOnce(ok({ obra, medicoes: [], resumo }))
    vi.stubGlobal('fetch', fetch); render(<App />)
    expect(await screen.findByRole('heading', { name: 'Obra 232331' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Ver detalhes' })); expect(screen.getByRole('dialog')).toHaveTextContent('Código original232331')
    await userEvent.click(screen.getByRole('button', { name: 'Fechar detalhes' })); await userEvent.type(screen.getByLabelText('Busca'), '0'); await userEvent.click(screen.getByRole('button', { name: 'Comparar buscas' }))
    expect(await screen.findByRole('dialog')).toBeInTheDocument(); expect(fetch).toHaveBeenLastCalledWith('/api/buscas/comparar', expect.objectContaining({ method: 'POST' }))
  })
  it('troca período, carrega resumo e reinicia a sessão', async () => {
    const fetch = vi.fn().mockResolvedValueOnce(ok([{ slug: 'academic-art', nome: 'Academic Art', quantidade: 1 }])).mockResolvedValueOnce(ok(pagina)).mockResolvedValueOnce(ok(resumo)).mockResolvedValueOnce(ok(pagina)).mockResolvedValueOnce(ok(resumo)).mockResolvedValueOnce(new Response(null, { status: 204 })).mockResolvedValueOnce(ok(resumo))
    vi.stubGlobal('fetch', fetch); render(<App />); await screen.findByRole('heading', { name: 'Obra 232331' }); await userEvent.selectOptions(screen.getByLabelText('Período'), 'academic-art'); await userEvent.click(screen.getByRole('button', { name: /Resumo/ })); await userEvent.click(screen.getByRole('button', { name: /Reiniciar sessão/ }))
    await waitFor(() => expect(screen.getByText('1 obras no subconjunto.')).toBeInTheDocument())
  })
  it('anuncia erro da API', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(ok([])).mockResolvedValueOnce(new Response(JSON.stringify({ mensagem: 'Catálogo indisponível' }), { status: 500 }))); render(<App />)
    expect(await screen.findByRole('alert')).toHaveTextContent('Catálogo indisponível'); await waitFor(() => expect(screen.queryByText('Carregando obras…')).not.toBeInTheDocument())
  })
  it('fecha o painel com Escape', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(ok([])).mockResolvedValueOnce(ok(pagina))); render(<App />); await screen.findByRole('heading', { name: 'Obra 232331' }); await userEvent.click(screen.getByRole('button', { name: 'Ver detalhes' })); fireEvent.keyDown(document, { key: 'Escape' }); expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
