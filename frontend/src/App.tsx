import { FormEvent, useEffect, useRef, useState } from 'react'
import { BarChart3, BookOpen, Menu, RotateCcw, Search, X } from 'lucide-react'
import { api, type Comparacao, type Obra, type Pagina, type Periodo, type Resumo } from './api'
import { CatalogPagination } from '@/components/catalog-pagination'
import { Button } from '@/components/ui/button-1'
import { FlowButton } from '@/components/ui/flow-button'

function scrollToSection(id: string) { document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }

function Navbar({ onSummary }: { onSummary: () => void }) {
  const [open, setOpen] = useState(false)
  const navigate = (id: string) => { setOpen(false); if (id === 'resumo') onSummary(); scrollToSection(id) }
  return <header className="site-header"><div className="nav-shell">
    <button className="brand" onClick={() => scrollToSection('inicio')} aria-label="Voltar ao início"><span className="brand-mark">W</span>Catálogo WikiArt</button>
    <nav className={open ? 'nav-links is-open' : 'nav-links'} aria-label="Navegação principal">
      <button onClick={() => navigate('catalogo')}><BookOpen />Catálogo</button>
      <button onClick={() => navigate('comparacao')}><Search />Comparação</button>
      <button onClick={() => navigate('resumo')}><BarChart3 />Resumo</button>
    </nav>
    <Button className="menu-button" variant="ghost" mode="icon" size="icon" aria-label={open ? 'Fechar menu' : 'Abrir menu'} aria-expanded={open} onClick={() => setOpen(value => !value)}>{open ? <X /> : <Menu />}</Button>
  </div></header>
}

function Hero({ obra, total, periodo }: { obra?: Obra; total: number; periodo: string }) {
  return <section id="inicio" className="hero" aria-labelledby="hero-title">
    {obra && <img className="hero-image" src={`/api/imagens/${obra.id}/original`} alt="" onError={event => { event.currentTarget.hidden = true }} />}
    <div className="hero-overlay" /><div className="hero-content"><p className="eyebrow">{periodo || 'Todos os períodos'} · {total.toLocaleString('pt-BR')} obras</p>
      <h1 id="hero-title">Catálogo do<br />dataset WikiArt.</h1>
      <p>Explore o acervo, conheça 14 métodos de busca e compare as oito estratégias compatíveis com busca exata por ID.</p>
      <FlowButton text="Explorar catálogo" onClick={() => scrollToSection('catalogo')} />
    </div>
  </section>
}

function ArtworkCard({ obra, onOpen }: { obra: Obra; onOpen: (obra: Obra, trigger: HTMLButtonElement) => void }) {
  const [loaded, setLoaded] = useState(false)
  return <article className="art-card"><div className="art-image-wrap"><img className={loaded ? 'art-image fade-in' : 'art-image is-loading'} src={`/api/imagens/${obra.id}/miniatura`} alt={`Miniatura de ${obra.titulo}`} loading="lazy" onLoad={() => setLoaded(true)} onError={event => { event.currentTarget.hidden = true }} /><span className="image-fallback">Imagem indisponível</span></div>
    <div className="art-card-body"><p className="eyebrow">{obra.estilo}</p><h3>{obra.titulo}</h3><p className="metadata">ID {obra.id} · Código {obra.codigoAcervo}</p><Button variant="outline" onClick={event => onOpen(obra, event.currentTarget)}>Ver detalhes</Button></div>
  </article>
}

function DetailsDrawer({ obra, onClose, returnFocus }: { obra: Obra | null; onClose: () => void; returnFocus: React.RefObject<HTMLButtonElement | null> }) {
  const closeRef = useRef<HTMLButtonElement>(null)
  useEffect(() => { if (!obra) return; const trigger = returnFocus.current; closeRef.current?.focus(); const key = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }; document.addEventListener('keydown', key); document.body.classList.add('drawer-open'); return () => { document.removeEventListener('keydown', key); document.body.classList.remove('drawer-open'); trigger?.focus({ preventScroll: true }) } }, [obra, onClose, returnFocus])
  if (!obra) return null
  return <div className="drawer-layer" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}><aside className="details-drawer" role="dialog" aria-modal="true" aria-labelledby="drawer-title">
    <Button ref={closeRef} className="drawer-close" variant="ghost" mode="icon" size="icon" aria-label="Fechar detalhes" onClick={onClose}><X /></Button>
    <div className="drawer-image"><img src={`/api/imagens/${obra.id}/original`} alt={`Obra ${obra.titulo}`} onError={event => { event.currentTarget.hidden = true }} /></div><p className="eyebrow">{obra.estilo}</p><h2 id="drawer-title">{obra.titulo}</h2><dl><div><dt>ID interno</dt><dd>{obra.id}</dd></div><div><dt>Código original</dt><dd>{obra.codigoAcervo}</dd></div><div><dt>Artista</dt><dd>{obra.artista}</dd></div></dl><Button asChild><a href={`/api/imagens/${obra.id}/original`} target="_blank" rel="noreferrer">Abrir imagem original</a></Button>
  </aside></div>
}

function ComparisonTable({ comparison }: { comparison: Comparacao | null }) {
  return <section id="comparacao" className="content-section" aria-labelledby="comparison-title"><div className="section-heading"><p className="eyebrow">Experimento</p><h2 id="comparison-title">Comparação das 8 buscas exatas</h2><p className="section-description">O projeto possui 14 métodos. Esta tabela compara somente os oito que recebem a mesma chave e procuram exatamente a obra solicitada. Os outros seis realizam consultas diferentes: artista, piso, teto, intervalo, menor chave e maior chave.</p></div>{!comparison ? <div className="empty-state"><Search /><p>Escolha um ID ou código original para executar as oito estratégias de busca exata.</p></div> : <div className="data-panel"><h3>{comparison.obra.titulo}</h3><div className="table-wrap"><table><thead><tr><th>Estratégia</th><th>Comparações</th><th>Reorganizações</th><th>Tempo (µs)</th></tr></thead><tbody>{comparison.medicoes.map(item => <tr key={item.tipo}><td>{item.nome}</td><td>{item.comparacoes}</td><td>{item.reorganizacoes}</td><td>{item.tempoMicros.toFixed(2)}</td></tr>)}</tbody></table></div></div>}</section>
}

function SummaryPanel({ summary }: { summary: Resumo | null }) {
  return <section id="resumo" className="content-section" aria-labelledby="summary-title"><div className="section-heading"><p className="eyebrow">Sessão atual</p><h2 id="summary-title">Resumo das 8 buscas exatas</h2></div>{!summary ? <div className="empty-state"><BarChart3 /><p>As métricas aparecerão após uma comparação ou ao abrir esta seção.</p></div> : <div className="data-panel"><p>{summary.quantidadeObras.toLocaleString('pt-BR')} obras no subconjunto.</p><div className="table-wrap"><table><thead><tr><th>Estratégia</th><th>Buscas</th><th>Eficácia</th><th>Média de comparações</th></tr></thead><tbody>{summary.estrategias.map(item => <tr key={item.tipo}><td>{item.nome}</td><td>{item.buscas}</td><td>{item.eficaciaPercentual.toFixed(1)}%</td><td>{item.mediaComparacoes.toFixed(1)}</td></tr>)}</tbody></table></div></div>}</section>
}

export function App() {
  const [periods, setPeriods] = useState<Periodo[]>([]), [period, setPeriod] = useState(''), [page, setPage] = useState<Pagina | null>(null), [pageNumber, setPageNumber] = useState(0)
  const [loading, setLoading] = useState(true), [comparing, setComparing] = useState(false), [error, setError] = useState(''), [details, setDetails] = useState<Obra | null>(null)
  const [type, setType] = useState<'ID' | 'CODIGO'>('ID'), [value, setValue] = useState(''), [comparison, setComparison] = useState<Comparacao | null>(null), [summary, setSummary] = useState<Resumo | null>(null)
  const detailTrigger = useRef<HTMLButtonElement>(null)
  useEffect(() => { api.periodos().then(setPeriods).catch(reason => setError(reason.message)) }, [])
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
  const selectedPeriod = periods.find(item => item.slug === period)?.nome ?? ''
  async function changePeriod(next: string) { setError(''); try { await api.selecionar(next); setPeriod(next); setPageNumber(0); setDetails(null); setComparison(null); setSummary(null) } catch (reason) { setError((reason as Error).message) } }
  async function compare(event: FormEvent<HTMLFormElement>) { event.preventDefault(); detailTrigger.current = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null; setError(''); setComparing(true); try { const result = await api.comparar(type, value.trim()); setComparison(result); setDetails(result.obra); setSummary(result.resumo); requestAnimationFrame(() => scrollToSection('comparacao')) } catch (reason) { setError((reason as Error).message) } finally { setComparing(false) } }
  async function loadSummary() { try { setSummary(await api.resumo()) } catch (reason) { setError((reason as Error).message) } }
  async function reset() { try { await api.reiniciar(); setPeriod(''); setPageNumber(0); setComparison(null); setDetails(null); setSummary(await api.resumo()) } catch (reason) { setError((reason as Error).message) } }
  function selectPage(next: number) { setPageNumber(next); requestAnimationFrame(() => scrollToSection('catalogo')) }
  function openDetails(obra: Obra, trigger: HTMLButtonElement) { detailTrigger.current = trigger; setDetails(obra) }
  return <><Navbar onSummary={loadSummary} /><main><Hero obra={page?.conteudo[0]} total={page?.totalElementos ?? 0} periodo={selectedPeriod} />
    <section id="catalogo" className="content-section catalog-section" aria-labelledby="catalog-title"><div className="section-heading"><p className="eyebrow">Acervo navegável</p><h2 id="catalog-title">Obras do catálogo</h2></div>
      <div className="filters"><label>Período<select value={period} onChange={event => changePeriod(event.target.value)}><option value="">Todos os períodos</option>{periods.map(item => <option key={item.slug} value={item.slug}>{item.nome} ({item.quantidade})</option>)}</select></label>
        <form className="search-form" onSubmit={compare}><label>Tipo<select value={type} onChange={event => setType(event.target.value as 'ID' | 'CODIGO')}><option value="ID">ID interno</option><option value="CODIGO">Código original</option></select></label><label className="search-field">Busca<input value={value} onChange={event => setValue(event.target.value)} required placeholder={type === 'ID' ? 'Ex.: 67' : 'Ex.: 232331'} /></label><FlowButton type="submit" text="Comparar buscas" loading={comparing} /></form>
        <Button className="reset-button" variant="ghost" size="lg" onClick={reset}><RotateCcw />Reiniciar sessão</Button></div>
      {error && <div className="error-message" role="alert">{error}</div>}{loading ? <div className="loading-state" role="status">Carregando obras…</div> : page?.conteudo.length === 0 ? <div className="empty-state"><BookOpen /><p>Nenhuma obra encontrada.</p></div> : <div className="art-grid">{page?.conteudo.map(obra => <ArtworkCard key={obra.id} obra={obra} onOpen={openDetails} />)}</div>}
      {page && <CatalogPagination current={pageNumber} total={page.totalPaginas} onChange={selectPage} />}
    </section><ComparisonTable comparison={comparison} /><SummaryPanel summary={summary} /></main>
    <DetailsDrawer obra={details} onClose={() => setDetails(null)} returnFocus={detailTrigger} />
  </>
}
