import { type FormEvent, useState } from 'react'
import { api, type Consulta } from '@/api'
import type { AoAbrir } from '@/components/artwork-card'
import { HighlightItem } from '@/components/highlights'
import { Button } from '@/components/ui/button-1'
import { CONSULTAS } from '@/lib/strategies'
import { plural } from '@/lib/utils'

const ESTRUTURA = { lista: 'Lista encadeada', tabela: 'Tabela ordenada', saltos: 'Lista com saltos' }

/** As seis consultas do projeto que não procuram uma chave exata e por isso ficam fora da comparação. */
export function OtherQueries({ onOpen }: { onOpen: AoAbrir }) {
  const [tipo, setTipo] = useState('PISO'), [inicio, setInicio] = useState(''), [fim, setFim] = useState(''), [artista, setArtista] = useState('')
  const [resultado, setResultado] = useState<Consulta | null>(null), [erro, setErro] = useState(''), [rodando, setRodando] = useState(false)
  const consulta = CONSULTAS.find(item => item.tipo === tipo)!
  function escolher(novo: string) { setTipo(novo); setResultado(null); setErro('') }
  async function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setErro(''); setRodando(true)
    try {
      const pedido = consulta.entrada === 'artista' ? { tipo, artista: artista.trim() } : consulta.entrada === 'id' ? { tipo, inicio: Number(inicio) } : consulta.entrada === 'intervalo' ? { tipo, inicio: Number(inicio), fim: Number(fim) } : { tipo }
      setResultado(await api.consultar(pedido))
    } catch (reason) { setResultado(null); setErro((reason as Error).message) } finally { setRodando(false) }
  }
  return <section id="outras-consultas" className="content-section" aria-labelledby="queries-title">
    <div className="section-heading"><h2 id="queries-title">Outras consultas</h2><p className="section-description">Seis consultas do projeto que não procuram uma chave exata: devolvem um vizinho, um extremo ou várias obras. Ficam fora da comparação porque respondem a perguntas diferentes.</p></div>
    <form className="data-panel queries-panel" onSubmit={enviar}>
      <div className="queries-types" role="radiogroup" aria-label="Consulta">{CONSULTAS.map(item => <button key={item.tipo} type="button" role="radio" aria-checked={item.tipo === tipo} className="chip" onClick={() => escolher(item.tipo)}>{item.curto}</button>)}</div>
      <p className="queries-desc"><span className="structure-tag">{ESTRUTURA[consulta.estrutura]}</span>{consulta.descricao}</p>
      <div className="queries-fields">
        {consulta.entrada === 'artista' && <label className="search-field">Artista<input value={artista} onChange={event => setArtista(event.target.value)} required placeholder="Ex.: Claude Monet" /></label>}
        {consulta.entrada === 'id' && <label>ID<input value={inicio} onChange={event => setInicio(event.target.value)} required inputMode="numeric" pattern="[0-9]+" placeholder="Ex.: 67" /></label>}
        {consulta.entrada === 'intervalo' && <><label>Do ID<input value={inicio} onChange={event => setInicio(event.target.value)} required inputMode="numeric" pattern="[0-9]+" placeholder="Ex.: 10" /></label><label>Até o ID<input value={fim} onChange={event => setFim(event.target.value)} required inputMode="numeric" pattern="[0-9]+" placeholder="Ex.: 20" /></label></>}
        {consulta.entrada === 'nenhuma' && <p className="queries-none">Esta consulta não precisa de chave.</p>}
        <Button type="submit" variant="outline" size="lg" disabled={rodando} aria-busy={rodando}>{rodando ? 'Consultando…' : 'Consultar'}</Button>
      </div>
    </form>
    {erro && <div className="error-message" role="alert">{erro}</div>}
    {resultado && <div className="data-panel queries-result" aria-live="polite">
      <div className="panel-head"><h3>{resultado.nome}</h3><p>{plural(resultado.total, 'obra encontrada', 'obras encontradas')} com {plural(resultado.comparacoes, 'comparação', 'comparações')}{resultado.total > resultado.obras.length ? `. Mostrando as ${resultado.obras.length} primeiras` : ''}.</p></div>
      {resultado.obras.length === 0 ? <p className="panel-note">Nenhuma obra atende a esta consulta no período da sessão.</p>
        : <ol className="highlight-list queries-list" aria-label={`Resultado: ${resultado.nome}`}>{resultado.obras.map(obra => <HighlightItem key={obra.id} obra={obra} badge={`ID ${obra.id}`} onOpen={onOpen} />)}</ol>}
    </div>}
  </section>
}
