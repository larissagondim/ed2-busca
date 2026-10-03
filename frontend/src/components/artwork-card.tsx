import { useEffect, useRef, useState } from 'react'
import { Maximize2, RotateCcw, Search } from 'lucide-react'
import type { Obra } from '@/api'
import { Button } from '@/components/ui/button-1'
import { vars } from '@/lib/utils'

export type AoAbrir = (obra: Obra, trigger: HTMLButtonElement) => void
type CardActions = { onFlip: (obra: Obra) => void; onZoom: AoAbrir; onSearch: (obra: Obra) => void }

export function ArtworkCard({ obra, index, flipped, onFlip, onZoom, onSearch }: { obra: Obra; index: number; flipped: boolean } & CardActions) {
  const [loaded, setLoaded] = useState(false)
  const frontRef = useRef<HTMLButtonElement>(null), backRef = useRef<HTMLButtonElement>(null), shown = useRef(flipped)
  // Ao virar, o foco acompanha a face visível; na montagem nada é focado.
  useEffect(() => { if (shown.current === flipped) return; shown.current = flipped; (flipped ? backRef : frontRef).current?.focus({ preventScroll: true }) }, [flipped])
  return <article className={flipped ? 'art-card is-flipped' : 'art-card'} style={vars({ '--i': index })}>
    <div className="art-flip">
      <div className="art-face art-front" aria-hidden={flipped} inert={flipped}>
        <div className="art-frame"><img className={loaded ? 'art-image is-loaded' : 'art-image'} src={`/api/imagens/${obra.id}/miniatura`} alt={`Miniatura de ${obra.titulo}`} loading="lazy" onLoad={() => setLoaded(true)} onError={event => { event.currentTarget.hidden = true }} /><span className="image-fallback">Imagem indisponível</span></div>
        <div className="art-label">
          <h3>{obra.titulo}</h3>
          <p className="art-style">{obra.estilo}</p>
          <p className="metadata"><span>ID {obra.id}</span></p>
          <button ref={frontRef} className="art-open" onClick={() => onFlip(obra)}>Ver detalhes</button>
        </div>
      </div>
      <div className="art-face art-back" aria-hidden={!flipped} inert={!flipped}>
        <button ref={backRef} className="art-turn" aria-label={`Virar ${obra.titulo} de volta`} onClick={() => onFlip(obra)}><RotateCcw /></button>
        <p className="art-style">{obra.estilo}</p>
        <h3>{obra.titulo}</h3>
        <dl><div><dt>Artista</dt><dd>{obra.artista}</dd></div><div><dt>ID interno</dt><dd>{obra.id}</dd></div><div><dt>Código original</dt><dd>{obra.codigoAcervo}</dd></div></dl>
        <div className="art-back-actions">
          <Button size="sm" onClick={() => onSearch(obra)}><Search />Buscar esta obra</Button>
          <Button size="sm" variant="outline" onClick={event => onZoom(obra, event.currentTarget)}><Maximize2 />Ampliar imagem</Button>
        </div>
      </div>
    </div>
  </article>
}

export function CatalogSkeleton() {
  return <div className="art-grid" role="status"><span className="sr-only">Carregando obras…</span>{Array.from({ length: 8 }, (_, index) => <div key={index} className="art-card skeleton" style={vars({ '--i': index })} aria-hidden><div className="art-frame" /><div className="art-label"><i /><i /></div></div>)}</div>
}
