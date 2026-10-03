import { useEffect, useRef } from 'react'
import { Search, X } from 'lucide-react'
import type { Obra } from '@/api'
import { Button } from '@/components/ui/button-1'

export function DetailsDrawer({ obra, onClose, returnFocus, onSearch }: { obra: Obra | null; onClose: () => void; returnFocus: React.RefObject<HTMLButtonElement | null>; onSearch?: (obra: Obra) => void }) {
  const closeRef = useRef<HTMLButtonElement>(null)
  useEffect(() => { if (!obra) return; const trigger = returnFocus.current; closeRef.current?.focus(); const key = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }; document.addEventListener('keydown', key); document.body.classList.add('drawer-open'); return () => { document.removeEventListener('keydown', key); document.body.classList.remove('drawer-open'); trigger?.focus({ preventScroll: true }) } }, [obra, onClose, returnFocus])
  if (!obra) return null
  return <div className="drawer-layer" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}><aside key={obra.id} className="details-drawer" role="dialog" aria-modal="true" aria-labelledby="drawer-title">
    <Button ref={closeRef} className="drawer-close" variant="ghost" mode="icon" size="icon" aria-label="Fechar detalhes" onClick={onClose}><X /></Button>
    <div className="drawer-image"><img src={`/api/imagens/${obra.id}/original`} alt={`Obra ${obra.titulo}`} onError={event => { event.currentTarget.hidden = true }} /><span className="image-fallback">Imagem indisponível</span></div>
    <p className="drawer-style">{obra.estilo}</p><h2 id="drawer-title">{obra.titulo}</h2>
    <dl><div><dt>ID interno</dt><dd>{obra.id}</dd></div><div><dt>Código original</dt><dd>{obra.codigoAcervo}</dd></div><div><dt>Artista</dt><dd>{obra.artista}</dd></div></dl>
    <div className="drawer-actions">
      {onSearch && <Button size="lg" onClick={() => onSearch(obra)}><Search />Buscar esta obra</Button>}
      <Button asChild size="lg" variant={onSearch ? 'outline' : 'primary'}><a href={`/api/imagens/${obra.id}/original`} target="_blank" rel="noreferrer">Abrir imagem original</a></Button>
    </div>
  </aside></div>
}
