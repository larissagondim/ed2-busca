import { createContext, useCallback, useContext, useEffect, useState } from 'react'

export type Rota = '/' | '/buscar' | '/estruturas' | '/acervo' | '/museu' | '/sobre'

const ROTAS: Rota[] = ['/', '/buscar', '/estruturas', '/acervo', '/museu', '/sobre']
/** Endereços antigos (página única) continuam funcionando. */
const ANTIGAS: Record<string, Rota> = { '/catalogo': '/acervo', '/resumo': '/buscar' }

export const TITULOS: Record<Rota, string> = { '/': 'Catálogo WikiArt', '/buscar': 'Buscar uma obra', '/estruturas': 'Estruturas de dados', '/acervo': 'Acervo', '/museu': 'Museu do acervo', '/sobre': 'Sobre o projeto' }

export function resolver(caminho: string): Rota {
  const limpo = caminho.replace(/\/+$/, '') || '/'
  return ANTIGAS[limpo] ?? (ROTAS.includes(limpo as Rota) ? limpo as Rota : '/')
}

type Navegar = (destino: string) => void
const Contexto = createContext<{ rota: Rota; busca: URLSearchParams; navegar: Navegar }>({ rota: '/', busca: new URLSearchParams(), navegar: () => undefined })

/** Roteador mínimo sobre a History API: o SpaController devolve o index.html para estes caminhos. */
export function useRoteador() {
  const ler = () => ({ rota: resolver(window.location.pathname), busca: new URLSearchParams(window.location.search) })
  const [local, setLocal] = useState(ler)
  useEffect(() => {
    const voltar = () => setLocal(ler())
    window.addEventListener('popstate', voltar)
    return () => window.removeEventListener('popstate', voltar)
  }, [])
  const navegar = useCallback<Navegar>(destino => {
    if (destino !== window.location.pathname + window.location.search + window.location.hash) window.history.pushState(null, '', destino)
    setLocal(ler())
    // Com âncora, rola até a seção depois que a página nova renderiza; sem âncora, volta ao topo.
    const ancora = destino.split('#')[1]
    if (!ancora) { window.scrollTo({ top: 0 }); return }
    requestAnimationFrame(() => requestAnimationFrame(() => document.getElementById(ancora)?.scrollIntoView({ behavior: 'smooth', block: 'start' })))
  }, [])
  return { ...local, navegar }
}

export const RotaProvider = Contexto.Provider
export const useRota = () => useContext(Contexto)
