package br.edu.ufpb.wikiart.search;

import br.edu.ufpb.wikiart.model.Obra;
import br.edu.ufpb.wikiart.structure.ArvoreAvlArtistas;
import br.edu.ufpb.wikiart.structure.ListaEncadeadaObras;
import br.edu.ufpb.wikiart.structure.ListaEncadeadaObras.No;

import java.util.ArrayList;
import java.util.List;

/** Algoritmos cujo caminho natural é percorrer uma lista nó a nó. */
public final class BuscasEncadeadas {
    private BuscasEncadeadas() {
    }

    public static ResultadoBusca sequencial(ListaEncadeadaObras lista, long id) {
        long comparacoes = 0;
        for (No atual = lista.inicio(); atual != null; atual = atual.proximo()) {
            comparacoes++;
            if (atual.obra().id() == id) {
                return unico(TipoBusca.SEQUENCIAL, atual.obra(), comparacoes, 0);
            }
        }
        return ResultadoBusca.vazio(TipoBusca.SEQUENCIAL, comparacoes);
    }

    /** Busca em lista e, quando encontra a obra, reorganiza os ponteiros para trazê-la à cabeça. */
    public static ResultadoBusca moverParaInicio(ListaEncadeadaObras lista, long id) {
        No anterior = null;
        No atual = lista.inicio();
        long comparacoes = 0;
        while (atual != null) {
            comparacoes++;
            if (atual.obra().id() == id) {
                boolean mudou = anterior != null;
                lista.moverParaInicio(anterior, atual);
                return unico(TipoBusca.MOVER_PARA_INICIO, atual.obra(), comparacoes, mudou ? 1 : 0);
            }
            anterior = atual;
            atual = atual.proximo();
        }
        return ResultadoBusca.vazio(TipoBusca.MOVER_PARA_INICIO, comparacoes);
    }

    /** Busca em lista e troca o nó encontrado apenas com seu predecessor imediato. */
    public static ResultadoBusca transposicao(ListaEncadeadaObras lista, long id) {
        No anteriorDoAnterior = null;
        No anterior = null;
        No atual = lista.inicio();
        long comparacoes = 0;
        while (atual != null) {
            comparacoes++;
            if (atual.obra().id() == id) {
                boolean mudou = anterior != null;
                lista.transpor(anteriorDoAnterior, anterior, atual);
                return unico(TipoBusca.TRANSPOSICAO, atual.obra(), comparacoes, mudou ? 1 : 0);
            }
            anteriorDoAnterior = anterior;
            anterior = atual;
            atual = atual.proximo();
        }
        return ResultadoBusca.vazio(TipoBusca.TRANSPOSICAO, comparacoes);
    }

    /**
     * Linha de base O(n) da chave secundária. Usa a mesma normalização da AVL
     * (sem acentos, minúsculas) para que as duas devolvam exatamente as mesmas obras.
     */
    public static ResultadoBusca porArtista(ListaEncadeadaObras lista, String artista) {
        String procurado = ArvoreAvlArtistas.normalizar(artista);
        List<Obra> encontradas = new ArrayList<>();
        long comparacoes = 0;
        for (No atual = lista.inicio(); atual != null; atual = atual.proximo()) {
            comparacoes++;
            if (ArvoreAvlArtistas.normalizar(atual.obra().artista()).equals(procurado)) {
                encontradas.add(atual.obra());
            }
        }
        return new ResultadoBusca(TipoBusca.CHAVE_SECUNDARIA, encontradas, comparacoes, 0);
    }

    public static ResultadoBusca menor(ListaEncadeadaObras lista) {
        No atual = lista.inicio();
        if (atual == null) {
            return ResultadoBusca.vazio(TipoBusca.MENOR_CHAVE, 0);
        }
        Obra melhor = atual.obra();
        long comparacoes = 0;
        for (atual = atual.proximo(); atual != null; atual = atual.proximo()) {
            comparacoes++;
            if (atual.obra().id() < melhor.id()) {
                melhor = atual.obra();
            }
        }
        return unico(TipoBusca.MENOR_CHAVE, melhor, comparacoes, 0);
    }

    public static ResultadoBusca maior(ListaEncadeadaObras lista) {
        No atual = lista.inicio();
        if (atual == null) {
            return ResultadoBusca.vazio(TipoBusca.MAIOR_CHAVE, 0);
        }
        Obra melhor = atual.obra();
        long comparacoes = 0;
        for (atual = atual.proximo(); atual != null; atual = atual.proximo()) {
            comparacoes++;
            if (atual.obra().id() > melhor.id()) {
                melhor = atual.obra();
            }
        }
        return unico(TipoBusca.MAIOR_CHAVE, melhor, comparacoes, 0);
    }

    static ResultadoBusca unico(TipoBusca tipo, Obra obra, long comparacoes, long reorganizacoes) {
        return new ResultadoBusca(tipo, List.of(obra), comparacoes, reorganizacoes);
    }
}
