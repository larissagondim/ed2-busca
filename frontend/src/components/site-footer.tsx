import { Link } from '@/components/link'
import { ESTRATEGIAS, type Estrutura } from '@/lib/strategies'

const GRUPOS: Array<[Estrutura, string]> = [['lista', 'Lista encadeada'], ['tabela', 'Tabela ordenada'], ['saltos', 'Lista com saltos']]

/** Rodapé como mapa do site: as oito buscas agrupadas pela estrutura que usam, a um clique de qualquer página. */
export function SiteFooter() {
  return <footer className="site-footer">
    <div className="footer-shell">
      <div className="footer-intro">
        <p className="footer-brand"><span className="brand-mark" aria-hidden><i /><i /><i /></span>Catálogo WikiArt</p>
        <p>Oito buscas exatas sobre três estruturas de dados, aplicadas ao acervo do WikiArt.</p>
        <Link className="footer-search" href="/buscar">Buscar uma obra</Link>
        <p className="footer-hint">Atalho: tecla <kbd>/</kbd> em qualquer página.</p>
      </div>
      <nav className="footer-searches" aria-label="As oito buscas por estrutura">
        {GRUPOS.map(([estrutura, nome]) => <div key={estrutura}>
          <p>{nome}</p>
          <ul>{ESTRATEGIAS.filter(item => item.estrutura === estrutura).map(item => <li key={item.tipo}><Link href={`/estruturas?busca=${item.tipo}#como-funciona`}>{item.curto}</Link></li>)}</ul>
        </div>)}
      </nav>
      <nav className="footer-pages" aria-label="Páginas">
        <p>Visitar</p>
        <ul><li><Link href="/">Início</Link></li><li><Link href="/estruturas">Estruturas de dados</Link></li><li><Link href="/acervo">Acervo</Link></li><li><Link href="/museu">Museu</Link></li><li><Link href="/sobre">Sobre o projeto</Link></li></ul>
      </nav>
    </div>
  </footer>
}
