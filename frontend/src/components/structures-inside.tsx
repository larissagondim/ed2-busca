import { useEffect, useState } from 'react'
import { api, type Estruturas } from '@/api'
import { plural } from '@/lib/utils'

const numero = (valor: number) => valor.toLocaleString('pt-BR')
const decimal = (valor: number) => valor.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

function Numero({ valor, rotulo, destaque = false }: { valor: string; rotulo: string; destaque?: boolean }) {
  return <div className={destaque ? 'big-stat is-highlight' : 'big-stat'}><span className="big-number">{valor}</span><span className="big-label">{rotulo}</span></div>
}

/** Números reais das estruturas, grandes o bastante para serem lidos num vídeo: AVL x ABB e as rotações por tipo. */
export function StructuresInside() {
  const [dados, setDados] = useState<Estruturas | null>(null), [erro, setErro] = useState('')
  useEffect(() => {
    let ativo = true
    api.estruturas().then(resultado => { if (ativo) setDados(resultado) }).catch(motivo => { if (ativo) setErro((motivo as Error).message) })
    return () => { ativo = false }
  }, [])
  const arvores = dados?.arvores
  const rotacoes = arvores?.rotacoes
  const total = rotacoes ? rotacoes.simplesEsquerda + rotacoes.simplesDireita + rotacoes.duplaEsquerdaDireita + rotacoes.duplaDireitaEsquerda : 0
  return <section id="estruturas-por-dentro" className="content-section" aria-labelledby="inside-title">
    <div className="section-heading"><h2 id="inside-title">Estruturas por dentro</h2><p className="section-description">Números reais do catálogo carregado: a Árvore AVL de artistas contra uma árvore binária de busca comum que recebeu os mesmos artistas na mesma ordem.</p></div>
    {erro && <div className="error-message" role="alert">{erro}</div>}
    {!dados && !erro && <p className="panel-note" role="status">Carregando métricas…</p>}
    {arvores && rotacoes && dados && <div className="inside-grid">
      <div className="data-panel inside-panel" role="group" aria-label="Altura da AVL contra a ABB">
        <div className="panel-head"><h3>Altura: AVL x ABB</h3><p>{plural(arvores.artistas, 'artista', 'artistas')} nas duas árvores. Altura mínima possível: {numero(arvores.alturaMinimaTeorica)}.</p></div>
        <div className="big-row">
          <Numero valor={numero(arvores.alturaAvl)} rotulo="níveis na AVL" destaque />
          <Numero valor={numero(arvores.alturaAbb)} rotulo="níveis na ABB sem balanceamento" />
        </div>
        <p className="inside-note">O CSV traz os artistas em ordem alfabética dentro de cada estilo; sem rotações, a ABB cresce em fileira. A AVL fica a {numero(arvores.alturaAvl - arvores.alturaMinimaTeorica)} {arvores.alturaAvl - arvores.alturaMinimaTeorica === 1 ? 'nível' : 'níveis'} do mínimo.</p>
      </div>
      <div className="data-panel inside-panel" role="group" aria-label="Comparações médias de busca por artista">
        <div className="panel-head"><h3>Comparações por busca de artista</h3><p>Média sobre todos os artistas. A sequencial percorre as {numero(arvores.obras)} obras.</p></div>
        <div className="big-row">
          <Numero valor={decimal(arvores.comparacoesMediasAvl)} rotulo="na AVL" destaque />
          <Numero valor={decimal(arvores.comparacoesMediasAbb)} rotulo="na ABB" />
          <Numero valor={numero(arvores.obras)} rotulo="na busca sequencial" />
        </div>
      </div>
      <div className="data-panel inside-panel inside-wide" role="group" aria-label="Rotações da AVL por tipo">
        <div className="panel-head"><h3>Rotações para construir a AVL</h3><p>{plural(total, 'rotação', 'rotações')} no total. Uma rotação dupla conta uma vez.</p></div>
        <div className="big-row">
          <Numero valor={numero(rotacoes.simplesEsquerda)} rotulo="simples à esquerda" />
          <Numero valor={numero(rotacoes.simplesDireita)} rotulo="simples à direita" />
          <Numero valor={numero(rotacoes.duplaEsquerdaDireita)} rotulo="dupla esquerda-direita" />
          <Numero valor={numero(rotacoes.duplaDireitaEsquerda)} rotulo="dupla direita-esquerda" />
        </div>
      </div>
      <div className="data-panel inside-panel inside-wide" role="group" aria-label="Demais estruturas">
        <div className="panel-head"><h3>Listas com saltos e listas de destaque</h3><p>Tamanho e níveis em uso agora.</p></div>
        <table className="inside-table"><thead><tr><th scope="col">Estrutura</th><th scope="col">Elementos</th><th scope="col">Níveis</th></tr></thead>
          <tbody>
            {dados.skipLists.map(item => <tr key={item.nome}><th scope="row">Lista com saltos: {item.nome}</th><td>{numero(item.tamanho)}</td><td>{numero(item.niveis)}</td></tr>)}
            <tr><th scope="row">Vistas recentemente (capacidade {numero(dados.capacidadeRecentes)})</th><td>{numero(dados.recentes)}</td><td>—</td></tr>
            <tr><th scope="row">Mais vistas</th><td>{numero(dados.maisVistas)}</td><td>—</td></tr>
          </tbody>
        </table>
      </div>
    </div>}
  </section>
}
