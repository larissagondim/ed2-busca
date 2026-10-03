import { type FormEvent, useState } from 'react'
import { Search } from 'lucide-react'
import type { Destaques, Obra } from '@/api'
import type { AoAbrir } from '@/components/artwork-card'
import { Highlights } from '@/components/highlights'
import { StructureMap } from '@/components/structure-map'
import { Link } from '@/components/link'
import { vars } from '@/lib/utils'

function SalonWall({ obras }: { obras: Obra[] }) {
  const frames = Array.from({ length: 6 }, (_, index) => obras[index])
  return <div className="salon" aria-hidden>
    {frames.map((obra, index) => <figure key={obra?.id ?? `vazio-${index}`} className={`salon-frame f${index}`} style={vars({ '--i': index })}>
      {obra && <img src={`/api/imagens/${obra.id}/miniatura`} alt="" onError={event => { event.currentTarget.hidden = true }} />}
    </figure>)}
  </div>
}

function Hero({ obras, total, onQuickSearch }: { obras: Obra[]; total: number | null; onQuickSearch: (valor: string) => void }) {
  const [valor, setValor] = useState('')
  const enviar = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); if (valor.trim()) onQuickSearch(valor.trim()) }
  return <section id="inicio" className="hero" aria-labelledby="hero-title">
    <div className="hero-copy">
      <h1 id="hero-title" tabIndex={-1}><span className="line"><span>Encontre uma obra.</span></span>{' '}<span className="line"><span>Compare as buscas.</span></span></h1>
      <p className="hero-lede">O acervo do WikiArt{total !== null ? `, com ${total.toLocaleString('pt-BR')} pinturas,` : ''} pesquisado por oito buscas exatas sobre três estruturas de dados. Digite uma obra e veja quantas comparações cada busca faz até encontrá-la.</p>
      <form className="quick-search" role="search" aria-label="Busca rápida" onSubmit={enviar}>
        <label htmlFor="quick-search">ID ou código da obra</label>
        <div className="quick-row">
          <Search aria-hidden />
          <input id="quick-search" value={valor} onChange={event => setValor(event.target.value)} placeholder="Ex.: 67 ou aaron-siskind_chicago-1951" autoComplete="off" />
          <button type="submit">Buscar</button>
        </div>
        <p>Roda as oito buscas de uma vez. Prefere escolher? <Link href="/acervo">Abra o acervo</Link> ou <Link href="/museu">visite o museu</Link>.</p>
      </form>
    </div>
    <SalonWall obras={obras} />
  </section>
}

export function HomePage({ obras, total, destaques, onQuickSearch, onOpen }: { obras: Obra[]; total: number | null; destaques: Destaques | null; onQuickSearch: (valor: string) => void; onOpen: AoAbrir }) {
  return <>
    <Hero obras={obras} total={total} onQuickSearch={onQuickSearch} />
    <StructureMap titulo="O que está por trás de cada busca" descricao="Cada uma das oito buscas roda sobre uma destas estruturas, e três delas também mantêm partes do próprio site. Clique numa busca para vê-la passo a passo." />
    <Highlights destaques={destaques} onOpen={onOpen} />
  </>
}
