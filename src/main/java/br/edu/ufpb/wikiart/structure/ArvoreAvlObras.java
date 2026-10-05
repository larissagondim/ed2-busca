package br.edu.ufpb.wikiart.structure;

import br.edu.ufpb.wikiart.model.Obra;

import java.util.Objects;

/**
 * Estrutura hierárquica da busca por ID: uma Árvore AVL ordenada pelo ID da obra.
 *
 * <p><b>Algoritmo clássico:</b> árvore binária de busca que, após cada inserção, confere
 * o fator de balanceamento dos ancestrais e aplica rotações simples ou duplas para manter
 * |fator| ≤ 1. A altura fica em ≈ 1,44·log2 n e a busca custa O(log n) comparações no
 * pior caso, mesmo que os IDs cheguem em ordem crescente (como no CSV).
 *
 * <p><b>Modificação para o catálogo:</b> cada nó guarda a altura <i>e</i> o tamanho da
 * subárvore (estatística de ordem), atualizados nas rotações, e a busca devolve junto
 * com a obra o número de comparações e a profundidade do nó, métricas que a tela de
 * comparação mostra. É o índice por ID análogo à Skip List, mas hierárquico.
 *
 * <p>Convenção de altura: árvore vazia = 0; nó único = 1.
 */
public final class ArvoreAvlObras {
    private static final class No {
        private final Obra obra;
        private int altura = 1;
        private int tamanho = 1;
        private No esquerda;
        private No direita;

        private No(Obra obra) {
            this.obra = obra;
        }
    }

    /** Obra encontrada (ou {@code null}), comparações de chave e profundidade do nó (raiz = 0; −1 se ausente). */
    public record Busca(Obra obra, long comparacoes, int profundidade) {
        public boolean encontrou() {
            return obra != null;
        }
    }

    private No raiz;

    public void inserir(Obra obra) {
        Objects.requireNonNull(obra);
        raiz = inserir(raiz, obra);
    }

    public Busca buscar(long id) {
        No atual = raiz;
        long comparacoes = 0;
        int profundidade = 0;
        while (atual != null) {
            comparacoes++;
            if (id == atual.obra.id()) {
                return new Busca(atual.obra, comparacoes, profundidade);
            }
            atual = id < atual.obra.id() ? atual.esquerda : atual.direita;
            profundidade++;
        }
        return new Busca(null, comparacoes, -1);
    }

    public int tamanho() {
        return tamanho(raiz);
    }

    public int altura() {
        return altura(raiz);
    }

    private static No inserir(No no, Obra obra) {
        if (no == null) {
            return new No(obra);
        }
        if (obra.id() == no.obra.id()) {
            throw new IllegalArgumentException("Chave duplicada: " + obra.id());
        }
        if (obra.id() < no.obra.id()) {
            no.esquerda = inserir(no.esquerda, obra);
        } else {
            no.direita = inserir(no.direita, obra);
        }
        atualizar(no);
        return balancear(no);
    }

    private static No balancear(No no) {
        int fator = altura(no.esquerda) - altura(no.direita);
        if (fator > 1) {
            if (altura(no.esquerda.esquerda) < altura(no.esquerda.direita)) {
                no.esquerda = rotacionarEsquerda(no.esquerda);
            }
            return rotacionarDireita(no);
        }
        if (fator < -1) {
            if (altura(no.direita.direita) < altura(no.direita.esquerda)) {
                no.direita = rotacionarDireita(no.direita);
            }
            return rotacionarEsquerda(no);
        }
        return no;
    }

    private static No rotacionarDireita(No no) {
        No nova = no.esquerda;
        no.esquerda = nova.direita;
        nova.direita = no;
        atualizar(no);
        atualizar(nova);
        return nova;
    }

    private static No rotacionarEsquerda(No no) {
        No nova = no.direita;
        no.direita = nova.esquerda;
        nova.esquerda = no;
        atualizar(no);
        atualizar(nova);
        return nova;
    }

    private static void atualizar(No no) {
        no.altura = 1 + Math.max(altura(no.esquerda), altura(no.direita));
        no.tamanho = 1 + tamanho(no.esquerda) + tamanho(no.direita);
    }

    private static int altura(No no) {
        return no == null ? 0 : no.altura;
    }

    private static int tamanho(No no) {
        return no == null ? 0 : no.tamanho;
    }
}
