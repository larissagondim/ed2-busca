import { type CSSProperties, type KeyboardEvent, type PointerEvent, type ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, DoorOpen, Gauge, Map as MapIcon, Pause, Play, RefreshCw, RotateCcw, ScanSearch, SkipForward } from 'lucide-react'
import { api, type Comparacao, type Obra, type Periodo } from '@/api'
import { Button } from '@/components/ui/button-1'
import { OBRAS_POR_PAREDE, type Sala, agruparPorAla, montarSalas } from '@/lib/museum'
import { type ListState, type Run, alturas, arvoreBalanceada, profundidades, simularEm } from '@/lib/search-steps'
import { ESTRATEGIAS } from '@/lib/strategies'

type Direcao = 'entrada' | 'frente' | 'tras' | 'parede'
type AoAbrir = (obra: Obra, trigger: HTMLButtonElement) => void
type Saida = { chave: string; sala: Sala; conteudo: ReactNode; direcao: Direcao }
const vars = (values: Record<string, string | number>) => values as CSSProperties
/** Ordem visual na parede: a obra principal no centro, as menores nas pontas. */
const PENDURA = [3, 1, 0, 2, 4]
const TAMANHO = ['grande', 'media', 'media', 'pequena', 'pequena']
const PASSO_MS = 1000

/** Colunas da parede de busca; acompanha a largura da tela. */
function useColunas() {
  const consulta = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(max-width: 720px)') : null
  const [estreita, setEstreita] = useState(() => consulta?.matches ?? false)
  useEffect(() => {
    if (!consulta) return
    const mudar = (event: MediaQueryListEvent) => setEstreita(event.matches)
    consulta.addEventListener('change', mudar)
    return () => consulta.removeEventListener('change', mudar)
  }, [consulta])
  return estreita ? 6 : 12
}

function Peca({ obra, ordem, onOpen }: { obra: Obra; ordem: number; onOpen: AoAbrir }) {
  const [carregada, setCarregada] = useState(false)
  return <li className={`museum-piece is-${TAMANHO[ordem]}`} style={vars({ '--i': ordem })}>
    <span className="museum-spot" aria-hidden><i /></span>
    <button className="museum-artwork" onClick={event => onOpen(obra, event.currentTarget)} aria-label={`Ver ${obra.titulo}, de ${obra.artista}`}>
      <span className="museum-frame"><img className={carregada ? 'is-loaded' : undefined} src={`/api/imagens/${obra.id}/miniatura`} alt="" onLoad={() => setCarregada(true)} onError={event => { event.currentTarget.hidden = true }} /></span>
      <span className="museum-label" aria-hidden><strong>{obra.titulo}</strong>{obra.artista}</span>
    </button>
  </li>
}

function Parede({ pecas, titulo, onOpen }: { pecas: Obra[]; titulo: string; onOpen: AoAbrir }) {
  return <ul className="museum-hang" aria-label={`Obras da sala ${titulo}`}>{PENDURA.filter(ordem => ordem < pecas.length).map(ordem => <Peca key={pecas[ordem].id} obra={pecas[ordem]} ordem={ordem} onOpen={onOpen} />)}</ul>
}

/** Parede em estilo salão: todas as obras da sala, na ordem da estrutura usada pela busca. */
function ParedeDeBusca({ ordem, obras, colunas, run, passo, estado, tipo, alvo, onPick }: { ordem: number[]; obras: Map<number, Obra>; colunas: number; run: Run | null; passo: number; estado: ListState; tipo: string; alvo: number | null; onPick: (id: number) => void }) {
  const step = run?.steps[passo]
  const estrutura = ESTRATEGIAS.find(item => item.tipo === tipo)?.estrutura
  const chaves = useMemo(() => [...ordem].sort((a, b) => a - b), [ordem])
  const exibida = estrutura === 'lista' ? step?.order ?? ordem : chaves
  const torres = estrutura === 'saltos' ? alturas(chaves.length) : null
  const profundidade = estrutura === 'arvore' ? profundidades(step?.tree ?? estado.tree ?? arvoreBalanceada(chaves.length)) : null
  const dedo = tipo === 'DEDILHADA' ? (step ? step.finger ?? null : estado.finger) : null
  const apagada = (pos: number) => {
    if (!step) return false
    if (step.low !== undefined && step.high !== undefined) return pos < step.low || pos > step.high
    if (step.visited) return step.visited.includes(pos)
    return step.cursor !== undefined && pos < step.cursor
  }
  const linhas = Math.ceil(exibida.length / colunas)
  return <div className="museum-salon" style={vars({ '--cols': colunas, '--rows': linhas })}>
    {step && step.probe !== null && <span className={step.result === 'found' ? 'museum-beam is-found' : 'museum-beam'} aria-hidden style={vars({ '--x': step.probe % colunas, '--y': Math.floor(step.probe / colunas) })}><i /></span>}
    <ul aria-label="Obras desta sala em ordem de busca">{chaves.map((id, index) => {
      const pos = exibida.indexOf(id), obra = obras.get(id)!
      const classes = ['museum-cell', apagada(pos) && 'is-off', step?.probe === pos && (step.result === 'found' ? 'is-found' : 'is-probe'), step?.cursor === pos && 'is-cursor', alvo === id && 'is-target'].filter(Boolean).join(' ')
      return <li key={id} className={classes} style={vars({ '--x': pos % colunas, '--y': Math.floor(pos / colunas), '--i': index })}>
        <button onClick={() => onPick(id)} aria-pressed={alvo === id} aria-label={`Procurar ${obra.titulo} (ID ${id}), posição ${pos + 1}`}>
          <span className="museum-cell-frame"><img src={`/api/imagens/${id}/miniatura`} alt="" loading="lazy" onError={event => { event.currentTarget.hidden = true }} /></span>
          <span className="museum-cell-id">{id}</span>
          {torres && <span className="museum-tower" aria-hidden>{Array.from({ length: torres[index] }, (_, nivel) => <i key={nivel} className={step?.probe === pos && step.level === nivel ? 'is-active' : undefined} />)}</span>}
          {profundidade && <span className="museum-depth" aria-hidden>{profundidade[index] === 0 ? 'raiz' : `prof. ${profundidade[index]}`}</span>}
          {dedo === pos && <span className="museum-finger" aria-hidden>dedo</span>}
        </button>
      </li>
    })}</ul>
  </div>
}

function Sala3D({ sala, direcao, saindo, children, onFim }: { sala: Sala; direcao: Direcao; saindo?: boolean; children: ReactNode; onFim?: () => void }) {
  return <div className={saindo ? 'museum-room is-leaving' : 'museum-room'} data-dir={direcao} onAnimationEnd={event => { if (event.target === event.currentTarget) onFim?.() }} aria-hidden={saindo || undefined} inert={saindo || undefined}>
    <div className="museum-ceiling" aria-hidden />
    <div className="museum-wall">
      <div className="museum-plaque"><p className="museum-wing">{sala.ala.nome}</p><h3>{sala.titulo}</h3><p className="museum-era">{sala.epoca}</p><p>{sala.texto}</p><p className="museum-count">{sala.quantidade.toLocaleString('pt-BR')} {sala.quantidade === 1 ? 'obra' : 'obras'} no acervo</p></div>
      {children}
    </div>
    <div className="museum-floor" aria-hidden><span className="museum-bench" /></div>
  </div>
}

export function Museum({ periodos, onOpen, onMeasured, onBuscar, cabecalho = true }: { periodos: Periodo[]; onOpen: AoAbrir; onMeasured?: (resultado: Comparacao) => void; onBuscar?: (id: number) => void; cabecalho?: boolean }) {
  const salas = useMemo(() => montarSalas(periodos), [periodos])
  const colunas = useColunas()
  const [entrou, setEntrou] = useState(false), [index, setIndex] = useState(0), [parede, setParede] = useState(0), [direcao, setDirecao] = useState<Direcao>('entrada')
  const [obras, setObras] = useState<Obra[] | null>(null), [erro, setErro] = useState(''), [planta, setPlanta] = useState(false), [saida, setSaida] = useState<Saida | null>(null), [passos, setPassos] = useState(0)
  const [buscando, setBuscando] = useState(false), [tipo, setTipo] = useState('BINARIA'), [alvo, setAlvo] = useState<number | null>(null)
  const [estados, setEstados] = useState<Record<string, ListState>>({}), [run, setRun] = useState<Run | null>(null), [passo, setPasso] = useState(0), [tocando, setTocando] = useState(false)
  const [medicao, setMedicao] = useState<{ texto: string; erro?: boolean } | null>(null), [medindo, setMedindo] = useState(false)
  const cache = useRef(new Map<string, Obra[]>()), pedido = useRef(0), palco = useRef<HTMLDivElement>(null)
  const sala = salas[index]
  const total = salas.reduce((soma, item) => soma + item.quantidade, 0)
  const paredes = Math.max(1, Math.ceil((obras?.length ?? 0) / OBRAS_POR_PAREDE))
  const pecas = (obras ?? []).slice(parede * OBRAS_POR_PAREDE, (parede + 1) * OBRAS_POR_PAREDE)
  const porId = useMemo(() => new Map((obras ?? []).map(obra => [obra.id, obra])), [obras])
  const chaves = useMemo(() => (obras ?? []).map(obra => obra.id).sort((a, b) => a - b), [obras])
  const estadoSala: ListState = (sala && estados[sala.slug]) ?? { order: chaves, finger: null }
  const step = run?.steps[passo]
  const terminou = !!run && passo === run.steps.length - 1
  const estrategia = ESTRATEGIAS.find(item => item.tipo === tipo)!

  function limparBusca() { setRun(null); setPasso(0); setTocando(false); setMedicao(null) }
  async function visitar(destino: number, sentido: Direcao) {
    const alvoSala = salas[destino]
    if (!alvoSala) return
    if (entrou && sala) setSaida({ chave: `${sala.slug}-${parede}-${passos}`, sala, conteudo, direcao: sentido })
    const atual = ++pedido.current
    setIndex(destino); setParede(0); setDirecao(sentido); setErro(''); setPlanta(false); setPassos(contagem => contagem + 1); setAlvo(null); limparBusca()
    const guardadas = cache.current.get(alvoSala.slug)
    if (guardadas) { setObras(guardadas); return }
    setObras(null)
    try {
      const pagina = await api.obras(alvoSala.slug, 0)
      cache.current.set(alvoSala.slug, pagina.conteudo)
      if (atual === pedido.current) setObras(pagina.conteudo)
    } catch (reason) {
      if (atual === pedido.current) setErro((reason as Error).message)
    }
  }
  function entrar() { setEntrou(true); void visitar(0, 'entrada') }
  const anterior = () => visitar((index - 1 + salas.length) % salas.length, 'tras')
  const proxima = () => visitar((index + 1) % salas.length, 'frente')
  function outraParede() { setDirecao('parede'); setPassos(contagem => contagem + 1); setParede(atual => (atual + 1) % paredes) }
  function teclas(event: KeyboardEvent<HTMLDivElement>) {
    if (!entrou || buscando) return
    if (event.key === 'ArrowRight') { event.preventDefault(); void proxima() }
    if (event.key === 'ArrowLeft') { event.preventDefault(); void anterior() }
  }
  /** Parallax: parede, obras e piso se deslocam em profundidades diferentes conforme o ponteiro. */
  function olhar(event: PointerEvent<HTMLDivElement>) {
    const caixa = event.currentTarget.getBoundingClientRect()
    palco.current?.style.setProperty('--mx', (((event.clientX - caixa.left) / caixa.width) * 2 - 1).toFixed(3))
    palco.current?.style.setProperty('--my', (((event.clientY - caixa.top) / caixa.height) * 2 - 1).toFixed(3))
  }
  function centralizar() { palco.current?.style.setProperty('--mx', '0'); palco.current?.style.setProperty('--my', '0') }

  // Reprodução automática: um passo por intervalo, como no explicador.
  function finalizar(atual: Run) {
    setTocando(false)
    if (sala) setEstados(anteriores => { const base = anteriores[sala.slug] ?? { order: chaves, finger: null }; return { ...anteriores, [sala.slug]: { order: atual.order ?? base.order, finger: atual.finger !== undefined ? atual.finger : base.finger, tree: atual.tree ?? base.tree } } })
  }
  function avancar() {
    if (!run) return
    const proximo = Math.min(passo + 1, run.steps.length - 1)
    setPasso(proximo)
    if (proximo === run.steps.length - 1) finalizar(run)
  }
  function iniciar(automatico: boolean) {
    if (alvo === null) return
    const novo = simularEm(tipo, chaves, alvo, estadoSala)
    setRun(novo); setPasso(0); setMedicao(null); setTocando(automatico && novo.steps.length > 1)
    if (novo.steps.length === 1) finalizar(novo)
  }
  useEffect(() => {
    if (!tocando || !run) return
    const timer = window.setTimeout(avancar, PASSO_MS)
    return () => window.clearTimeout(timer)
  })
  function escolherAlvo(id: number) { setAlvo(id); limparBusca() }
  function escolherTipo(novo: string) { setTipo(novo); limparBusca() }
  function restaurar() { if (sala) setEstados(anteriores => { const copia = { ...anteriores }; delete copia[sala.slug]; return copia }); limparBusca() }
  async function medir() {
    if (alvo === null) return
    setMedindo(true)
    try {
      const resultado = await api.comparar('ID', String(alvo), [tipo])
      const m = resultado.medicoes[0]
      setMedicao({ texto: `No acervo completo (${resultado.resumo.quantidadeObras.toLocaleString('pt-BR')} obras), a mesma busca fez ${m.comparacoes.toLocaleString('pt-BR')} ${m.comparacoes === 1 ? 'comparação' : 'comparações'} e ${m.reorganizacoes.toLocaleString('pt-BR')} ${m.reorganizacoes === 1 ? 'reorganização' : 'reorganizações'} em ${m.tempoMicros.toFixed(1)} µs.` })
      onMeasured?.(resultado)
    } catch (reason) {
      setMedicao({ texto: (reason as Error).message, erro: true })
    } finally { setMedindo(false) }
  }

  const reorganizada = estadoSala.order.some((id, pos) => id !== chaves[pos]) || estadoSala.finger !== null || !!estadoSala.tree
  const conteudo = erro ? <p className="museum-message" role="alert">{erro}</p>
    : !obras ? <p className="museum-message" role="status">Acendendo as luzes da sala…</p>
    : obras.length === 0 ? <p className="museum-message">Esta sala ainda está vazia.</p>
    : buscando ? <ParedeDeBusca ordem={estadoSala.order} obras={porId} colunas={colunas} run={run} passo={passo} estado={estadoSala} tipo={tipo} alvo={alvo} onPick={escolherAlvo} />
    : <Parede pecas={pecas} titulo={sala.titulo} onOpen={onOpen} />
  const ala = sala?.ala
  const obraAlvo = alvo !== null ? porId.get(alvo) : undefined

  return <section id="museu" className="content-section museum-section" aria-labelledby="museum-title">
    <div className={cabecalho ? 'section-heading' : 'sr-only'}><h2 id="museum-title">Museu do acervo</h2><p className="section-description">Percorra o acervo sala por sala, em ordem histórica, do Renascimento à arte contemporânea. Em cada sala, você também pode procurar uma obra com qualquer uma das buscas e ver o caminho que ela faz pela parede.</p></div>
    <div ref={palco} className={entrou ? 'museum is-inside' : 'museum'} onKeyDown={teclas} onPointerMove={olhar} onPointerLeave={centralizar} style={ala ? vars({ '--wall': ala.parede, '--wall-ink': ala.tinta, '--floor': ala.piso }) : undefined} data-frame={ala?.moldura} data-search={buscando || undefined}>
      <div className={`museum-camera walk-${passos % 2}`}>
        {saida && <Sala3D key={`saida-${saida.chave}`} sala={saida.sala} direcao={saida.direcao} saindo onFim={() => setSaida(null)}>{saida.conteudo}</Sala3D>}
        {entrou && sala && <Sala3D key={`${sala.slug}-${parede}-${passos}-${buscando}`} sala={sala} direcao={direcao}>{conteudo}</Sala3D>}
      </div>
      <div className={entrou ? 'museum-doors is-open' : 'museum-doors'} aria-hidden={entrou}>
        <span className="museum-door left" /><span className="museum-door right" />
        {!entrou && <div className="museum-entrance">
          <p className="museum-entrance-title">Museu do acervo WikiArt</p>
          <p>{salas.length} salas e {total.toLocaleString('pt-BR')} obras</p>
          <Button size="lg" onClick={entrar} disabled={salas.length === 0}><DoorOpen />Entrar no museu</Button>
        </div>}
      </div>
    </div>
    {entrou && sala && <>
      <div className="museum-nav">
        <Button variant="outline" onClick={anterior} aria-label={`Sala anterior: ${salas[(index - 1 + salas.length) % salas.length].titulo}`}><ChevronLeft />Sala anterior</Button>
        <p className="museum-where" aria-live="polite">Sala {index + 1} de {salas.length}: <strong>{sala.titulo}</strong>{!buscando && paredes > 1 && <span>Parede {parede + 1} de {paredes}</span>}</p>
        <div className="museum-nav-end">
          <Button variant={buscando ? 'primary' : 'outline'} aria-pressed={buscando} onClick={() => { setBuscando(atual => !atual); setPassos(contagem => contagem + 1); setDirecao('parede'); limparBusca() }} disabled={!obras?.length}><ScanSearch />Buscar nesta sala</Button>
          {!buscando && paredes > 1 && <Button variant="ghost" onClick={outraParede}><RefreshCw />Outra parede</Button>}
          <Button variant="ghost" onClick={() => setPlanta(aberta => !aberta)} aria-expanded={planta} aria-controls="museum-map"><MapIcon />Planta do museu</Button>
          <Button onClick={proxima} aria-label={`Próxima sala: ${salas[(index + 1) % salas.length].titulo}`}>Próxima sala<ChevronRight /></Button>
        </div>
      </div>
      {buscando && obras && obras.length > 0 && <div className="museum-search" role="region" aria-label="Busca nesta sala">
        <div className="museum-search-head">
          <p>As {obras.length} obras desta sala estão na parede em ordem de ID{estrategia.estrutura === 'lista' ? ', na ordem atual da lista encadeada' : ''}. Escolha a busca e clique na obra que ela deve procurar.</p>
          <div className="museum-strategies" role="radiogroup" aria-label="Busca aplicada">{ESTRATEGIAS.map(item => <button key={item.tipo} role="radio" aria-checked={item.tipo === tipo} className="chip" onClick={() => escolherTipo(item.tipo)} title={item.nome}>{item.curto}</button>)}</div>
        </div>
        <div className="museum-search-status">
          <p className="museum-target">{obraAlvo ? <>Procurando <strong>{obraAlvo.titulo}</strong> <span>ID {obraAlvo.id}</span></> : 'Clique numa obra da parede para escolher o alvo.'}</p>
          <p className="museum-counter" aria-label={`${step?.comparisons ?? 0} comparações nesta sala`}><strong key={step?.comparisons ?? 0}>{step?.comparisons ?? 0}</strong> comparações nesta sala</p>
        </div>
        <p className={step?.result ? `viz-note is-${step.result}` : 'viz-note'} aria-live="polite">{step?.note ?? `${estrategia.nome}: ${estrategia.descricao}`}</p>
        <div className="viz-controls">
          {tocando ? <Button onClick={() => setTocando(false)}><Pause />Pausar</Button>
            : <Button onClick={() => run && !terminou ? setTocando(true) : iniciar(true)} disabled={alvo === null}><Play />{run && !terminou ? 'Continuar' : 'Procurar'}</Button>}
          <Button variant="outline" onClick={() => run && !terminou ? avancar() : iniciar(false)} disabled={alvo === null || tocando}><SkipForward />Um passo</Button>
          {reorganizada && <Button variant="ghost" onClick={restaurar}><RotateCcw />Restaurar sala</Button>}
          {terminou && step?.result === 'found' && <Button className="viz-use" variant="outline" onClick={medir} disabled={medindo}><Gauge />{medindo ? 'Medindo…' : 'Medir no acervo completo'}</Button>}
          {terminou && step?.result === 'found' && onBuscar && alvo !== null && <Button variant="outline" onClick={() => onBuscar(alvo)}><ScanSearch />Comparar as nove buscas</Button>}
        </div>
        {medicao && <p className={medicao.erro ? 'museum-measure is-error' : 'museum-measure'} role={medicao.erro ? 'alert' : 'status'}>{medicao.texto}</p>}
      </div>}
      {planta && <nav id="museum-map" className="museum-map" aria-label="Planta do museu">
        {agruparPorAla(salas).map(grupo => <div key={grupo.ala.nome} className="museum-map-wing" style={vars({ '--wall': grupo.ala.parede, '--wall-ink': grupo.ala.tinta })}>
          <p>{grupo.ala.nome}</p>
          <ol>{grupo.salas.map(item => <li key={item.sala.slug}><button onClick={() => visitar(item.index, item.index > index ? 'frente' : 'tras')} aria-current={item.index === index ? 'location' : undefined}><span>{item.sala.titulo}</span><small>{item.sala.epoca}</small></button></li>)}</ol>
        </div>)}
      </nav>}
      {!buscando && <p className="museum-hint">Dica: use as setas ← e → do teclado para andar entre as salas.</p>}
    </>}
  </section>
}
