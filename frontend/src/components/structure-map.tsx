import type { Estrutura } from '@/lib/strategies'
import { ESTRATEGIAS } from '@/lib/strategies'
import { Link } from '@/components/link'

type Ficha = { id: Estrutura; nome: string; resumo: string; noSite: string; onde: { href: string; rotulo: string } }

/** O papel de cada estrutura no projeto, conferido em CatalogoService e MotorDeBuscas. */
const ESTRUTURAS: Ficha[] = [
  { id: 'lista', nome: 'Lista encadeada', resumo: 'Nós ligados em sequência: para chegar a um, é preciso passar por todos os anteriores.', noSite: 'Mantém as obras “Vistas recentemente”, por movimentação para o início, e o ranking “Mais vistas”, por transposição.', onde: { href: '/#destaques', rotulo: 'Ver as listas' } },
  { id: 'tabela', nome: 'Tabela ordenada', resumo: 'Vetor ordenado por ID, com acesso direto a qualquer posição.', noSite: 'Sustenta as buscas que dividem o intervalo a cada comparação.', onde: { href: '/buscar', rotulo: 'Comparar na busca' } },
  { id: 'saltos', nome: 'Lista com saltos', resumo: 'Lista ordenada com níveis expressos por cima, para pular trechos inteiros.', noSite: 'É o índice por ID e indexa o catálogo também por código e título: pagina o acervo, converte código em ID e lista os períodos em ordem.', onde: { href: '/acervo', rotulo: 'Abrir o acervo' } },
  { id: 'arvore', nome: 'Árvore AVL', resumo: 'Árvore binária de busca que se rebalanceia por rotações: a altura fica perto de log₂ n mesmo com chaves inseridas em ordem.', noSite: 'É a estrutura hierárquica do projeto: indexa as obras por ID (uma das oito buscas) e os artistas em ordem alfabética, com visualizações somadas por artista.', onde: { href: '/artistas', rotulo: 'Ver os artistas' } },
]

function Diagrama({ id }: { id: Estrutura }) {
  if (id === 'lista') return <svg viewBox="0 0 200 64" className="mini-diagram" aria-hidden>
    {[0, 1, 2, 3, 4].map(n => <g key={n}><rect x={8 + n * 40} y={22} width={24} height={20} rx={4} />{n < 4 && <path d={`M${33 + n * 40} 32h13m-4 -3l4 3l-4 3`} />}</g>)}
    <circle className="probe probe-lista" cx={20} cy={14} r={4} />
  </svg>
  if (id === 'tabela') return <svg viewBox="0 0 200 64" className="mini-diagram" aria-hidden>
    {Array.from({ length: 8 }, (_, n) => <rect key={n} x={4 + n * 24} y={22} width={24} height={22} />)}
    <rect className="probe probe-tabela" x={4} y={22} width={24} height={22} />
  </svg>
  if (id === 'arvore') return <svg viewBox="0 0 200 64" className="mini-diagram" aria-hidden>
    <path className="lane" d="M100 14L60 34M100 14L140 34M60 34L40 54M60 34L80 54M140 34L120 54M140 34L160 54" />
    {[[100, 14], [60, 34], [140, 34], [40, 54], [80, 54], [120, 54], [160, 54]].map(([x, y]) => <rect key={`${x}-${y}`} x={x - 9} y={y - 7} width={18} height={14} rx={4} />)}
    <circle className="probe probe-saltos" cx={100} cy={14} r={4} />
  </svg>
  return <svg viewBox="0 0 200 64" className="mini-diagram" aria-hidden>
    {[0, 1, 2].map(nivel => <g key={nivel}><path d={`M8 ${12 + nivel * 20}H192`} className="lane" />{Array.from({ length: 8 }, (_, n) => n % (4 >> nivel) === 0 && <rect key={n} x={8 + n * 23} y={6 + nivel * 20} width={14} height={12} rx={3} />)}</g>)}
    <circle className="probe probe-saltos" cx={15} cy={12} r={4} />
  </svg>
}

export function StructureMap({ titulo = 'As quatro estruturas', descricao, nivel = 2 }: { titulo?: string; descricao: string; nivel?: 2 | 3 }) {
  const Titulo = nivel === 2 ? 'h2' : 'h3'
  return <section id="estruturas-mapa" className="content-section" aria-labelledby="structures-title">
    <div className="section-heading"><Titulo id="structures-title">{titulo}</Titulo><p className="section-description">{descricao}</p></div>
    <ol className="structure-map">
      {ESTRUTURAS.map((ficha, index) => <li key={ficha.id} className="structure-card" data-structure={ficha.id} style={{ '--i': index } as React.CSSProperties}>
        <div className="structure-screen"><Diagrama id={ficha.id} /></div>
        <div className="structure-body">
          <h3>{ficha.nome}</h3>
          <p>{ficha.resumo}</p>
          <p className="structure-label">Buscas que usam</p>
          <ul className="structure-searches">{ESTRATEGIAS.filter(item => item.estrutura === ficha.id).map(item => <li key={item.tipo}><Link href={`/estruturas?busca=${item.tipo}#como-funciona`}>{item.curto}</Link></li>)}</ul>
          <p className="structure-label">No site</p>
          <p>{ficha.noSite}</p>
          <Link className="structure-link" href={ficha.onde.href}>{ficha.onde.rotulo}</Link>
        </div>
      </li>)}
    </ol>
  </section>
}
