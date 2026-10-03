import { useCallback, useEffect, useRef, useState } from 'react'
import { api, type Comparacao, type Destaques, type Obra, type Pagina, type Periodo, type Resumo } from './api'
import { DetailsDrawer } from '@/components/details-drawer'
import type { TipoEntrada } from '@/components/search-panel'
import { SiteFooter } from '@/components/site-footer'
import { SiteHeader } from '@/components/site-header'
import { AboutPage } from '@/pages/about'
import { HomePage } from '@/pages/home'
import { CollectionPage, MuseumPage, SearchPage, StructuresPage } from '@/pages/inner-pages'
import { RotaProvider, TITULOS, useRoteador } from '@/lib/router'
import { TODAS } from '@/lib/strategies'

type Pedido = { type: TipoEntrada; value: string; strategies: string[] }

export function App() {
  const roteador = useRoteador(), { rota, navegar } = roteador
  const [periods, setPeriods] = useState<Periodo[]>([]), [period, setPeriod] = useState(''), [page, setPage] = useState<Pagina | null>(null), [pageNumber, setPageNumber] = useState(0)
  const [loading, setLoading] = useState(true), [comparing, setComparing] = useState(false), [error, setError] = useState(''), [details, setDetails] = useState<Obra | null>(null)
  const [type, setType] = useState<TipoEntrada>('ID'), [value, setValue] = useState(''), [comparison, setComparison] = useState<Comparacao | null>(null), [summary, setSummary] = useState<Resumo | null>(null)
  const [strategies, setStrategies] = useState<string[]>(TODAS), [flipped, setFlipped] = useState<number | null>(null), [flash, setFlash] = useState(0), [destaques, setDestaques] = useState<Destaques | null>(null)
  const detailTrigger = useRef<HTMLButtonElement>(null), submitRef = useRef<HTMLButtonElement>(null), inputRef = useRef<HTMLInputElement>(null), primeiraRota = useRef(true)
  const closeDetails = useCallback(() => setDetails(null), [])
  useEffect(() => { api.periodos().then(setPeriods).catch(reason => setError(reason.message)) }, [])
  // Destaques são complementares: se falharem, o catálogo continua utilizável.
  useEffect(() => { api.destaques().then(setDestaques).catch(() => undefined) }, [])
  useEffect(() => {
    let active = true

    async function loadCatalog() {
      await Promise.resolve()
      if (!active) return

      setLoading(true)
      setError('')

      try {
        const result = await api.obras(period, pageNumber)
        if (active) setPage(result)
      } catch (reason) {
        if (active) setError((reason as Error).message)
      } finally {
        if (active) setLoading(false)
      }
    }

    void loadCatalog()
    return () => { active = false }
  }, [period, pageNumber])
  // A cada troca de página: título da aba e foco no h1, para leitores de tela anunciarem a página nova.
  useEffect(() => {
    document.title = rota === '/' ? TITULOS['/'] : `${TITULOS[rota]} | Catálogo WikiArt`
    if (primeiraRota.current) { primeiraRota.current = false; return }
    document.querySelector<HTMLElement>('main h1')?.focus({ preventScroll: true })
  }, [rota])
  // Atalho "/": leva à busca de qualquer página, como em buscadores conhecidos.
  useEffect(() => {
    const atalho = (event: KeyboardEvent) => {
      const alvo = event.target as HTMLElement
      if (event.key !== '/' || event.ctrlKey || event.metaKey || alvo.closest('input, select, textarea, [contenteditable]')) return
      event.preventDefault(); navegar('/buscar'); requestAnimationFrame(() => inputRef.current?.focus())
    }
    document.addEventListener('keydown', atalho)
    return () => document.removeEventListener('keydown', atalho)
  }, [navegar])

  const nomePeriodo = (slug: string | null) => slug ? periods.find(item => item.slug === slug)?.nome ?? slug : ''
  async function changePeriod(next: string) { setError(''); try { await api.selecionar(next); setPeriod(next); setPageNumber(0); setDetails(null); setComparison(null); setSummary(null) } catch (reason) { setError((reason as Error).message) } }
  /** Abrir uma obra a move para o início dos recentes e transpõe o ranking no backend. */
  function registerView(obra: Obra) { api.visualizar(obra.id).then(setDestaques).catch(() => undefined) }
  async function runSearch(pedido: Pedido) {
    setError(''); setComparing(true)
    try {
      const result = await api.comparar(pedido.type, pedido.value.trim(), pedido.strategies)
      setComparison(result); setSummary(result.resumo); registerView(result.obra)
      requestAnimationFrame(() => document.getElementById('resultado')?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
    } catch (reason) { setError((reason as Error).message) } finally { setComparing(false) }
  }
  /** Leva o pedido para a página de busca, preenche o formulário e já executa. */
  function searchFor(pedido: Pedido) { setType(pedido.type); setValue(pedido.value); setStrategies(pedido.strategies); setFlipped(null); navegar('/buscar'); void runSearch(pedido) }
  async function reset() { setError(''); try { await api.reiniciar(); setPeriod(''); setPageNumber(0); setValue(''); setComparison(null); setDetails(null); setSummary(await api.resumo()) } catch (reason) { setError((reason as Error).message) } }
  function selectPage(next: number) { setPageNumber(next); requestAnimationFrame(() => document.getElementById('acervo')?.scrollIntoView({ behavior: 'smooth', block: 'start' })) }
  function openDetails(obra: Obra, trigger: HTMLButtonElement) { detailTrigger.current = trigger; setDetails(obra) }
  function flip(obra: Obra) { if (flipped !== obra.id) registerView(obra); setFlipped(current => current === obra.id ? null : obra.id) }
  function openHighlight(obra: Obra, trigger: HTMLButtonElement) { openDetails(obra, trigger); registerView(obra) }
  function applyOnly(tipo: string) { setStrategies([tipo]); setFlash(count => count + 1); navegar('/buscar'); requestAnimationFrame(() => (value ? submitRef : inputRef).current?.focus()) }

  const panel = { periods, period, onPeriod: changePeriod, onReset: reset, type, onType: setType, value, onValue: setValue, strategies, onStrategies: setStrategies, comparing, flash, inputRef, submitRef,
    onSubmit: (event: React.FormEvent<HTMLFormElement>) => { event.preventDefault(); void runSearch({ type, value, strategies }) } }
  return <RotaProvider value={roteador}>
    <SiteHeader />
    <main key={rota} className="page">
      {rota === '/' && <HomePage obras={page?.conteudo ?? []} total={periods.length ? periods.reduce((soma, item) => soma + item.quantidade, 0) : null} destaques={destaques} onOpen={openHighlight} onQuickSearch={valor => searchFor({ type: /^\d+$/.test(valor) ? 'ID' : 'CODIGO', value: valor, strategies: TODAS })} />}
      {rota === '/buscar' && <SearchPage panel={panel} error={error} comparison={comparison} summary={summary} periodoResumo={nomePeriodo(summary?.periodo ?? null)} onZoom={openHighlight} />}
      {rota === '/estruturas' && <StructuresPage inicial={roteador.busca.get('busca') ?? undefined} onUse={applyOnly} />}
      {rota === '/acervo' && <CollectionPage periods={periods} period={period} onPeriod={changePeriod} loading={loading} error={error} page={page} pageNumber={pageNumber} onPage={selectPage} flipped={flipped} onFlip={flip} onZoom={openDetails} onSearch={obra => searchFor({ type: 'ID', value: String(obra.id), strategies })} />}
      {rota === '/sobre' && <AboutPage />}
      {rota === '/museu' && <MuseumPage periodos={periods} onOpen={openHighlight} onMeasured={result => { setComparison(result); setSummary(result.resumo) }} onBuscar={id => searchFor({ type: 'ID', value: String(id), strategies: TODAS })} />}
    </main>
    <SiteFooter />
    <DetailsDrawer obra={details} onClose={closeDetails} returnFocus={detailTrigger} onSearch={rota === '/buscar' ? undefined : obra => { setDetails(null); searchFor({ type: 'ID', value: String(obra.id), strategies: TODAS }) }} />
  </RotaProvider>
}
