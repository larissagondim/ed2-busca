package br.edu.ufpb.wikiart.structure;

import br.edu.ufpb.wikiart.model.Obra;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

/**
 * Ranking "mais vistas": lista simplesmente encadeada, sem ordenação, que se
 * auto-organiza por transposição — como o "mais vendidos" do enunciado.
 *
 * <p><b>Modificações em relação à transposição clássica:</b>
 * <ol>
 *   <li><b>Crescimento sob demanda:</b> a lista começa vazia e uma obra só entra
 *   (no fim) na primeira vez que é vista. Assim o ranking tem apenas obras
 *   realmente acessadas, e a busca sequencial percorre dezenas de nós, não 42.500.</li>
 *   <li><b>Transposição com guarda de frequência:</b> cada nó conta suas
 *   visualizações. Na clássica, qualquer acesso troca o nó com o anterior; aqui
 *   a troca só acontece se o nó passou a ter <i>mais</i> visualizações que o
 *   anterior. Uma obra vista uma única vez não ultrapassa outra vista dez vezes,
 *   mas continua subindo uma posição por acesso quando merece.</li>
 * </ol>
 */
public final class ListaMaisVistas {
    private static final class No {
        private final Obra obra;
        private long visualizacoes;
        private No proximo;

        private No(Obra obra) {
            this.obra = obra;
        }
    }

    public record Entrada(Obra obra, long visualizacoes) {}

    /** Posição final (base 1), visualizações, comparações feitas e se houve troca. */
    public record Registro(int posicao, long visualizacoes, long comparacoes, boolean transpos) {}

    private No inicio;
    private No fim;
    private int tamanho;

    public Registro registrar(Obra obra) {
        Objects.requireNonNull(obra);
        No anteriorDoAnterior = null;
        No anterior = null;
        No atual = inicio;
        long comparacoes = 0;
        int posicao = 1;
        while (atual != null) {
            comparacoes++;
            if (atual.obra.id() == obra.id()) {
                atual.visualizacoes++;
                if (anterior != null && atual.visualizacoes > anterior.visualizacoes) {
                    transpor(anteriorDoAnterior, anterior, atual);
                    return new Registro(posicao - 1, atual.visualizacoes, comparacoes, true);
                }
                return new Registro(posicao, atual.visualizacoes, comparacoes, false);
            }
            anteriorDoAnterior = anterior;
            anterior = atual;
            atual = atual.proximo;
            posicao++;
        }
        No novo = new No(obra);
        novo.visualizacoes = 1;
        if (fim == null) {
            inicio = fim = novo;
        } else {
            fim.proximo = novo;
            fim = novo;
        }
        tamanho++;
        return new Registro(tamanho, 1, comparacoes, false);
    }

    /** Os {@code limite} primeiros nós: o topo do ranking. */
    public List<Entrada> primeiros(int limite) {
        List<Entrada> resultado = new ArrayList<>();
        for (No atual = inicio; atual != null && resultado.size() < limite; atual = atual.proximo) {
            resultado.add(new Entrada(atual.obra, atual.visualizacoes));
        }
        return resultado;
    }

    public int tamanho() {
        return tamanho;
    }

    private void transpor(No anteriorDoAnterior, No anterior, No atual) {
        anterior.proximo = atual.proximo;
        atual.proximo = anterior;
        if (anteriorDoAnterior == null) {
            inicio = atual;
        } else {
            anteriorDoAnterior.proximo = atual;
        }
        if (fim == atual) {
            fim = anterior;
        }
    }
}
