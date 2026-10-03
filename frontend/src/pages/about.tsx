import { Link } from '@/components/link'
import { PageHeader } from './page-header'

/** Contexto do trabalho e como ler as métricas; o conteúdo segue o README e a configuração do backend. */
export function AboutPage() {
  return <>
    <div className="content-section page-intro">
      <PageHeader titulo="Sobre o projeto">Um trabalho de Estrutura de Dados II: o acervo do WikiArt guardado inteiramente em estruturas implementadas pelo grupo, para comparar buscas na prática.</PageHeader>
    </div>
    <section className="content-section about" aria-labelledby="about-data">
      <div className="about-block">
        <h2 id="about-data">De onde vêm os dados</h2>
        <p>São 81.444 obras de 27 estilos do dataset WikiArt, com título e artista. As imagens continuam no disco: durante as buscas o catálogo guarda só o caminho de cada uma, para não gastar memória nem contaminar as medições com leitura de arquivos. As miniaturas são geradas quando pedidas, com no máximo 480 px no maior lado, e ficam em cache.</p>
      </div>
      <div className="about-block">
        <h2>Como o catálogo é guardado</h2>
        <p>Nada de <code>HashMap</code> ou <code>TreeMap</code>: tudo fica em estruturas próprias.</p>
        <ul className="about-list">
          <li><strong>Árvore afunilada</strong> é o índice por ID, guarda as obras vistas recentemente e organiza os períodos.</li>
          <li><strong>Lista com saltos</strong> indexa o catálogo por ID, código e título, e pagina o acervo.</li>
          <li><strong>Lista encadeada</strong> sustenta as buscas sequenciais e o ranking de mais vistas.</li>
          <li><strong>Tabela ordenada</strong> dá acesso direto por posição às buscas binária, por interpolação e de Fibonacci.</li>
        </ul>
        <p><Link href="/estruturas">Ver as estruturas e as buscas passo a passo</Link></p>
      </div>
      <div className="about-block">
        <h2>Como ler as métricas</h2>
        <dl className="about-metrics">
          <div><dt>Comparações</dt><dd>Quantas vezes a busca comparou a chave procurada com uma chave do catálogo. É a medida estável e a melhor para comparar estratégias.</dd></div>
          <div><dt>Reorganizações</dt><dd>Mudanças na estrutura durante a busca: trocas da transposição, movimentos para o início e rotações da árvore afunilada.</dd></div>
          <div><dt>Tempo (µs)</dt><dd>Tempo decorrido da busca. Varia entre execuções por causa do aquecimento da JVM e do cache, então serve como ordem de grandeza.</dd></div>
          <div><dt>Eficácia</dt><dd>Porcentagem das buscas da sessão que encontraram a obra pedida.</dd></div>
        </dl>
      </div>
      <div className="about-block">
        <h2>Sessão e período</h2>
        <p>Cada visitante tem uma sessão própria, com um motor de buscas e um resumo acumulado. As buscas que reorganizam a lista recebem cópias independentes, para uma não favorecer a outra. Trocar o período ou reiniciar a sessão recria as estruturas e zera o resumo; sessões paradas expiram em 30 minutos.</p>
      </div>
      <div className="about-block">
        <h2>Nove buscas e seis consultas</h2>
        <p>O projeto implementa 15 métodos. Nove recebem a mesma chave e procuram exatamente a obra pedida, por isso são comparados lado a lado. Os outros seis respondem a perguntas diferentes, como piso, teto ou todas as obras de um artista, e ficam em <Link href="/buscar#outras-consultas">Outras consultas</Link>.</p>
      </div>
    </section>
  </>
}
