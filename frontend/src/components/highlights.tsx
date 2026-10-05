import { imageFallback } from '@/lib/image-fallback'
import { useState } from 'react'
import { Flame, History, Palette } from 'lucide-react'
import type { Artista, Destaques, Obra } from '@/api'
import type { AoAbrir } from '@/components/artwork-card'
import { plural } from '@/lib/utils'

export function HighlightItem({ obra, badge, onOpen }: { obra: Obra; badge: string; onOpen: AoAbrir }) {
  return <li><button className="highlight-item" onClick={event => onOpen(obra, event.currentTarget)} aria-label={`Abrir ${obra.titulo}, ${badge}`}>
    <span className="highlight-thumb" aria-hidden><img src={`/api/imagens/${obra.id}/miniatura`} alt="" loading="lazy" onError={imageFallback} /></span>
    <span className="highlight-text"><strong>{obra.titulo}</strong><small>{obra.artista}, {obra.estilo}</small></span>
    <span className="highlight-badge">{badge}</span>
  </button></li>
}

const VISIVEIS = 5

function Lista<T>({ itens, rotulo, render }: { itens: T[]; rotulo: string; render: (item: T, index: number) => React.ReactNode }) {
  const [todas, setTodas] = useState(false)
  return <>
    <ol className="highlight-list" aria-label={rotulo}>{(todas ? itens : itens.slice(0, VISIVEIS)).map(render)}</ol>
    {itens.length > VISIVEIS && <button type="button" className="text-button list-more" aria-expanded={todas} onClick={() => setTodas(atual => !atual)}>{todas ? 'Ver menos' : `Ver todas (${itens.length})`}</button>}
  </>
}

/** Artistas com visualizações, do mais ao menos visto. O backend os entrega em ordem alfabética (percurso da AVL); só estes poucos itens são ordenados aqui. */
const maisVistos = (artistas: Artista[]) => [...artistas].sort((a, b) => b.visualizacoes - a.visualizacoes || a.nome.localeCompare(b.nome, 'pt-BR'))

/** As duas funcionalidades que vêm direto das estruturas: as listas com movimentação para o início e com transposição. */
export function Highlights({ destaques, onOpen }: { destaques: Destaques | null; onOpen: AoAbrir }) {
  const recentes = destaques?.recentes ?? [], ranking = destaques?.maisVistas ?? [], artistas = maisVistos(destaques?.artistasVistos ?? [])
  return <section id="destaques" className="content-section" aria-labelledby="highlights-title"><div className="section-heading"><h2 id="highlights-title">Estruturas em uso agora</h2><p className="section-description">Estas duas listas são mantidas pelas estruturas do backend. Toda obra aberta vai para o início da lista de recentes e ganha uma visualização no ranking por transposição.</p></div>
    <div className="highlights">
      <div className="data-panel"><div className="panel-head"><h3><History aria-hidden />Vistas recentemente</h3><p><span className="structure-tag">Lista encadeada</span> A obra aberta vai para o início; a vista há mais tempo fica no fim.</p></div>
        {recentes.length === 0 ? <p className="panel-note">Nenhuma obra aberta ainda.</p> : <Lista itens={recentes} rotulo="Vistas recentemente" render={(obra, index) => <HighlightItem key={obra.id} obra={obra} badge={index === 0 ? 'mais recente' : `${index + 1}ª`} onOpen={onOpen} />} />}
      </div>
      <div className="data-panel"><div className="panel-head"><h3><Flame aria-hidden />Mais vistas</h3><p><span className="structure-tag">Lista encadeada</span> A obra sobe uma posição quando passa a ter mais visualizações que a anterior.</p></div>
        {ranking.length === 0 ? <p className="panel-note">O ranking começa vazio e cresce conforme as obras são abertas.</p> : <Lista itens={ranking} rotulo="Mais vistas" render={item => <HighlightItem key={item.obra.id} obra={item.obra} badge={plural(item.visualizacoes, 'visualização', 'visualizações')} onOpen={onOpen} />} />}
      </div>
      <div className="data-panel"><div className="panel-head"><h3><Palette aria-hidden />Artistas mais vistos</h3><p><span className="structure-tag">Árvore AVL</span> Cada nó soma as visualizações das obras do artista.</p></div>
        {artistas.length === 0 ? <p className="panel-note">Os artistas aparecem aqui quando uma de suas obras é aberta.</p> : <Lista itens={artistas} rotulo="Artistas mais vistos" render={(artista, index) => <li key={artista.nome} className="artist-row"><span className="artist-rank" aria-hidden>{index + 1}</span><span className="highlight-text"><strong>{artista.nome}</strong><small>{plural(artista.quantidadeObras, 'obra', 'obras')}</small></span><span className="highlight-badge">{plural(artista.visualizacoes, 'visualização', 'visualizações')}</span></li>} />}
      </div>
    </div>
  </section>
}
