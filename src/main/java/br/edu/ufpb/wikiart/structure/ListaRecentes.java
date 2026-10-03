package br.edu.ufpb.wikiart.structure;

import br.edu.ufpb.wikiart.model.Obra;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

/**
 * Histórico "vistas recentemente": lista simplesmente encadeada que se
 * auto-organiza por movimentação para o início.
 *
 * <p><b>Modificações em relação à movimentação clássica:</b>
 * <ol>
 *   <li><b>Crescimento sob demanda:</b> a lista começa vazia e uma obra só entra
 *   (no início) na primeira vez que é vista, então só guarda obras realmente acessadas.</li>
 *   <li><b>Capacidade limitada:</b> ao passar de {@code capacidade} nós, o último
 *   (o visto há mais tempo) é descartado, e a busca sequencial nunca percorre
 *   mais do que {@code capacidade} nós.</li>
 * </ol>
 */
public final class ListaRecentes {
    private static final class No {
        private final Obra obra;
        private No proximo;

        private No(Obra obra) {
            this.obra = obra;
        }
    }

    private final int capacidade;
    private No inicio;
    private int tamanho;

    public ListaRecentes(int capacidade) {
        if (capacidade < 1) throw new IllegalArgumentException("Capacidade deve ser positiva: " + capacidade);
        this.capacidade = capacidade;
    }

    /** Leva a obra ao início; se ainda não estava na lista, insere e descarta o excesso no fim. */
    public void registrar(Obra obra) {
        Objects.requireNonNull(obra);
        No anterior = null;
        No penultimo = null;
        for (No atual = inicio; atual != null; atual = atual.proximo) {
            if (atual.obra.id() == obra.id()) {
                if (anterior != null) {
                    anterior.proximo = atual.proximo;
                    atual.proximo = inicio;
                    inicio = atual;
                }
                return;
            }
            penultimo = anterior;
            anterior = atual;
        }
        No novo = new No(obra);
        novo.proximo = inicio;
        inicio = novo;
        tamanho++;
        if (tamanho > capacidade) {
            // "anterior" era o último nó antes da inserção; "penultimo" passa a ser o novo fim.
            if (penultimo == null) inicio.proximo = null;
            else penultimo.proximo = null;
            tamanho--;
        }
    }

    /** Os {@code limite} primeiros nós: do visto mais recentemente ao mais antigo. */
    public List<Obra> primeiros(int limite) {
        List<Obra> resultado = new ArrayList<>();
        for (No atual = inicio; atual != null && resultado.size() < limite; atual = atual.proximo) {
            resultado.add(atual.obra);
        }
        return resultado;
    }

    public int tamanho() {
        return tamanho;
    }
}
