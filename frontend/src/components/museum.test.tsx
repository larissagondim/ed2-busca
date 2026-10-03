import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Museum } from './museum'
import { agruparPorAla, montarSalas } from '@/lib/museum'

const periodos = [
  { slug: 'pop-art', nome: 'Pop Art', quantidade: 3 },
  { slug: 'academic-art', nome: 'Academic Art', quantidade: 1 },
  { slug: 'baroque', nome: 'Baroque', quantidade: 7 },
  { slug: 'early-renaissance', nome: 'Early Renaissance', quantidade: 6 },
]
const obra = (id: number, estilo: string) => ({ id, codigoAcervo: `c${id}`, titulo: `Obra ${id}`, artista: `Artista ${id}`, estilo, caminhoImagem: '' })
const pagina = (obras: ReturnType<typeof obra>[]) => new Response(JSON.stringify({ conteudo: obras, pagina: 0, tamanho: 24, totalElementos: obras.length, totalPaginas: 1 }), { status: 200 })
afterEach(() => { cleanup(); vi.unstubAllGlobals() })

describe('roteiro do museu', () => {
  it('ordena as salas pela história e manda estilos desconhecidos para o fim', () => {
    const salas = montarSalas(periodos)
    expect(salas.map(sala => sala.titulo)).toEqual(['Primeiro Renascimento', 'Barroco', 'Pop Art', 'Academic Art'])
    expect(salas[3]).toMatchObject({ epoca: '', ala: { nome: 'Outras salas' } })
    expect(agruparPorAla(salas).map(grupo => [grupo.ala.nome, grupo.salas.length])).toEqual([['Ala do Renascimento', 1], ['Ala do Barroco e do Rococó', 1], ['Ala do pós-guerra', 1], ['Outras salas', 1]])
  })
})

describe('Museum', () => {
  it('só busca obras ao entrar e pendura a principal no centro', async () => {
    const fetch = vi.fn().mockResolvedValueOnce(pagina([1, 2, 3, 4, 5, 6].map(id => obra(id, 'Early Renaissance'))))
    vi.stubGlobal('fetch', fetch)
    const onOpen = vi.fn()
    render(<Museum periodos={periodos} onOpen={onOpen} />)
    expect(screen.getByText('4 salas e 17 obras')).toBeInTheDocument(); expect(fetch).not.toHaveBeenCalled()
    await userEvent.click(screen.getByRole('button', { name: 'Entrar no museu' }))
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('periodo=early-renaissance'), expect.anything())
    const obras = within(await screen.findByRole('list', { name: 'Obras da sala Primeiro Renascimento' })).getAllByRole('button')
    expect(obras.map(item => item.getAttribute('aria-label'))).toEqual(['Ver Obra 4, de Artista 4', 'Ver Obra 2, de Artista 2', 'Ver Obra 1, de Artista 1', 'Ver Obra 3, de Artista 3', 'Ver Obra 5, de Artista 5'])
    expect(screen.getByText(/Parede 1 de 2/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Outra parede' }))
    expect(within(screen.getByRole('list', { name: 'Obras da sala Primeiro Renascimento' })).getAllByRole('button')).toHaveLength(1)
    await userEvent.click(screen.getByRole('button', { name: 'Ver Obra 6, de Artista 6' })); expect(onOpen).toHaveBeenCalledWith(expect.objectContaining({ id: 6 }), expect.any(HTMLButtonElement))
  })
  it('anda entre salas, pela planta e pelo teclado, sem repetir buscas', async () => {
    const fetch = vi.fn((url: string) => Promise.resolve(pagina([obra(url.includes('baroque') ? 20 : url.includes('academic') ? 30 : 10, 'x')])))
    vi.stubGlobal('fetch', fetch)
    render(<Museum periodos={periodos} onOpen={() => undefined} />)
    await userEvent.click(screen.getByRole('button', { name: 'Entrar no museu' }))
    await userEvent.click(screen.getByRole('button', { name: 'Próxima sala: Barroco' }))
    expect(await screen.findByRole('button', { name: 'Ver Obra 20, de Artista 20' })).toBeInTheDocument(); expect(screen.getByText('Barroco', { selector: 'strong' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Planta do museu' }))
    await userEvent.click(within(screen.getByRole('navigation', { name: 'Planta do museu' })).getByRole('button', { name: /Academic Art/ }))
    expect(await screen.findByRole('button', { name: 'Ver Obra 30, de Artista 30' })).toBeInTheDocument(); expect(screen.queryByRole('navigation', { name: 'Planta do museu' })).not.toBeInTheDocument()
    fireEvent.keyDown(screen.getByRole('button', { name: 'Ver Obra 30, de Artista 30' }), { key: 'ArrowRight' })
    expect(await screen.findByRole('button', { name: 'Ver Obra 10, de Artista 10' })).toBeInTheDocument()
    fireEvent.keyDown(screen.getByRole('button', { name: 'Ver Obra 10, de Artista 10' }), { key: 'ArrowLeft' })
    expect(await screen.findByRole('button', { name: 'Ver Obra 30, de Artista 30' })).toBeInTheDocument()
    expect(fetch).toHaveBeenCalledTimes(3)
  })
  it('mostra o erro da sala sem quebrar a navegação', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({ mensagem: 'Sala fechada' }), { status: 500 })))
    render(<Museum periodos={periodos} onOpen={() => undefined} />)
    await userEvent.click(screen.getByRole('button', { name: 'Entrar no museu' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Sala fechada'); expect(screen.getByRole('button', { name: 'Próxima sala: Barroco' })).toBeEnabled()
  })
  it('busca uma obra na parede da sala e mede no acervo completo', async () => {
    const obras = [10, 11, 12, 13, 14, 15, 16, 17].map(id => obra(id, 'Early Renaissance'))
    const medicao = { tipo: 'BINARIA', nome: 'Busca binária', encontrou: true, comparacoes: 17, reorganizacoes: 0, tempoMicros: 3.2, cpuMicros: null }
    const comparacao = { obra: obras[5], medicoes: [medicao], resumo: { periodo: null, quantidadeObras: 81444, estrategias: [] } }
    const fetch = vi.fn().mockResolvedValueOnce(pagina(obras)).mockResolvedValueOnce(new Response(JSON.stringify(comparacao), { status: 200 }))
    vi.stubGlobal('fetch', fetch)
    const onMeasured = vi.fn()
    const onBuscar = vi.fn()
    render(<Museum periodos={periodos} onOpen={() => undefined} onMeasured={onMeasured} onBuscar={onBuscar} />)
    await userEvent.click(screen.getByRole('button', { name: 'Entrar no museu' })); await screen.findByRole('list', { name: 'Obras da sala Primeiro Renascimento' })
    await userEvent.click(screen.getByRole('button', { name: 'Buscar nesta sala' }))
    expect(screen.getByRole('button', { name: 'Buscar nesta sala' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Procurar' })).toBeDisabled()
    await userEvent.click(screen.getByRole('radio', { name: 'Binária' }))
    await userEvent.click(screen.getByRole('button', { name: 'Procurar Obra 15 (ID 15), posição 6' }))
    expect(screen.getByText('Obra 15', { selector: 'strong' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Um passo' }))
    expect(screen.getByText(/Meio do intervalo: 13 < 15/)).toBeInTheDocument(); expect(screen.getByLabelText('1 comparações nesta sala')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Um passo' }))
    expect(screen.getByText(/15 = 15. Encontrada/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Medir no acervo completo' }))
    expect(await screen.findByText(/No acervo completo \(81.444 obras\), a mesma busca fez 17 comparações/)).toBeInTheDocument()
    expect(JSON.parse(fetch.mock.calls[1][1].body)).toEqual({ tipo: 'ID', valor: '15', estrategias: ['BINARIA'] }); expect(onMeasured).toHaveBeenCalledWith(comparacao)
    await userEvent.click(screen.getByRole('button', { name: 'Comparar as nove buscas' })); expect(onBuscar).toHaveBeenCalledWith(15)
  })
  it('reorganiza a parede com mover para o início e restaura a sala', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(pagina([10, 11, 12, 13].map(id => obra(id, 'x')))))
    render(<Museum periodos={periodos} onOpen={() => undefined} />)
    await userEvent.click(screen.getByRole('button', { name: 'Entrar no museu' })); await screen.findByRole('list', { name: 'Obras da sala Primeiro Renascimento' })
    await userEvent.click(screen.getByRole('button', { name: 'Buscar nesta sala' }))
    await userEvent.click(screen.getByRole('radio', { name: 'Mover para o início' }))
    await userEvent.click(screen.getByRole('button', { name: 'Procurar Obra 13 (ID 13), posição 4' }))
    for (let passo = 0; passo < 5; passo++) await userEvent.click(screen.getByRole('button', { name: 'Um passo' }))
    expect(screen.getByText(/Move 13 para o início/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Procurar Obra 13 (ID 13), posição 1' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Restaurar sala' }))
    expect(screen.getByRole('button', { name: 'Procurar Obra 13 (ID 13), posição 4' })).toBeInTheDocument()
  })
})
