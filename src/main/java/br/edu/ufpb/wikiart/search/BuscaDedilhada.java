package br.edu.ufpb.wikiart.search;

import br.edu.ufpb.wikiart.structure.ListaEncadeadaObras;
import br.edu.ufpb.wikiart.structure.ListaEncadeadaObras.No;

/**
 * Mantém um "dedo" no último acerto. A busca seguinte começa dali e dá a
 * volta na lista se necessário, preservando a correção mesmo sem ordenação.
 */
public final class BuscaDedilhada {
    private No dedo;

    public ResultadoBusca buscar(ListaEncadeadaObras lista, long id) {
        if (lista.inicio() == null) {
            dedo = null;
            return ResultadoBusca.vazio(TipoBusca.DEDILHADA, 0);
        }

        No inicioDaBusca = dedo == null ? lista.inicio() : dedo;
        No atual = inicioDaBusca;
        long comparacoes = 0;

        // Primeiro seguimos até o fim; depois voltamos ao começo uma única vez.
        while (atual != null) {
            comparacoes++;
            if (atual.obra().id() == id) {
                dedo = atual;
                return BuscasEncadeadas.unico(TipoBusca.DEDILHADA, atual.obra(), comparacoes, 0);
            }
            atual = atual.proximo();
        }
        atual = lista.inicio();
        while (atual != inicioDaBusca) {
            comparacoes++;
            if (atual.obra().id() == id) {
                dedo = atual;
                return BuscasEncadeadas.unico(TipoBusca.DEDILHADA, atual.obra(), comparacoes, 0);
            }
            atual = atual.proximo();
        }
        return ResultadoBusca.vazio(TipoBusca.DEDILHADA, comparacoes);
    }

    public void reiniciar() {
        dedo = null;
    }
}
