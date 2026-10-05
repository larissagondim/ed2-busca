package br.edu.ufpb.wikiart.service;

import br.edu.ufpb.wikiart.model.Obra;
import br.edu.ufpb.wikiart.search.BuscaDedilhada;
import br.edu.ufpb.wikiart.search.BuscasEncadeadas;
import br.edu.ufpb.wikiart.search.BuscasOrdenadas;
import br.edu.ufpb.wikiart.search.ResultadoBusca;
import br.edu.ufpb.wikiart.search.TipoBusca;
import br.edu.ufpb.wikiart.structure.ArvoreAvlArtistas;
import br.edu.ufpb.wikiart.structure.ArvoreAvlObras;
import br.edu.ufpb.wikiart.structure.ListaComSaltos;
import br.edu.ufpb.wikiart.structure.ListaEncadeadaObras;
import br.edu.ufpb.wikiart.structure.TabelaOrdenadaObras;

import java.util.Collection;
import java.util.List;

/**
 * Fachada usada pela CLI, pela API e pelos experimentos. Cada heurística mutável
 * recebe sua própria lista para que uma não contamine o resultado da outra.
 */
public final class MotorDeBuscas {
    private static final long SEMENTE_SKIP_LIST = 20260911L;

    private final ListaEncadeadaObras sequencial;
    private final ListaEncadeadaObras moverParaInicio;
    private final ListaEncadeadaObras transposicao;
    private final ListaEncadeadaObras dedilhada;
    private final TabelaOrdenadaObras ordenada;
    private final ListaComSaltos<Long, Obra> listaComSaltos;
    private final ArvoreAvlArtistas arvoreArtistas;
    private final ArvoreAvlObras arvoreObras;
    private final BuscaDedilhada buscaDedilhada = new BuscaDedilhada();

    public MotorDeBuscas(Collection<Obra> obras) {
        ListaEncadeadaObras base = new ListaEncadeadaObras();
        obras.forEach(base::adicionar);
        sequencial = base.copiar();
        moverParaInicio = base.copiar();
        transposicao = base.copiar();
        dedilhada = base.copiar();
        List<Obra> copiaEstavel = base.comoLista();
        listaComSaltos = new ListaComSaltos<>(SEMENTE_SKIP_LIST);
        arvoreArtistas = new ArvoreAvlArtistas();
        arvoreObras = new ArvoreAvlObras();
        for (Obra obra : copiaEstavel) {
            listaComSaltos.inserir(obra.id(), obra);
            arvoreArtistas.inserir(obra);
            arvoreObras.inserir(obra);
        }
        // O nível 0 da Skip List já está ordenado por ID: nenhuma ordenação extra.
        ordenada = new TabelaOrdenadaObras(listaComSaltos.paraLista());
    }

    public ResultadoBusca sequencial(long id) {
        return BuscasEncadeadas.sequencial(sequencial, id);
    }

    public ResultadoBusca moverParaInicio(long id) {
        return BuscasEncadeadas.moverParaInicio(moverParaInicio, id);
    }

    public ResultadoBusca transposicao(long id) {
        return BuscasEncadeadas.transposicao(transposicao, id);
    }

    public ResultadoBusca binaria(long id) {
        return BuscasOrdenadas.binaria(ordenada, id);
    }

    public ResultadoBusca interpolacao(long id) {
        return BuscasOrdenadas.interpolacao(ordenada, id);
    }

    public ResultadoBusca listaComSaltos(long id) {
        ListaComSaltos.Busca<Obra> busca = listaComSaltos.buscar(id);
        return new ResultadoBusca(TipoBusca.LISTA_COM_SALTOS,
                busca.encontrou() ? List.of(busca.valor()) : List.of(), busca.comparacoes(), 0);
    }

    /** Busca por ID na Árvore AVL (estrutura hierárquica): O(log n), com profundidade do nó. */
    public ResultadoBusca arvoreAvl(long id) {
        ArvoreAvlObras.Busca busca = arvoreObras.buscar(id);
        return new ResultadoBusca(TipoBusca.ARVORE_AVL,
                busca.encontrou() ? List.of(busca.obra()) : List.of(), busca.comparacoes(), 0);
    }

    public ResultadoBusca porArtista(String artista) {
        return BuscasEncadeadas.porArtista(sequencial, artista);
    }

    /** Mesma consulta de {@link #porArtista}, mas pela Árvore AVL: O(log n) em vez de O(n). */
    public ResultadoBusca porArtistaAvl(String artista) {
        ArvoreAvlArtistas.Busca busca = arvoreArtistas.buscar(artista);
        return new ResultadoBusca(TipoBusca.CHAVE_SECUNDARIA_AVL, busca.obras(), busca.comparacoes(), 0);
    }

    public ResultadoBusca piso(long id) {
        return BuscasOrdenadas.piso(ordenada, id);
    }

    public ResultadoBusca teto(long id) {
        return BuscasOrdenadas.teto(ordenada, id);
    }

    public ResultadoBusca intervalo(long inicio, long fim) {
        return BuscasOrdenadas.intervalo(ordenada, inicio, fim);
    }

    public ResultadoBusca dedilhada(long id) {
        return buscaDedilhada.buscar(dedilhada, id);
    }

    public ResultadoBusca menorChave() {
        return BuscasEncadeadas.menor(sequencial);
    }

    public ResultadoBusca maiorChave() {
        return BuscasEncadeadas.maior(sequencial);
    }

    /** Útil para iniciar cada repetição de benchmark no mesmo estado. */
    public List<Obra> ordemMoverParaInicio() {
        return moverParaInicio.comoLista();
    }

    public List<Obra> ordemTransposicao() {
        return transposicao.comoLista();
    }
}
