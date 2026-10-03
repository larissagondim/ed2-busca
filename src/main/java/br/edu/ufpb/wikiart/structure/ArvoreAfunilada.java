package br.edu.ufpb.wikiart.structure;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.function.Function;

/**
 * Árvore afunilada (splay tree) iterativa, com ponteiro para o pai, para que
 * nenhuma operação dependa da pilha de recursão mesmo numa árvore degenerada.
 *
 * <p>Modificações feitas para o catálogo, além do algoritmo clássico:
 * <ol>
 *   <li><b>Carga em lote balanceada</b> ({@link #deOrdenados}): o CSV chega
 *   ordenado por ID. Inserir chaves crescentes uma a uma, afunilando a cada
 *   inserção, produz uma "lista" de altura n; a primeira busca por uma chave
 *   pequena custaria 42.500 comparações. Montamos a árvore já balanceada em O(n).</li>
 *   <li><b>Consulta sem afunilamento</b> ({@link #consultar}): leituras internas
 *   (servir imagem, validar filtro) não representam interesse do usuário e não
 *   devem bagunçar a ordem de acesso. Só {@link #acessar} afunila.</li>
 *   <li><b>Recentes pelo topo da árvore</b> ({@link #recentes}): como cada obra
 *   aberta sobe para a raiz, os nós já acessados mais próximos dela são os vistos
 *   há menos tempo. Um percurso em largura limitado em profundidade devolve esse
 *   histórico sem nenhuma estrutura extra.</li>
 * </ol>
 */
public final class ArvoreAfunilada<K extends Comparable<? super K>, V> {
    private static final class No<K, V> {
        private final K chave;
        private final V valor;
        private No<K, V> esquerda;
        private No<K, V> direita;
        private No<K, V> pai;
        private boolean acessado;

        private No(K chave, V valor) {
            this.chave = chave;
            this.valor = valor;
        }
    }

    /** Resultado de um acesso, com as métricas usadas na comparação de buscas. */
    public record Acesso<V>(V valor, long comparacoes, long rotacoes) {
        public boolean encontrou() {
            return valor != null;
        }
    }

    private No<K, V> raiz;
    private int tamanho;
    private long rotacoes;

    /** Monta a árvore balanceada a partir de valores com chaves estritamente crescentes. */
    public static <K extends Comparable<? super K>, V> ArvoreAfunilada<K, V> deOrdenados(
            List<V> valores, Function<? super V, ? extends K> chave) {
        ArvoreAfunilada<K, V> arvore = new ArvoreAfunilada<>();
        for (int i = 1; i < valores.size(); i++) {
            if (chave.apply(valores.get(i - 1)).compareTo(chave.apply(valores.get(i))) >= 0) {
                throw new IllegalArgumentException("Chaves fora de ordem ou duplicadas: " + chave.apply(valores.get(i)));
            }
        }
        arvore.raiz = arvore.balancear(valores, chave, 0, valores.size() - 1, null);
        arvore.tamanho = valores.size();
        return arvore;
    }

    // A profundidade da recursão é log2(n), então não há risco de estouro de pilha.
    private No<K, V> balancear(List<V> valores, Function<? super V, ? extends K> chave, int inicio, int fim, No<K, V> pai) {
        if (inicio > fim) {
            return null;
        }
        int meio = (inicio + fim) >>> 1;
        V valor = valores.get(meio);
        No<K, V> no = new No<>(chave.apply(valor), valor);
        no.pai = pai;
        no.esquerda = balancear(valores, chave, inicio, meio - 1, no);
        no.direita = balancear(valores, chave, meio + 1, fim, no);
        return no;
    }

    /** Inserção clássica: desce como numa árvore de busca e afunila o novo nó. */
    public void inserir(K chave, V valor) {
        Objects.requireNonNull(chave);
        Objects.requireNonNull(valor);
        No<K, V> novo = new No<>(chave, valor);
        if (raiz == null) {
            raiz = novo;
            tamanho = 1;
            return;
        }
        No<K, V> atual = raiz;
        while (true) {
            int comparacao = chave.compareTo(atual.chave);
            if (comparacao == 0) {
                afunilar(atual);
                throw new IllegalArgumentException("Chave duplicada: " + chave);
            }
            No<K, V> proximo = comparacao < 0 ? atual.esquerda : atual.direita;
            if (proximo == null) {
                novo.pai = atual;
                if (comparacao < 0) {
                    atual.esquerda = novo;
                } else {
                    atual.direita = novo;
                }
                tamanho++;
                afunilar(novo);
                return;
            }
            atual = proximo;
        }
    }

    /**
     * Acesso de usuário: afunila o nó encontrado (ou o último visitado, se a
     * chave não existir, como no algoritmo clássico) e o marca como visto.
     */
    public Acesso<V> acessar(K chave) {
        rotacoes = 0;
        long comparacoes = 0;
        No<K, V> atual = raiz;
        No<K, V> ultimo = null;
        while (atual != null) {
            comparacoes++;
            ultimo = atual;
            int comparacao = chave.compareTo(atual.chave);
            if (comparacao == 0) {
                atual.acessado = true;
                afunilar(atual);
                return new Acesso<>(atual.valor, comparacoes, rotacoes);
            }
            atual = comparacao < 0 ? atual.esquerda : atual.direita;
        }
        if (ultimo != null) {
            afunilar(ultimo);
        }
        return new Acesso<>(null, comparacoes, rotacoes);
    }

    /** Leitura interna: busca binária comum, sem alterar a forma da árvore. */
    public V consultar(K chave) {
        No<K, V> atual = raiz;
        while (atual != null) {
            int comparacao = chave.compareTo(atual.chave);
            if (comparacao == 0) {
                return atual.valor;
            }
            atual = comparacao < 0 ? atual.esquerda : atual.direita;
        }
        return null;
    }

    /**
     * Percorre a árvore em largura até {@code profundidadeMaxima} e devolve os
     * primeiros nós já acessados. A raiz é o último acesso; quanto mais raso o
     * nó, mais recente foi seu acesso.
     */
    public List<V> recentes(int limite, int profundidadeMaxima) {
        List<V> resultado = new ArrayList<>();
        if (raiz == null || limite <= 0) {
            return resultado;
        }
        FilaDeNos<K, V> fila = new FilaDeNos<>();
        fila.enfileirar(raiz, 0);
        while (!fila.vazia() && resultado.size() < limite) {
            int profundidade = fila.profundidadeDoPrimeiro();
            No<K, V> no = fila.desenfileirar();
            if (no.acessado) {
                resultado.add(no.valor);
            }
            if (profundidade < profundidadeMaxima) {
                if (no.esquerda != null) fila.enfileirar(no.esquerda, profundidade + 1);
                if (no.direita != null) fila.enfileirar(no.direita, profundidade + 1);
            }
        }
        return resultado;
    }

    /** Percurso em ordem sem pilha, usando os ponteiros para o pai. */
    public List<V> emOrdem() {
        List<V> resultado = new ArrayList<>(tamanho);
        No<K, V> atual = raiz;
        while (atual != null && atual.esquerda != null) {
            atual = atual.esquerda;
        }
        while (atual != null) {
            resultado.add(atual.valor);
            atual = sucessor(atual);
        }
        return resultado;
    }

    public int tamanho() {
        return tamanho;
    }

    public int altura() {
        if (raiz == null) {
            return 0;
        }
        int altura = 0;
        FilaDeNos<K, V> fila = new FilaDeNos<>();
        fila.enfileirar(raiz, 1);
        while (!fila.vazia()) {
            int profundidade = fila.profundidadeDoPrimeiro();
            No<K, V> no = fila.desenfileirar();
            altura = Math.max(altura, profundidade);
            if (no.esquerda != null) fila.enfileirar(no.esquerda, profundidade + 1);
            if (no.direita != null) fila.enfileirar(no.direita, profundidade + 1);
        }
        return altura;
    }

    public K chaveDaRaiz() {
        return raiz == null ? null : raiz.chave;
    }

    private static <K, V> No<K, V> sucessor(No<K, V> no) {
        if (no.direita != null) {
            No<K, V> atual = no.direita;
            while (atual.esquerda != null) {
                atual = atual.esquerda;
            }
            return atual;
        }
        No<K, V> atual = no;
        while (atual.pai != null && atual == atual.pai.direita) {
            atual = atual.pai;
        }
        return atual.pai;
    }

    /** Zig, zig-zig e zig-zag até o nó virar a raiz. */
    private void afunilar(No<K, V> x) {
        while (x.pai != null) {
            No<K, V> pai = x.pai;
            No<K, V> avo = pai.pai;
            if (avo == null) {
                rotacionar(x); // zig
            } else if ((x == pai.esquerda) == (pai == avo.esquerda)) {
                rotacionar(pai); // zig-zig: primeiro o pai, depois o nó
                rotacionar(x);
            } else {
                rotacionar(x); // zig-zag: o nó sobe duas vezes
                rotacionar(x);
            }
        }
        raiz = x;
    }

    /** Sobe {@code x} um nível, trocando de lugar com o pai. */
    private void rotacionar(No<K, V> x) {
        No<K, V> pai = x.pai;
        No<K, V> avo = pai.pai;
        if (x == pai.esquerda) {
            pai.esquerda = x.direita;
            if (x.direita != null) x.direita.pai = pai;
            x.direita = pai;
        } else {
            pai.direita = x.esquerda;
            if (x.esquerda != null) x.esquerda.pai = pai;
            x.esquerda = pai;
        }
        pai.pai = x;
        x.pai = avo;
        if (avo != null) {
            if (avo.esquerda == pai) avo.esquerda = x;
            else avo.direita = x;
        }
        rotacoes++;
    }

    /** Fila encadeada mínima para o percurso em largura. */
    private static final class FilaDeNos<K, V> {
        private static final class Elo<K, V> {
            private final No<K, V> no;
            private final int profundidade;
            private Elo<K, V> proximo;

            private Elo(No<K, V> no, int profundidade) {
                this.no = no;
                this.profundidade = profundidade;
            }
        }

        private Elo<K, V> inicio;
        private Elo<K, V> fim;

        void enfileirar(No<K, V> no, int profundidade) {
            Elo<K, V> elo = new Elo<>(no, profundidade);
            if (fim == null) inicio = fim = elo;
            else fim = fim.proximo = elo;
        }

        int profundidadeDoPrimeiro() {
            return inicio.profundidade;
        }

        No<K, V> desenfileirar() {
            No<K, V> no = inicio.no;
            inicio = inicio.proximo;
            if (inicio == null) fim = null;
            return no;
        }

        boolean vazia() {
            return inicio == null;
        }
    }
}
