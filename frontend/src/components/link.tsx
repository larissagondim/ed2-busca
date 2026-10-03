import type { AnchorHTMLAttributes } from 'react'
import { resolver, useRota } from '@/lib/router'

/** Link de verdade (abre em nova aba, copia endereço), mas navega sem recarregar. */
export function Link({ href, onClick, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  const { rota, navegar } = useRota()
  return <a href={href} aria-current={resolver(href.split('?')[0]) === rota && !href.includes('#') ? 'page' : undefined} onClick={event => {
    onClick?.(event)
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    event.preventDefault(); navegar(href)
  }} {...props} />
}
