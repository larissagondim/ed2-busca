import type { FormEvent, RefObject } from 'react'
import { Check, RotateCcw, Search } from 'lucide-react'
import type { Periodo } from '@/api'
import { Link } from '@/components/link'
import { Button } from '@/components/ui/button-1'
import { ESTRATEGIAS, type Estrutura, TODAS } from '@/lib/strategies'

export type TipoEntrada = 'ID' | 'CODIGO'

type Props = {
  periods: Periodo[]; period: string; onPeriod: (slug: string) => void; onReset: () => void
  type: TipoEntrada; onType: (tipo: TipoEntrada) => void; value: string; onValue: (valor: string) => void
  strategies: string[]; onStrategies: (tipos: string[]) => void
  comparing: boolean; flash: number; onSubmit: (event: FormEvent<HTMLFormElement>) => void
  inputRef: RefObject<HTMLInputElement | null>; submitRef: RefObject<HTMLButtonElement | null>
}

/** Mesma ordem e nomes do mapa de estruturas: os chips mostram onde cada busca roda. */
const GRUPOS: Array<[Estrutura, string]> = [['lista', 'Lista encadeada'], ['tabela', 'Tabela ordenada'], ['saltos', 'Lista com saltos'], ['arvore', 'Árvore AVL']]

export function SearchPanel({ periods, period, onPeriod, onReset, type, onType, value, onValue, strategies, onStrategies, comparing, flash, onSubmit, inputRef, submitRef }: Props) {
  const alternar = (tipo: string) => onStrategies(TODAS.filter(item => item === tipo ? !strategies.includes(item) : strategies.includes(item)))
  return <form id="busca" className="search-panel" onSubmit={onSubmit}>
    {flash > 0 && <span key={flash} className="search-flash" aria-hidden />}
    <div className="search-column">
      <div className="search-step"><span className="step-number" aria-hidden>1</span><div className="search-step-body"><p className="step-title">Onde procurar?</p>
        <label>Período da sessão<select value={period} onChange={event => onPeriod(event.target.value)}><option value="">Todos os períodos</option>{periods.map(item => <option key={item.slug} value={item.slug}>{item.nome} ({item.quantidade})</option>)}</select></label>
        <p className="step-hint">As buscas rodam só sobre as obras deste período. <button type="button" className="text-button" onClick={onReset}><RotateCcw aria-hidden />Reiniciar sessão</button></p>
      </div></div>
      <div className="search-step"><span className="step-number" aria-hidden>2</span><div className="search-step-body"><p className="step-title">Qual obra?</p>
        <div className="search-form"><label>Tipo<select value={type} onChange={event => onType(event.target.value as TipoEntrada)}><option value="ID">ID interno</option><option value="CODIGO">Código original</option></select></label><label className="search-field">Busca<input ref={inputRef} value={value} onChange={event => onValue(event.target.value)} required placeholder={type === 'ID' ? 'Ex.: 67' : 'Ex.: aaron-siskind_chicago-1951'} /></label></div>
        <p className="step-hint">Não sabe o ID? <Link href="/acervo">Escolha uma obra no acervo</Link>.</p>
      </div></div>
    </div>
    <div className="search-step" role="group" aria-labelledby="strategies-title"><span className="step-number" aria-hidden>3</span><div className="search-step-body"><p className="step-title" id="strategies-title">Quais buscas aplicar? <span>{strategies.length} de {TODAS.length}</span></p>
      <div className="chip-groups">{GRUPOS.map(([estrutura, nome]) => <div key={estrutura} className="chip-group">
        <p className="chip-group-label">{nome}</p>
        <div className="chips">{ESTRATEGIAS.filter(item => item.estrutura === estrutura).map(item => <button key={item.tipo} type="button" className="chip" aria-pressed={strategies.includes(item.tipo)} title={item.nome} onClick={() => alternar(item.tipo)}><span className="chip-check" aria-hidden><Check /></span>{item.curto}</button>)}</div>
      </div>)}</div>
      <div className="chip-actions"><button type="button" onClick={() => onStrategies(TODAS)} disabled={strategies.length === TODAS.length}>Marcar todas</button><button type="button" onClick={() => onStrategies([])} disabled={strategies.length === 0}>Desmarcar todas</button><Link href="/estruturas#como-funciona">Como cada uma funciona?</Link></div>
    </div></div>
    <div className="search-submit">
      {strategies.length === 0 && <p>Marque ao menos uma busca.</p>}
      <Button ref={submitRef} type="submit" size="lg" className="search-go" disabled={comparing || strategies.length === 0} aria-busy={comparing}><Search />{comparing ? 'Comparando…' : strategies.length === 1 ? 'Executar busca' : 'Comparar buscas'}</Button>
    </div>
  </form>
}
