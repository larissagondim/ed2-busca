import { type CSSProperties, useEffect, useState } from 'react'
import { Pause, Play, RotateCcw, SkipForward } from 'lucide-react'
import { Link } from '@/components/link'
import { Button } from '@/components/ui/button-1'
import { ESTRATEGIAS } from '@/lib/strategies'
import { HEIGHTS, KEYS, type ListState, MISSING_KEY, type Run, type Step, type Tree, arvoreBalanceada, profundidades, simulate } from '@/lib/search-steps'

const STEP_MS = 1100
/** Abas agrupadas por estrutura, na mesma ordem do mapa de estruturas. */
const GRUPOS = ['lista', 'tabela', 'saltos', 'arvore'] as const
const ESTRUTURA = { lista: 'Lista encadeada', tabela: 'Tabela ordenada', saltos: 'Lista com saltos', arvore: 'Árvore afunilada' }
const initialLists = (): Record<string, ListState> => Object.fromEntries(ESTRATEGIAS.map(item => [item.tipo, { order: [...KEYS], finger: null }]))
const vars = (values: Record<string, string | number>) => values as CSSProperties

function mark(step: Step | undefined, index: number, level?: number) {
  if (!step || step.probe !== index || (level !== undefined && step.level !== level)) return ''
  return step.result === 'found' ? 'is-found' : 'is-probe'
}

/** Ponteiro e faixa ficam fora da lista para deslizar entre as posições. */
function Track({ step, children }: { step?: Step; children: React.ReactNode }) {
  const range = step?.low !== undefined && step.high !== undefined && step.low <= step.high
  return <div className="viz-track">
    {range && <span className="viz-range" aria-hidden style={vars({ '--lo': step.low!, '--hi': step.high! })} />}
    {step && step.probe !== null && <span className={`viz-pointer ${step.result === 'found' ? 'is-found' : ''}`} aria-hidden style={vars({ '--p': step.probe })} />}
    {children}
  </div>
}

function ListStage({ order, finger, step, target, onPick }: { order: number[]; finger: number | null; step?: Step; target: number; onPick: (key: number) => void }) {
  return <Track step={step}><ol className="viz-list">
    {KEYS.map(key => { const index = order.indexOf(key); return <li key={key} className={`viz-node ${mark(step, index)} ${step?.visited?.includes(index) ? 'is-out' : ''}`} style={vars({ '--x': index })}>
      <button type="button" onClick={() => onPick(key)} aria-label={`Procurar ${key}, posição ${index + 1}`} aria-pressed={key === target}>{key}</button>
      {finger === index && <span className="viz-finger" aria-hidden>dedo</span>}
    </li> })}
  </ol></Track>
}

function TableStage({ step, target, onPick }: { step?: Step; target: number; onPick: (key: number) => void }) {
  const out = (index: number) => step?.low !== undefined && step.high !== undefined && (index < step.low || index > step.high)
  return <Track step={step}><ol className="viz-table">
    {KEYS.map((key, index) => <li key={key} className={`viz-cell ${mark(step, index)} ${out(index) ? 'is-out' : ''}`}>
      <button type="button" onClick={() => onPick(key)} aria-label={`Procurar ${key}, posição ${index + 1}`} aria-pressed={key === target}>{key}</button><span className="viz-index" aria-hidden>{index + 1}</span>
    </li>)}
  </ol></Track>
}

function SkipStage({ step, target, onPick }: { step?: Step; target: number; onPick: (key: number) => void }) {
  const top = Math.max(...HEIGHTS)
  return <div className="viz-skip">
    {Array.from({ length: top }, (_, row) => top - 1 - row).map(level => <div key={level} className={step?.level === level ? 'viz-lane is-active' : 'viz-lane'}>
      <span className="viz-head">Nível {level + 1}</span>
      <ol>{KEYS.map((key, index) => <li key={key} className={HEIGHTS[index] > level ? `viz-tower ${mark(step, index, level)} ${step?.cursor === index ? 'is-cursor' : ''}` : 'viz-gap'}>
        {HEIGHTS[index] <= level ? null : level === 0 ? <button type="button" onClick={() => onPick(key)} aria-label={`Procurar ${key}`} aria-pressed={key === target}>{key}</button> : <span>{key}</span>}
      </li>)}</ol>
    </div>)}
  </div>
}

/** A rotação preserva a ordem das chaves: cada nó fica na sua coluna e só muda de profundidade. */
function TreeStage({ tree, step, target, onPick }: { tree: Tree; step?: Step; target: number; onPick: (key: number) => void }) {
  const depth = profundidades(tree)
  const rows = Math.max(...depth) + 1
  const edges = tree.left.flatMap((left, node) => [left, tree.right[node]].filter(child => child >= 0).map(child => [node, child]))
  return <div className="viz-tree" style={vars({ '--rows': rows })}>
    <svg className="viz-edges" viewBox={`0 0 ${KEYS.length} ${rows}`} preserveAspectRatio="none" aria-hidden>
      {edges.map(([from, to]) => <line key={`${from}-${to}`} x1={from + .5} y1={depth[from] + .5} x2={to + .5} y2={depth[to] + .5} />)}
    </svg>
    <ol>{KEYS.map((key, index) => <li key={key} className={`viz-node ${mark(step, index)}`} style={vars({ '--x': index, '--y': depth[index] })}>
      <button type="button" onClick={() => onPick(key)} aria-label={`Procurar ${key}, profundidade ${depth[index]}`} aria-pressed={key === target}>{key}</button>
    </li>)}</ol>
  </div>
}

const mesmaArvore = (a: Tree, b: Tree) => a.root === b.root && a.left.every((item, index) => item === b.left[index]) && a.right.every((item, index) => item === b.right[index])

export function SearchExplainer({ onUse, inicial }: { onUse: (tipo: string) => void; inicial?: string }) {
  const [tipo, setTipo] = useState(() => ESTRATEGIAS.some(item => item.tipo === inicial) ? inicial! : 'BINARIA')
  const [target, setTarget] = useState(KEYS[8])
  const [lists, setLists] = useState(initialLists)
  const [run, setRun] = useState<Run | null>(null)
  const [stepIndex, setStepIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const estrategia = ESTRATEGIAS.find(item => item.tipo === tipo)!
  const step = run?.steps[stepIndex]
  const finished = !!run && stepIndex === run.steps.length - 1

  function finish(current: Run) {
    setPlaying(false)
    if (current.order || current.finger !== undefined || current.tree) setLists(previous => ({ ...previous, [tipo]: { order: current.order ?? previous[tipo].order, finger: current.finger !== undefined ? current.finger : previous[tipo].finger, tree: current.tree ?? previous[tipo].tree } }))
  }
  function advance() {
    if (!run) return
    const next = Math.min(stepIndex + 1, run.steps.length - 1)
    setStepIndex(next)
    if (next === run.steps.length - 1) finish(run)
  }
  function start(autoplay: boolean) {
    const fresh = simulate(tipo, target, lists[tipo])
    setRun(fresh); setStepIndex(0); setPlaying(autoplay && fresh.steps.length > 1)
    if (fresh.steps.length === 1) finish(fresh)
  }
  function stop() { setRun(null); setStepIndex(0); setPlaying(false) }
  function choose(next: string) { setTipo(next); stop() }
  function pick(key: number) { setTarget(key); stop() }
  function restoreList() { setLists(previous => ({ ...previous, [tipo]: { order: [...KEYS], finger: null } })); stop() }
  const tree = step?.tree ?? lists[tipo].tree ?? arvoreBalanceada()

  useEffect(() => {
    if (!playing || !run) return
    const timer = window.setTimeout(advance, STEP_MS)
    return () => window.clearTimeout(timer)
  })

  const order = step?.order ?? lists[tipo].order
  const finger = tipo !== 'DEDILHADA' ? null : step ? step.finger ?? null : lists[tipo].finger
  const changed = lists[tipo].order.some((key, index) => key !== KEYS[index]) || lists[tipo].finger !== null || (!!lists[tipo].tree && !mesmaArvore(lists[tipo].tree!, arvoreBalanceada()))
  return <section id="como-funciona" className="content-section" aria-labelledby="explainer-title">
    <div className="section-heading"><h2 id="explainer-title">Como cada busca funciona</h2><p className="section-description">Escolha uma estratégia e uma chave, depois aperte reproduzir. A simulação segue o mesmo código Java da API e conta as comparações do mesmo jeito.</p></div>
    <div className="explainer">
      <div className="strategy-tabs" role="tablist" aria-label="Estratégias de busca">
        {GRUPOS.map(estrutura => <div key={estrutura} className="tab-cluster" role="presentation">
          <span className="tab-group" aria-hidden>{ESTRUTURA[estrutura]}</span>
          <div className="tab-row" role="presentation">{ESTRATEGIAS.filter(item => item.estrutura === estrutura).map(item => <button key={item.tipo} role="tab" id={`tab-${item.tipo}`} aria-selected={item.tipo === tipo} aria-controls="explainer-panel" onClick={() => choose(item.tipo)}>{item.curto}</button>)}</div>
        </div>)}
      </div>
      <div className="explainer-panel" id="explainer-panel" role="tabpanel" aria-labelledby={`tab-${tipo}`}>
        <div key={tipo} className="explainer-copy">
          <h3>{estrategia.nome}</h3>
          <p>{estrategia.descricao}</p>
          <ul className="facts"><li>{ESTRUTURA[estrategia.estrutura]}</li><li>Custo {estrategia.custo}</li><li>{estrategia.reorganiza ? estrategia.estrutura === 'arvore' ? 'Reorganiza a árvore' : 'Reorganiza a lista' : 'Não reorganiza'}</li></ul>
        </div>
        <div className="viz" data-structure={estrategia.estrutura}>
          <div className="viz-top">
            <p className="viz-target">Procurando <strong>{target}</strong><span>{KEYS.includes(target) ? 'Clique em outra chave para trocar' : 'Chave ausente do catálogo'}</span></p>
            <p className="viz-count" aria-label={`${step?.comparisons ?? 0} comparações`}><strong key={step?.comparisons ?? 0}>{step?.comparisons ?? 0}</strong> comparações</p>
          </div>
          <div className="viz-stage">
            {estrategia.estrutura === 'lista' ? <ListStage order={order} finger={finger} step={step} target={target} onPick={pick} />
              : estrategia.estrutura === 'tabela' ? <TableStage step={step} target={target} onPick={pick} />
              : estrategia.estrutura === 'arvore' ? <TreeStage tree={tree} step={step} target={target} onPick={pick} />
              : <SkipStage step={step} target={target} onPick={pick} />}
          </div>
          <p className={step?.result ? `viz-note is-${step.result}` : 'viz-note'} aria-live="polite">{step?.note ?? 'Aperte reproduzir para ver cada comparação.'}</p>
          <div className="viz-controls">
            {playing ? <Button variant="primary" onClick={() => setPlaying(false)}><Pause />Pausar</Button>
              : <Button variant="primary" onClick={() => run && !finished ? setPlaying(true) : start(true)}><Play />{run && !finished ? 'Continuar' : 'Reproduzir'}</Button>}
            <Button variant="outline" onClick={() => run && !finished ? advance() : start(false)} disabled={playing}><SkipForward />Um passo</Button>
            <Button variant="ghost" onClick={() => pick(MISSING_KEY)}>Procurar chave ausente</Button>
            {estrategia.estrutura === 'lista' && changed && <Button variant="ghost" onClick={restoreList}><RotateCcw />Restaurar lista</Button>}
            {estrategia.estrutura === 'arvore' && changed && <Button variant="ghost" onClick={restoreList}><RotateCcw />Restaurar árvore</Button>}
            <Button className="viz-use" variant="outline" onClick={() => onUse(tipo)}>Buscar uma obra com esta busca</Button>
          </div>
          {estrategia.reorganiza && <p className="viz-hint">A reorganização fica salva entre execuções: procure a mesma chave de novo e compare o número de comparações.</p>}
        </div>
      </div>
    </div>
    <p className="explainer-others">O projeto tem mais seis consultas que não procuram uma chave exata: por artista (chave secundária), piso, teto, intervalo, menor chave e maior chave. Elas ficam fora da comparação e podem ser usadas em <Link href="/buscar#outras-consultas">Outras consultas</Link>.</p>
  </section>
}
