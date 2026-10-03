import type { SyntheticEvent } from 'react'

/** O placeholder é servido pela Vercel ou pelo frontend incorporado ao JAR. */
export function imageFallback(event: SyntheticEvent<HTMLImageElement>) {
  const imagem = event.currentTarget
  if (imagem.getAttribute('src') === '/imagem-indisponivel.svg') return
  imagem.src = '/imagem-indisponivel.svg'
  imagem.alt = 'Imagem indisponível'
}
