import { type FormEvent, useEffect, useState } from 'react'
import { ArrowLeft, Search } from 'lucide-react'
import { api, type Artista, type Obra, type ObrasDoArtista, type PaginaArtistas } from '@/api'
import { ArtworkCard, CatalogSkeleton, type AoAbrir } from '@/components/artwork-card'
import { CatalogPagination } from '@/components/catalog-pagination'
import { Button } from '@/components/ui/button-1'
import { plural } from '@/lib/utils'

type Acoes = { flipped: number | null; onFlip: (obra: Obra) => void; onZoom: AoAbrir; onSearch: (obra: Obra) => void }

/** Resumo de um artista: posição alfabética, obras e visualizações agregadas, todos lidos do nó da AVL. */
function ResumoArtista({ artista }: { artista: Artista }) {
  return <>{plural(artista.quantidadeObras, 'obra', 'obras')} · {plural(artista.visualizacoes, 'visualização', 'visualizações')}</>
}

/**
 * Artistas em ordem alfabética, paginados pela Árvore AVL com estatística de ordem: a página k vem de
 * uma descida pelos tamanhos das subárvores, sem ordenar nada. Ao abrir um artista, a lista de obras
 * vem do nó dele, junto com as comparações e a profundidade da busca na árvore.
 */
export function ArtistsBrowser({ flipped, onFlip, onZoom, onSearch }: Acoes) {
  const [pagina, setPagina] = useState(0), [lista, setLista] = useState<PaginaArtistas | null>(null), [carregandoLista, setCarregandoLista] = useState(true)
  const [nome, setNome] = useState(''), [digitado, setDigitado] = useState(''), [paginaObras, setPaginaObras] = useState(0)
  const [aberto, setAberto] = useState<ObrasDoArtista | null>(null), [carregandoObras, setCarregandoObras] = useState(false), [erro, setErro] = useState('')

  useEffect(() => {
    let ativo = true
    async function carregar() {
      await Promise.resolve()
      if (!ativo) return
      setCarregandoLista(true)
      try { const resultado = await api.artistas(pagina); if (ativo) setLista(resultado) }
      catch (motivo) { if (ativo) setErro((motivo as Error).message) }
      finally { if (ativo) setCarregandoLista(false) }
    }
    void carregar()
    return () => { ativo = false }
  }, [pagina])

  useEffect(() => {
    if (!nome) return
    let ativo = true
    async function carregar() {
      await Promise.resolve()
      if (!ativo) return
      setCarregandoObras(true); setErro('')
      try { const resultado = await api.obrasDoArtista(nome, paginaObras); if (ativo) setAberto(resultado) }
      catch (motivo) { if (ativo) { setAberto(null); setErro((motivo as Error).message) } }
      finally { if (ativo) setCarregandoObras(false) }
    }
    void carregar()
    return () => { ativo = false }
  }, [nome, paginaObras])

  function abrir(artista: string) { setErro(''); setPaginaObras(0); setNome(artista) }
  function voltar() { setNome(''); setAberto(null); setErro('') }
  function buscar(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (digitado.trim()) abrir(digitado.trim()) }
  const mostrandoArtista = nome !== ''

  return <>
    <form className="artists-search" role="search" aria-label="Buscar artista" onSubmit={buscar}>
      <label className="search-field">Nome do artista<input value={digitado} onChange={event => setDigitado(event.target.value)} placeholder="Ex.: Claude Monet ou joan miro" autoComplete="off" /></label>
      <Button type="submit" variant="outline" size="lg" disabled={!digitado.trim()}><Search />Buscar artista</Button>
    </form>
    {erro && <div className="error-message" role="alert">{erro}</div>}
    {mostrandoArtista ? <section className="artist-open" aria-label="Obras do artista">
      <Button type="button" variant="ghost" onClick={voltar}><ArrowLeft />Voltar à lista de artistas</Button>
      {carregandoObras && !aberto ? <CatalogSkeleton /> : aberto && <>
        <div className="artist-title"><h2>{aberto.artista.nome}</h2><p><ResumoArtista artista={aberto.artista} /> · posição alfabética {(aberto.artista.posicao + 1).toLocaleString('pt-BR')}</p></div>
        <p className="avl-note">Encontrado em {plural(aberto.comparacoes, 'comparação', 'comparações')}, profundidade {aberto.profundidade} na AVL.</p>
        <div className="art-grid" key={`${aberto.artista.nome}-${aberto.pagina}`}>{aberto.conteudo.map((obra, index) => <ArtworkCard key={obra.id} obra={obra} index={index} flipped={flipped === obra.id} onFlip={onFlip} onZoom={onZoom} onSearch={onSearch} />)}</div>
        <CatalogPagination current={paginaObras} total={aberto.totalPaginas} onChange={setPaginaObras} />
      </>}
    </section> : <section aria-label="Lista de artistas">
      {lista && <p className="filters-note">{plural(lista.totalElementos, 'artista', 'artistas')} em ordem alfabética, paginados pela Árvore AVL.</p>}
      {carregandoLista && !lista ? <p className="panel-note" role="status">Carregando artistas…</p> : <ol className="artist-list" aria-label="Artistas em ordem alfabética">
        {lista?.conteudo.map(artista => <li key={artista.nome}><button type="button" className="artist-item" onClick={() => abrir(artista.nome)} aria-label={`Abrir obras de ${artista.nome}`}>
          <span className="artist-rank" aria-hidden>{(artista.posicao + 1).toLocaleString('pt-BR')}</span>
          <span className="artist-name"><strong>{artista.nome}</strong><small><ResumoArtista artista={artista} /></small></span>
        </button></li>)}
      </ol>}
      {lista && <CatalogPagination current={pagina} total={lista.totalPaginas} onChange={setPagina} />}
    </section>}
  </>
}
