import { useEffect, useState } from 'react'

type Tema = 'light' | 'dark'
const CHAVE = 'tema'

function salvo(): Tema | null {
  try { const valor = localStorage.getItem(CHAVE); return valor === 'light' || valor === 'dark' ? valor : null } catch { return null }
}
const sistemaEscuro = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-color-scheme: dark)').matches

/** Tema atual: a escolha salva vence; sem escolha, segue o sistema (o CSS cuida disso sozinho). */
export function useTema() {
  const [escolha, setEscolha] = useState<Tema | null>(salvo)
  const [sistema, setSistema] = useState(sistemaEscuro)
  useEffect(() => {
    const consulta = window.matchMedia?.('(prefers-color-scheme: dark)')
    if (!consulta) return
    const mudar = (event: MediaQueryListEvent) => setSistema(event.matches)
    consulta.addEventListener('change', mudar)
    return () => consulta.removeEventListener('change', mudar)
  }, [])
  useEffect(() => {
    if (escolha) document.documentElement.dataset.theme = escolha
    else delete document.documentElement.dataset.theme
  }, [escolha])
  const escuro = escolha ? escolha === 'dark' : sistema
  function alternar() {
    const proximo: Tema = escuro ? 'light' : 'dark'
    setEscolha(proximo)
    try { localStorage.setItem(CHAVE, proximo) } catch { /* sem armazenamento: vale só nesta visita */ }
  }
  return { escuro, alternar }
}
