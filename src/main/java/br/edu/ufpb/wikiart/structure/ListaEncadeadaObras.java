package br.edu.ufpb.wikiart.structure;

import br.edu.ufpb.wikiart.model.Obra;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

/**
 * Lista simplesmente encadeada do projeto. Ela expõe nós somente para os
 * algoritmos educacionais poderem contar comparações e reorganizar ponteiros.
 */
public final class ListaEncadeadaObras {
    public static final class No {
        private final Obra obra;
        private No proximo;

        private No(Obra obra) {
            this.obra = obra;
        }

        public Obra obra() {
            return obra;
        }

        public No proximo() {
            return proximo;
        }
    }

    private No inicio;
    private No fim;
    private int tamanho;

    public void adicionar(Obra obra) {
        // O ponteiro fim permite acrescentar sem percorrer a lista.
        No novo = new No(Objects.requireNonNull(obra));
        if (inicio == null) {
            inicio = fim = novo;
        } else {
            fim.proximo = novo;
            fim = novo;
        }
        tamanho++;
    }

    public No inicio() {
        return inicio;
    }

    public int tamanho() {
        return tamanho;
    }

    public void moverParaInicio(No anterior, No encontrado) {
        if (encontrado == null || encontrado == inicio) {
            return;
        }
        validarVizinhanca(anterior, encontrado);
        // Retira o nó da posição atual e o religa antes do início antigo.
        anterior.proximo = encontrado.proximo;
        if (encontrado == fim) {
            fim = anterior;
        }
        encontrado.proximo = inicio;
        inicio = encontrado;
    }

    public void transpor(No anteriorDoAnterior, No anterior, No encontrado) {
        if (anterior == null || encontrado == null || encontrado == inicio) {
            return;
        }
        validarVizinhanca(anterior, encontrado);
        // Troca apenas os dois nós vizinhos; os demais mantêm a mesma ordem.
        anterior.proximo = encontrado.proximo;
        encontrado.proximo = anterior;
        if (anteriorDoAnterior == null) {
            inicio = encontrado;
        } else {
            validarVizinhanca(anteriorDoAnterior, anterior);
            anteriorDoAnterior.proximo = encontrado;
        }
        if (encontrado == fim) {
            fim = anterior;
        }
    }

    public List<Obra> comoLista() {
        List<Obra> copia = new ArrayList<>(tamanho);
        for (No atual = inicio; atual != null; atual = atual.proximo) {
            copia.add(atual.obra);
        }
        return List.copyOf(copia);
    }

    public ListaEncadeadaObras copiar() {
        ListaEncadeadaObras copia = new ListaEncadeadaObras();
        for (No atual = inicio; atual != null; atual = atual.proximo) {
            copia.adicionar(atual.obra);
        }
        return copia;
    }

    private static void validarVizinhanca(No anterior, No atual) {
        if (anterior == null || anterior.proximo != atual) {
            throw new IllegalArgumentException("Os nós informados não são vizinhos desta operação.");
        }
    }
}
