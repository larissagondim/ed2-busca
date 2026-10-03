import type { ReactNode } from 'react'

/** Cabeçalho das páginas internas; o h1 recebe o foco quando a página muda. */
export function PageHeader({ titulo, children }: { titulo: string; children: ReactNode }) {
  return <header className="page-header">
    <h1 tabIndex={-1}>{titulo}</h1>
    <p>{children}</p>
  </header>
}
