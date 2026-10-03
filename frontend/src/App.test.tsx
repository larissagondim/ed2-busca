import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App } from './App'
import { TODAS } from '@/lib/strategies'

const obra = { id: 0, codigoAcervo: 'aaron-siskind_chicago-1951', titulo: 'Obra 232331', artista: 'Artista desconhecido', estilo: 'Academic Art', caminhoImagem: 'data/wikiart/232331.jpg' }
const resumo = { periodo: null, quantidadeObras: 1, estrategias: [] }
const pagina = { conteudo: [obra], pagina: 0, tamanho: 24, totalElementos: 1, totalPaginas: 1 }
const periodos = [{ slug: 'academic-art', nome: 'Academic Art', quantidade: 1 }]
const medicao = (tipo: string, comparacoes: number) => ({ tipo, nome: tipo, encontrou: true, comparacoes, reorganizacoes: 0, tempoMicros: 1, cpuMicros: null })
const json = (body: unknown, status = 200) => new Response(body === null ? null : JSON.stringify(body), { status })
afterEach(() => vi.unstubAllGlobals())

/** Servidor falso por rota: cada teste sobrescreve só o que importa. */
function servidor(extra: Record<string, (init?: RequestInit) => Response> = {}) {
  let vistas = 0
  const rotas: Record<string, (init?: RequestInit) => Response> = {
    '/api/periodos': () => json(periodos), '/api/destaques': () => json({ recentes: [], maisVistas: [] }), '/api/obras?': () => json(pagina),
    '/api/obras/0/visualizacoes': () => { vistas++; return json({ recentes: [obra], maisVistas: [{ obra, visualizacoes: vistas }] }) },
    '/api/buscas/comparar': () => json({ obra, medicoes: [medicao('SEQUENCIAL', 1)], resumo }), '/api/sessao/resumo': () => json(resumo),
    '/api/sessao/periodo': () => json(resumo), '/api/sessao': () => json(null, 204), ...extra,
  }
  const fetch = vi.fn((url: string, init?: RequestInit) => {
    const chave = Object.keys(rotas).filter(prefixo => url.startsWith(prefixo)).sort((a, b) => b.length - a.length)[0]
    return Promise.resolve(chave ? rotas[chave](init) : json({ mensagem: `sem rota ${url}` }, 404))
  })
  vi.stubGlobal('fetch', fetch)
  return fetch
}
const chamadas = (fetch: ReturnType<typeof servidor>, prefixo: string) => fetch.mock.calls.filter(([url]) => url.startsWith(prefixo))
const corpo = (fetch: ReturnType<typeof servidor>, prefixo: string, indice = 0) => JSON.parse(chamadas(fetch, prefixo)[indice][1]!.body as string)
function abrir(caminho: string) { window.history.pushState(null, '', caminho); return render(<App />) }

describe('App', () => {
  it('a página inicial mostra as estruturas e a busca rápida leva ao resultado', async () => {
    const fetch = servidor(); abrir('/')
    expect(screen.getByRole('heading', { level: 1, name: 'Encontre uma obra. Compare as buscas.' })).toBeInTheDocument()
    const mapa = screen.getByRole('region', { name: 'O que está por trás de cada busca' })
    expect(within(mapa).getAllByRole('heading', { level: 3 }).map(item => item.textContent)).toEqual(['Lista encadeada', 'Tabela ordenada', 'Lista com saltos', 'Árvore afunilada'])
    await userEvent.type(screen.getByLabelText('ID ou código da obra'), '0'); await userEvent.click(screen.getByRole('button', { name: 'Buscar' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Buscar uma obra' })).toBeInTheDocument(); expect(window.location.pathname).toBe('/buscar')
    expect(await screen.findByRole('heading', { level: 3, name: 'Obra 232331' })).toBeInTheDocument()
    expect(corpo(fetch, '/api/buscas/comparar')).toEqual({ tipo: 'ID', valor: '0', estrategias: TODAS })
    expect(screen.getByLabelText('Busca')).toHaveValue('0'); expect(document.title).toBe('Buscar uma obra | Catálogo WikiArt')
  })
  it('a busca rápida reconhece códigos', async () => {
    const fetch = servidor(); abrir('/')
    await userEvent.type(screen.getByLabelText('ID ou código da obra'), 'aaron-siskind_chicago-1951{Enter}')
    await waitFor(() => expect(chamadas(fetch, '/api/buscas/comparar')).toHaveLength(1))
    expect(corpo(fetch, '/api/buscas/comparar')).toMatchObject({ tipo: 'CODIGO', valor: 'aaron-siskind_chicago-1951' })
  })
  it('no acervo, vira a obra, amplia e fecha com Escape', async () => {
    servidor(); abrir('/acervo')
    expect(await screen.findByRole('heading', { level: 3, name: 'Obra 232331' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Ampliar imagem' })).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Ver detalhes' }))
    expect(screen.getByRole('button', { name: 'Virar Obra 232331 de volta' })).toHaveFocus(); expect(screen.getByText('Artista desconhecido')).toBeVisible()
    await userEvent.click(screen.getByRole('button', { name: 'Ampliar imagem' })); expect(screen.getByRole('dialog')).toHaveTextContent('Código originalaaron-siskind_chicago-1951')
    fireEvent.keyDown(document, { key: 'Escape' }); expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
  it('registra a visualização ao virar o cartão e mostra recentes e mais vistas na página inicial', async () => {
    const fetch = servidor(); abrir('/acervo'); await screen.findByRole('heading', { level: 3, name: 'Obra 232331' })
    await userEvent.click(screen.getByRole('button', { name: 'Ver detalhes' }))
    await waitFor(() => expect(chamadas(fetch, '/api/obras/0/visualizacoes')).toHaveLength(1))
    // Virar de volta não conta como nova visualização.
    await userEvent.click(screen.getByRole('button', { name: 'Virar Obra 232331 de volta' })); expect(chamadas(fetch, '/api/obras/0/visualizacoes')).toHaveLength(1)
    await userEvent.click(screen.getByRole('link', { name: 'Catálogo WikiArt' }))
    expect(within(await screen.findByRole('list', { name: 'Vistas recentemente' })).getByRole('button', { name: 'Abrir Obra 232331, mais recente' })).toBeInTheDocument()
    const ranking = screen.getByRole('list', { name: 'Mais vistas' }); expect(within(ranking).getByText('1 visualização')).toBeInTheDocument()
    await userEvent.click(within(ranking).getByRole('button', { name: /Abrir Obra 232331/ }))
    expect(screen.getByRole('dialog')).toBeInTheDocument(); await waitFor(() => expect(chamadas(fetch, '/api/obras/0/visualizacoes')).toHaveLength(2))
  })
  it('"Buscar esta obra" leva para a busca já com o resultado', async () => {
    const fetch = servidor(); abrir('/acervo')
    await screen.findByRole('heading', { level: 3, name: 'Obra 232331' })
    await userEvent.click(screen.getByRole('button', { name: 'Ver detalhes' })); await userEvent.click(screen.getByRole('button', { name: 'Buscar esta obra' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Buscar uma obra' })).toBeInTheDocument(); expect(screen.getByLabelText('Busca')).toHaveValue('0')
    await waitFor(() => expect(chamadas(fetch, '/api/buscas/comparar')).toHaveLength(1)); expect(corpo(fetch, '/api/buscas/comparar')).toEqual({ tipo: 'ID', valor: '0', estrategias: TODAS })
  })
  it('aplica só as buscas escolhidas, ordena o resultado e mostra a estrutura de cada uma', async () => {
    const acumulado = { tipo: 'SEQUENCIAL', nome: 'SEQUENCIAL', buscas: 1, sucessos: 1, comparacoes: 9, reorganizacoes: 0, eficaciaPercentual: 100, mediaComparacoes: 9, mediaTempoMicros: 1, mediaCpuMicros: null }
    const comparacao = { obra, medicoes: [medicao('SEQUENCIAL', 9), { ...medicao('BINARIA', 3), encontrou: false }], resumo: { ...resumo, estrategias: [acumulado] } }
    const fetch = servidor({ '/api/buscas/comparar': () => json(comparacao) }); abrir('/buscar')
    await userEvent.click(screen.getByRole('button', { name: 'Desmarcar todas' }))
    expect(screen.getByRole('button', { name: 'Comparar buscas' })).toBeDisabled(); expect(screen.getByText('Marque ao menos uma busca.')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Binária' })); await userEvent.type(screen.getByLabelText('Busca'), '0')
    await userEvent.click(screen.getByRole('button', { name: 'Executar busca' }))
    const tabela = within(await screen.findByRole('region', { name: 'Resultado das buscas' })).getByRole('table')
    const linhas = within(tabela).getAllByRole('row').slice(1)
    expect(corpo(fetch, '/api/buscas/comparar')).toEqual({ tipo: 'ID', valor: '0', estrategias: ['BINARIA'] })
    expect(linhas.map(linha => (linha as HTMLTableRowElement).cells[0].textContent)).toEqual(['BINARIATabela ordenada não encontrou', 'SEQUENCIALLista encadeada'])
    expect(linhas[0]).toHaveClass('is-best'); expect(screen.getByText('1 obra no subconjunto')).toBeInTheDocument()
    const porEstrutura = within(screen.getByRole('list', { name: 'Melhor busca por estrutura' })).getAllByRole('listitem')
    expect(porEstrutura.map(item => item.textContent)).toEqual(['Lista encadeada9 comparaçõesmelhor: Sequencial', 'Tabela ordenada3 comparaçõesmelhor: Binária'])
    expect(porEstrutura[1]).toHaveClass('is-best')
    expect(screen.getByRole('link', { name: 'Ver BINARIA passo a passo' })).toHaveAttribute('href', '/estruturas?busca=BINARIA#como-funciona')
    const resumoSessao = screen.getByRole('region', { name: 'Resumo da sessão' })
    expect(within(resumoSessao).getByText(/As médias ficam úteis a partir da segunda busca/)).toBeInTheDocument(); expect(within(resumoSessao).queryByRole('table')).not.toBeInTheDocument()
    await userEvent.click(within(resumoSessao).getByRole('button', { name: 'Ver médias mesmo assim' })); expect(within(resumoSessao).getByRole('table')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Ampliar imagem' })); expect(screen.getByRole('dialog')).toBeInTheDocument()
  })
  it('troca o período da sessão e reinicia', async () => {
    const fetch = servidor(); abrir('/buscar')
    await screen.findByRole('option', { name: 'Academic Art (1)' })
    await userEvent.selectOptions(screen.getByLabelText('Período da sessão'), 'academic-art')
    await waitFor(() => expect(chamadas(fetch, '/api/sessao/periodo/academic-art')).toHaveLength(1))
    await userEvent.click(screen.getByRole('button', { name: /Reiniciar sessão/ }))
    await waitFor(() => expect(screen.getByText('1 obra no subconjunto')).toBeInTheDocument())
    expect(chamadas(fetch, '/api/sessao').some(([, init]) => init?.method === 'DELETE')).toBe(true)
  })
  it('anuncia erro da API no acervo', async () => {
    servidor({ '/api/obras?': () => json({ mensagem: 'Catálogo indisponível' }, 500) }); abrir('/acervo')
    expect(await screen.findByRole('alert')).toHaveTextContent('Catálogo indisponível'); await waitFor(() => expect(screen.queryByText('Carregando obras…')).not.toBeInTheDocument())
  })
  it('abre a página de estruturas na busca pedida e a aplica na busca', async () => {
    servidor(); abrir('/estruturas?busca=FIBONACCI')
    expect(screen.getByRole('heading', { level: 1, name: 'Estruturas de dados' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Fibonacci/ })).toHaveAttribute('aria-selected', 'true')
    await userEvent.click(screen.getByRole('button', { name: 'Buscar uma obra com esta busca' }))
    expect(window.location.pathname).toBe('/buscar'); expect(screen.getByRole('button', { name: 'Fibonacci' })).toHaveAttribute('aria-pressed', 'true'); expect(screen.getByText('1 de 9')).toBeInTheDocument()
  })
  it('navega pelo menu, marca a página atual e aceita o atalho "/"', async () => {
    servidor(); abrir('/')
    const menu = screen.getByRole('navigation', { name: 'Navegação principal' })
    await userEvent.click(within(menu).getByRole('link', { name: 'Museu' }))
    expect(screen.getByRole('heading', { level: 1, name: 'Museu do acervo' })).toHaveFocus(); expect(within(menu).getByRole('link', { name: 'Museu' })).toHaveAttribute('aria-current', 'page')
    fireEvent.keyDown(document.body, { key: '/' })
    expect(window.location.pathname).toBe('/buscar'); await waitFor(() => expect(screen.getByLabelText('Busca')).toHaveFocus())
    window.history.back(); await waitFor(() => expect(screen.getByRole('heading', { level: 1, name: 'Museu do acervo' })).toBeInTheDocument())
  })
  it('o painel de detalhes leva a obra para as nove buscas', async () => {
    const fetch = servidor({ '/api/destaques': () => json({ recentes: [obra], maisVistas: [] }) }); abrir('/')
    await userEvent.click(await screen.findByRole('button', { name: 'Abrir Obra 232331, mais recente' }))
    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Buscar esta obra' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument(); expect(window.location.pathname).toBe('/buscar')
    await waitFor(() => expect(chamadas(fetch, '/api/buscas/comparar')).toHaveLength(1)); expect(corpo(fetch, '/api/buscas/comparar')).toEqual({ tipo: 'ID', valor: '0', estrategias: TODAS })
    await userEvent.click(await screen.findByRole('button', { name: 'Ampliar imagem' }))
    expect(within(screen.getByRole('dialog')).queryByRole('button', { name: 'Buscar esta obra' })).not.toBeInTheDocument()
  })
  it('alterna o modo escuro e guarda a escolha', async () => {
    servidor(); abrir('/')
    await userEvent.click(screen.getByRole('button', { name: 'Ativar modo escuro' }))
    expect(document.documentElement.dataset.theme).toBe('dark'); expect(localStorage.getItem('tema')).toBe('dark')
    await userEvent.click(screen.getByRole('button', { name: 'Ativar modo claro' }))
    expect(document.documentElement.dataset.theme).toBe('light'); expect(localStorage.getItem('tema')).toBe('light')
  })
  it('roda as outras consultas com a entrada de cada uma e anuncia erros', async () => {
    const fetch = servidor({ '/api/buscas/consulta': init => {
      const pedido = JSON.parse(init!.body as string)
      return pedido.tipo === 'INTERVALO' ? json({ mensagem: 'O fim do intervalo deve ser maior ou igual ao início.' }, 400) : json({ tipo: pedido.tipo, nome: pedido.tipo === 'PISO' ? 'Busca de piso' : 'Busca da maior chave', obras: [obra], total: 1, comparacoes: 4, tempoMicros: 1 })
    } }); abrir('/buscar')
    const consultas = screen.getByRole('region', { name: 'Outras consultas' })
    expect(within(consultas).getByRole('radio', { name: 'Piso' })).toHaveAttribute('aria-checked', 'true')
    await userEvent.type(within(consultas).getByLabelText('ID'), '5'); await userEvent.click(within(consultas).getByRole('button', { name: 'Consultar' }))
    expect(await within(consultas).findByText('1 obra encontrada com 4 comparações.')).toBeInTheDocument()
    expect(corpo(fetch, '/api/buscas/consulta')).toEqual({ tipo: 'PISO', inicio: 5 })
    await userEvent.click(within(consultas).getByRole('button', { name: 'Abrir Obra 232331, ID 0' })); expect(screen.getByRole('dialog')).toBeInTheDocument(); fireEvent.keyDown(document, { key: 'Escape' })
    await userEvent.click(within(consultas).getByRole('radio', { name: 'Maior chave' })); expect(within(consultas).getByText('Esta consulta não precisa de chave.')).toBeInTheDocument()
    await userEvent.click(within(consultas).getByRole('button', { name: 'Consultar' })); await waitFor(() => expect(corpo(fetch, '/api/buscas/consulta', 1)).toEqual({ tipo: 'MAIOR_CHAVE' }))
    await userEvent.click(within(consultas).getByRole('radio', { name: 'Intervalo' }))
    await userEvent.type(within(consultas).getByLabelText('Do ID'), '4'); await userEvent.type(within(consultas).getByLabelText('Até o ID'), '1'); await userEvent.click(within(consultas).getByRole('button', { name: 'Consultar' }))
    expect(await within(consultas).findByRole('alert')).toHaveTextContent('O fim do intervalo deve ser maior ou igual ao início.')
  })
  it('mostra cinco destaques por lista e abre o restante sob demanda', async () => {
    const recentes = Array.from({ length: 7 }, (_, id) => ({ ...obra, id, titulo: `Obra ${id}` }))
    servidor({ '/api/destaques': () => json({ recentes, maisVistas: [] }) }); abrir('/')
    const lista = await screen.findByRole('list', { name: 'Vistas recentemente' })
    expect(within(lista).getAllByRole('listitem')).toHaveLength(5)
    await userEvent.click(screen.getByRole('button', { name: 'Ver todas (7)' })); expect(within(lista).getAllByRole('listitem')).toHaveLength(7)
    expect(screen.getByRole('button', { name: 'Ver menos' })).toHaveAttribute('aria-expanded', 'true')
  })
  it('a página Sobre explica as métricas e é alcançada pelo rodapé', async () => {
    servidor(); abrir('/')
    await userEvent.click(screen.getByRole('link', { name: 'Sobre o projeto' }))
    expect(screen.getByRole('heading', { level: 1, name: 'Sobre o projeto' })).toBeInTheDocument(); expect(window.location.pathname).toBe('/sobre')
    expect(screen.getByText('Comparações').tagName).toBe('DT'); expect(screen.getByRole('link', { name: 'Outras consultas' })).toHaveAttribute('href', '/buscar#outras-consultas')
  })
  it('mantém os endereços antigos', () => {
    servidor(); abrir('/catalogo')
    expect(screen.getByRole('heading', { level: 1, name: 'Acervo' })).toBeInTheDocument()
  })
})
