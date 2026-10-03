import type { ComponentProps, ReactNode } from 'react'
import { BookOpen } from 'lucide-react'
import type { Comparacao, Obra, Pagina, Periodo, Resumo } from '@/api'
import { ArtworkCard, CatalogSkeleton, type AoAbrir } from '@/components/artwork-card'
import { CatalogPagination } from '@/components/catalog-pagination'
import { Museum } from '@/components/museum'
import { SearchExplainer } from '@/components/search-explainer'
import { SearchPanel } from '@/components/search-panel'
import { OtherQueries } from '@/components/other-queries'
import { SearchResults, SummaryPanel } from '@/components/search-results'
import { StructureMap } from '@/components/structure-map'
import { PageHeader } from './page-header'

const Erro = ({ error }: { error: string }) => error ? <div className="error-message" role="alert">{error}</div> : null

export function SearchPage({ panel, error, comparison, summary, periodoResumo, onZoom }: { panel: ComponentProps<typeof SearchPanel>; error: string; comparison: Comparacao | null; summary: Resumo | null; periodoResumo: string; onZoom: AoAbrir }) {
  return <>
    <div className="content-section page-intro">
      <PageHeader titulo="Buscar uma obra">Escolha a obra pelo ID ou pelo código, marque as buscas e compare quantas comparações cada estrutura precisa para encontrá-la.</PageHeader>
      <SearchPanel {...panel} />
      <Erro error={error} />
    </div>
    <SearchResults comparison={comparison} onZoom={onZoom} />
    <SummaryPanel summary={summary} periodo={periodoResumo} />
    <OtherQueries onOpen={onZoom} />
  </>
}

export function StructuresPage({ inicial, onUse }: { inicial?: string; onUse: (tipo: string) => void }) {
  return <>
    <div className="content-section page-intro">
      <PageHeader titulo="Estruturas de dados">Quatro estruturas sustentam as nove buscas exatas do catálogo. Veja o papel de cada uma e acompanhe as buscas comparação por comparação.</PageHeader>
    </div>
    <StructureMap titulo="Onde cada estrutura trabalha" descricao="As fichas abaixo seguem o código do backend: quais buscas cada estrutura atende e o que ela mantém no site." />
    <SearchExplainer key={inicial ?? ''} inicial={inicial} onUse={onUse} />
  </>
}

type Acervo = { periods: Periodo[]; period: string; onPeriod: (slug: string) => void; loading: boolean; error: string; page: Pagina | null; pageNumber: number; onPage: (pagina: number) => void; flipped: number | null; onFlip: (obra: Obra) => void; onZoom: AoAbrir; onSearch: (obra: Obra) => void }

export function CollectionPage({ periods, period, onPeriod, loading, error, page, pageNumber, onPage, flipped, onFlip, onZoom, onSearch }: Acervo) {
  return <div id="acervo" className="content-section page-intro catalog-section">
    <PageHeader titulo="Acervo">Navegue pelas obras por período. Vire uma obra para ver seus dados e use “Buscar esta obra” para compará-la nas nove buscas.</PageHeader>
    <div className="filters"><label>Período<select value={period} onChange={event => onPeriod(event.target.value)}><option value="">Todos os períodos</option>{periods.map(item => <option key={item.slug} value={item.slug}>{item.nome} ({item.quantidade})</option>)}</select></label>
      {page && <p className="filters-note">{page.totalElementos.toLocaleString('pt-BR')} {page.totalElementos === 1 ? 'obra' : 'obras'}, paginadas pela lista com saltos.</p>}</div>
    <Erro error={error} />
    {loading ? <CatalogSkeleton /> : page?.conteudo.length === 0 ? <div className="empty-state"><BookOpen /><p>Nenhuma obra neste período. Escolha outro período acima.</p></div> : <div className="art-grid" key={`${period}-${pageNumber}`}>{page?.conteudo.map((obra, index) => <ArtworkCard key={obra.id} obra={obra} index={index} flipped={flipped === obra.id} onFlip={onFlip} onZoom={onZoom} onSearch={onSearch} />)}</div>}
    {page && <CatalogPagination current={pageNumber} total={page.totalPaginas} onChange={onPage} />}
  </div>
}

export function MuseumPage(props: ComponentProps<typeof Museum>): ReactNode {
  return <>
    <div className="content-section page-intro">
      <PageHeader titulo="Museu do acervo">Percorra o acervo sala por sala, em ordem histórica. Em cada sala, use “Buscar nesta sala” para ver uma busca percorrer a parede.</PageHeader>
    </div>
    <Museum {...props} cabecalho={false} />
  </>
}
