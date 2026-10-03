import { useState } from 'react'
import { BookOpen, Landmark, Menu, Moon, Network, Search, Sun, X } from 'lucide-react'
import { Button } from '@/components/ui/button-1'
import { Link } from '@/components/link'
import { useTema } from '@/lib/theme'

export function SiteHeader() {
  const [open, setOpen] = useState(false)
  const fechar = () => setOpen(false)
  const { escuro, alternar } = useTema()
  return <header className="site-header"><div className="nav-shell">
    <Link className="brand" href="/" onClick={fechar}><span className="brand-mark" aria-hidden><i /><i /><i /></span>Catálogo WikiArt</Link>
    <nav className={open ? 'nav-links is-open' : 'nav-links'} aria-label="Navegação principal">
      <Link className="nav-search" href="/buscar" onClick={fechar}><Search />Buscar<kbd aria-hidden>/</kbd></Link>
      <Link href="/estruturas" onClick={fechar}><Network />Estruturas</Link>
      <Link href="/acervo" onClick={fechar}><BookOpen />Acervo</Link>
      <Link href="/museu" onClick={fechar}><Landmark />Museu</Link>
    </nav>
    <div className="header-tools">
    <Button className="theme-button" variant="ghost" mode="icon" size="icon" aria-label={escuro ? 'Ativar modo claro' : 'Ativar modo escuro'} title={escuro ? 'Modo claro' : 'Modo escuro'} onClick={alternar}>{escuro ? <Sun /> : <Moon />}</Button>
    <Button className="menu-button" variant="ghost" mode="icon" size="icon" aria-label={open ? 'Fechar menu' : 'Abrir menu'} aria-expanded={open} onClick={() => setOpen(value => !value)}>{open ? <X /> : <Menu />}</Button>
    </div>
  </div><div className="scroll-progress" aria-hidden /></header>
}
