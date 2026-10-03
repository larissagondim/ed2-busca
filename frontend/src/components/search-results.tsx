import { useState } from 'react'
import { BarChart3, Maximize2, PlayCircle, Search } from 'lucide-react'
import type { Comparacao, Medicao, Resumo } from '@/api'
import type { AoAbrir } from '@/components/artwork-card'
import { Link } from '@/components/link'
import { Button } from '@/components/ui/button-1'
import { ESTRATEGIAS, type Estrutura } from '@/lib/strategies'
import { plural, vars } from '@/lib/utils'

const ESTRUTURA = { lista: 'Lista encadeada', tabela: 'Tabela ordenada', saltos: 'Lista com saltos' }
const estruturaDe = (tipo: string) => { const item = ESTRATEGIAS.find(estrategia => estrategia.tipo === tipo); return item ? ESTRUTURA[item.estrutura] : '' }

function Meter({ value, max, best = false }: { value: number; max: number; best?: boolean }) {
  return <span className={best ? 'meter is-best' : 'meter'} aria-hidden><span style={vars({ '--w': max > 0 ? value / max : 0 })} /></span>
}

const ORDEM: Estrutura[] = ['lista', 'tabela', 'saltos']

/** Melhor busca de cada estrutura nesta comparação. Barras em escala logarítmica: 1 e 25.000 comparações cabem no mesmo eixo. */
function PorEstrutura({ medicoes }: { medicoes: Medicao[] }) {
  const grupos = ORDEM.map(estrutura => {
    const daEstrutura = medicoes.filter(item => ESTRATEGIAS.find(estrategia => estrategia.tipo === item.tipo)?.estrutura === estrutura)
    const melhor = [...daEstrutura].sort((a, b) => a.comparacoes - b.comparacoes)[0]
    return melhor && { estrutura, melhor, curto: ESTRATEGIAS.find(item => item.tipo === melhor.tipo)!.curto }
  }).filter(Boolean) as Array<{ estrutura: Estrutura; melhor: Medicao; curto: string }>
  if (grupos.length < 2) return null
  const escala = Math.log10(1 + Math.max(...grupos.map(item => item.melhor.comparacoes)))
  const minimo = Math.min(...grupos.map(item => item.melhor.comparacoes))
  return <div className="by-structure" role="list" aria-label="Melhor busca por estrutura">
    {grupos.map(({ estrutura, melhor, curto }, index) => <div key={estrutura} role="listitem" className={melhor.comparacoes === minimo ? 'by-structure-item is-best' : 'by-structure-item'} style={vars({ '--i': index })}>
      <p className="by-structure-name">{ESTRUTURA[estrutura]}</p>
      <p className="by-structure-count"><strong>{melhor.comparacoes.toLocaleString('pt-BR')}</strong> {melhor.comparacoes === 1 ? 'comparação' : 'comparações'}</p>
      <span className="meter" aria-hidden><span style={vars({ '--w': escala > 0 ? Math.max(.03, Math.log10(1 + melhor.comparacoes) / escala) : 0 })} /></span>
      <p className="by-structure-best">melhor: {curto}</p>
    </div>)}
  </div>
}

function Estrategia({ tipo, nome }: { tipo: string; nome: string }) {
  return <span className="strategy-cell">{nome}<small>{estruturaDe(tipo)}</small></span>
}

export function SearchResults({ comparison, onZoom }: { comparison: Comparacao | null; onZoom: AoAbrir }) {
  const rows = comparison ? [...comparison.medicoes].sort((a, b) => a.comparacoes - b.comparacoes) : []
  const max = Math.max(1, ...rows.map(item => item.comparacoes))
  const best = rows[0]?.comparacoes
  return <section id="resultado" className="content-section" aria-labelledby="comparison-title"><div className="section-heading"><h2 id="comparison-title">Resultado das buscas</h2><p className="section-description">Comparações, reorganizações e tempo de cada busca escolhida, da que precisou de menos comparações para a que precisou de mais.</p></div>
    {!comparison ? <div className="empty-state"><Search /><p>Informe um ID ou código acima e escolha as buscas. O resultado aparece aqui.</p></div> : <div key={comparison.obra.id + ':' + comparison.resumo.estrategias.reduce((total, item) => total + item.buscas, 0)} className="data-panel">
      <div className="result-head">
        <span className="result-thumb" aria-hidden><img src={`/api/imagens/${comparison.obra.id}/miniatura`} alt="" onError={event => { event.currentTarget.hidden = true }} /></span>
        <div><h3>{comparison.obra.titulo}</h3><p>{comparison.obra.artista}, {comparison.obra.estilo}. ID {comparison.obra.id}, código {comparison.obra.codigoAcervo}.</p><p>{plural(rows.length, 'busca executada', 'buscas executadas')} sobre {plural(comparison.resumo.quantidadeObras, 'obra', 'obras')}.</p></div>
        <Button variant="outline" onClick={event => onZoom(comparison.obra, event.currentTarget)}><Maximize2 />Ampliar imagem</Button>
      </div>
      <PorEstrutura medicoes={comparison.medicoes} />
      <div className="table-wrap"><table className="results-table"><thead><tr><th>Estratégia</th><th className="col-meter">Comparações</th><th>Reorganizações</th><th>Tempo (µs)</th><th><span className="sr-only">Passo a passo</span></th></tr></thead><tbody>{rows.map((item, index) => <tr key={item.tipo} style={vars({ '--i': index })} className={item.comparacoes === best ? 'is-best' : undefined}>
        <td><Estrategia tipo={item.tipo} nome={item.nome} />{!item.encontrou && <span className="miss"> não encontrou</span>}</td>
        <td className="col-meter" data-label="Comparações"><span className="meter-cell"><span className="num">{item.comparacoes}</span><Meter value={item.comparacoes} max={max} best={item.comparacoes === best} /></span></td>
        <td className="num" data-label="Reorganizações">{item.reorganizacoes}</td><td className="num" data-label="Tempo (µs)">{item.tempoMicros.toFixed(2)}</td>
        <td><Link className="step-link" href={`/estruturas?busca=${item.tipo}#como-funciona`} aria-label={`Ver ${item.nome} passo a passo`} title="Ver passo a passo"><PlayCircle aria-hidden /></Link></td>
      </tr>)}</tbody></table></div>
    </div>}
  </section>
}

const posicao = (tipo: string) => { const item = ESTRATEGIAS.find(estrategia => estrategia.tipo === tipo); return item ? ORDEM.indexOf(item.estrutura) * 10 + ESTRATEGIAS.indexOf(item) : 99 }

export function SummaryPanel({ summary, periodo }: { summary: Resumo | null; periodo: string }) {
  const [verAgora, setVerAgora] = useState(false)
  const linhas = [...(summary?.estrategias ?? [])].sort((a, b) => posicao(a.tipo) - posicao(b.tipo))
  const max = Math.max(1, ...linhas.map(item => item.mediaComparacoes))
  const rodadas = Math.max(0, ...linhas.map(item => item.buscas))
  const usadas = linhas.filter(item => item.buscas > 0).length
  return <section id="resumo" className="content-section" aria-labelledby="summary-title"><div className="section-heading"><h2 id="summary-title">Resumo da sessão</h2><p className="section-description">Médias acumuladas das buscas desde que a sessão começou ou o período foi trocado.</p></div>
    {!summary ? <div className="empty-state"><BarChart3 /><p>As métricas aparecem depois da primeira busca.</p></div> : <div className="data-panel">
      <div className="panel-head"><h3>{plural(summary.quantidadeObras, 'obra', 'obras')} no subconjunto</h3><p>{periodo || 'Todos os períodos'}</p></div>
      {rodadas === 0 ? <p className="panel-note">Nenhuma busca nesta sessão ainda.</p>
        : rodadas < 2 && !verAgora ? <div className="panel-note summary-wait"><p>As médias ficam úteis a partir da segunda busca. Até agora: uma busca com {plural(usadas, 'estratégia', 'estratégias')}, já mostrada no resultado acima.</p><Button variant="ghost" size="sm" onClick={() => setVerAgora(true)}>Ver médias mesmo assim</Button></div>
        : <div className="table-wrap"><table className="results-table"><thead><tr><th>Estratégia</th><th>Buscas</th><th>Eficácia</th><th className="col-meter">Média de comparações</th></tr></thead><tbody>{linhas.map((item, index) => <tr key={item.tipo} style={vars({ '--i': index })}>
        <td><Estrategia tipo={item.tipo} nome={item.nome} /></td><td className="num" data-label="Buscas">{item.buscas}</td><td className="num" data-label="Eficácia">{item.buscas ? `${item.eficaciaPercentual.toFixed(1)}%` : '—'}</td>
        <td className="col-meter" data-label="Média de comparações"><span className="meter-cell"><span className="num">{item.buscas ? item.mediaComparacoes.toFixed(1) : '—'}</span><Meter value={item.mediaComparacoes} max={max} /></span></td>
      </tr>)}</tbody></table></div>}
    </div>}
  </section>
}
