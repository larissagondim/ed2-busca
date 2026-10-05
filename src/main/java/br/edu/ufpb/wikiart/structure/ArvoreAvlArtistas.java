package br.edu.ufpb.wikiart.structure;

import br.edu.ufpb.wikiart.model.Obra;

import java.text.Normalizer;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Objects;

/**
 * Índice hierárquico dos artistas: uma Árvore AVL cuja chave é o nome do artista
 * normalizado (sem acentos, minúsculas, sem espaços nas pontas) e cujo valor é uma
 * {@link ListaEncadeadaObras} com as obras daquele artista. A árvore indexa
 * artistas; cada nó aponta para a lista de obras dele.
 *
 * <p><b>Algoritmo clássico:</b> a AVL é uma árvore binária de busca que, após cada
 * inserção, confere o fator de balanceamento (altura da esquerda − altura da
 * direita) de cada ancestral do nó novo. Se algum chega a ±2, uma rotação simples
 * (casos esquerda-esquerda e direita-direita) ou dupla (esquerda-direita e
 * direita-esquerda) restaura |fator| ≤ 1. Isso limita a altura a ≈ 1,44·log2 n
 * mesmo quando as chaves chegam ordenadas — o caso em que uma ABB comum vira uma
 * lista (ver {@link ArvoreBuscaBinariaArtistas}).
 *
 * <p><b>Modificação 1 — árvore de estatística de ordem:</b> cada nó guarda, além da
 * altura, o <i>tamanho da subárvore</i> (quantos artistas ela contém, contando o
 * próprio nó), e todas as rotações o atualizam. Com isso
 * {@link #artistaNaPosicao(int)}, {@link #posicaoDe(String)} e {@link #fatia(int, int)}
 * funcionam em O(log n) (mais O(k) para os k itens da página), sem percorrer i nós.
 * É a mesma ideia das <i>larguras</i> da {@link ListaComSaltos} indexável — guardar
 * no ponteiro/nó quantos elementos ele cobre —, aplicada a uma estrutura
 * hierárquica. A aplicação precisa disso para paginar ~1.100 artistas em ordem
 * alfabética sem ordenar nem copiar a árvore a cada requisição.
 *
 * <p><b>Modificação 2 — visualizações agregadas:</b> cada nó guarda a soma das
 * visualizações das obras do artista. {@link #registrarVisualizacao(Obra)} faz uma
 * busca O(log n) e incrementa o contador, sem estrutura paralela; a mesma árvore
 * responde "quantas vezes as obras deste artista foram vistas" e "em que posição
 * alfabética ele está".
 *
 * <p>Também são contadas as rotações executadas, por tipo, para a tela que explica
 * a estrutura. Uma rotação dupla conta como uma só (e não como duas simples).
 *
 * <p>Convenção de altura: árvore vazia = 0; nó único = 1. A profundidade da raiz é 0.
 */
public final class ArvoreAvlArtistas {
    /** Nó visível (somente leitura) para verificadores de invariantes e para a tela de métricas. */
    public static final class No {
        private final String chave;
        private final String nome;
        private final ListaEncadeadaObras obras = new ListaEncadeadaObras();
        private long visualizacoes;
        private int altura = 1;
        private int tamanhoSubarvore = 1;
        private No esquerda;
        private No direita;

        private No(String chave, String nome) {
            this.chave = chave;
            this.nome = nome;
        }

        public String chave() {
            return chave;
        }

        public String nome() {
            return nome;
        }

        public int quantidadeObras() {
            return obras.tamanho();
        }

        public long visualizacoes() {
            return visualizacoes;
        }

        public int altura() {
            return altura;
        }

        public int tamanhoSubarvore() {
            return tamanhoSubarvore;
        }

        public No esquerda() {
            return esquerda;
        }

        public No direita() {
            return direita;
        }
    }

    /** Um artista como a API o mostra: nome original, obras, visualizações e posição alfabética (base zero). */
    public record Artista(String nome, int quantidadeObras, long visualizacoes, int posicao) {}

    /**
     * Resultado de uma busca: o artista (ou vazio), suas obras, as comparações de chave
     * feitas e a profundidade do nó (raiz = 0; −1 se não encontrado).
     */
    public record Busca(Artista artista, List<Obra> obras, long comparacoes, int profundidade) {
        public boolean encontrou() {
            return artista != null;
        }
    }

    /** Rotações executadas durante a construção, por tipo. */
    public record Rotacoes(long simplesEsquerda, long simplesDireita, long duplaEsquerdaDireita, long duplaDireitaEsquerda) {
        public long total() {
            return simplesEsquerda + simplesDireita + duplaEsquerdaDireita + duplaDireitaEsquerda;
        }
    }

    private No raiz;
    private long simplesEsquerda;
    private long simplesDireita;
    private long duplaEsquerdaDireita;
    private long duplaDireitaEsquerda;

    /** Sem acentos, minúsculo e sem espaços nas pontas: a forma usada para comparar nomes de artistas. */
    public static String normalizar(String nome) {
        String texto = nome.strip();
        boolean ascii = true;
        for (int i = 0; i < texto.length() && ascii; i++) {
            ascii = texto.charAt(i) < 128;
        }
        if (ascii) {
            return texto.toLowerCase(Locale.ROOT);
        }
        String decomposto = Normalizer.normalize(texto, Normalizer.Form.NFD);
        StringBuilder limpo = new StringBuilder(decomposto.length());
        for (int i = 0; i < decomposto.length(); i++) {
            char c = decomposto.charAt(i);
            int tipo = Character.getType(c);
            if (tipo != Character.NON_SPACING_MARK && tipo != Character.COMBINING_SPACING_MARK
                    && tipo != Character.ENCLOSING_MARK) {
                limpo.append(c);
            }
        }
        return limpo.toString().toLowerCase(Locale.ROOT);
    }

    /** Anexa a obra à lista do artista, criando o nó dele (e rebalanceando) se ainda não existir. */
    public void inserir(Obra obra) {
        Objects.requireNonNull(obra);
        raiz = inserir(raiz, normalizar(obra.artista()), obra);
    }

    /** Busca O(log n): devolve o artista, suas obras, as comparações e a profundidade do nó. */
    public Busca buscar(String artista) {
        String chave = normalizar(artista);
        No atual = raiz;
        long comparacoes = 0;
        int profundidade = 0;
        int posicao = 0;
        while (atual != null) {
            comparacoes++;
            int ordem = chave.compareTo(atual.chave);
            if (ordem == 0) {
                posicao += tamanho(atual.esquerda);
                return new Busca(visao(atual, posicao), atual.obras.comoLista(), comparacoes, profundidade);
            }
            if (ordem < 0) {
                atual = atual.esquerda;
            } else {
                posicao += tamanho(atual.esquerda) + 1;
                atual = atual.direita;
            }
            profundidade++;
        }
        return new Busca(null, List.of(), comparacoes, -1);
    }

    /** Soma uma visualização ao artista da obra; devolve o novo total (ou 0 se o artista não existe). */
    public long registrarVisualizacao(Obra obra) {
        No no = localizar(normalizar(obra.artista()));
        if (no == null) {
            return 0;
        }
        return ++no.visualizacoes;
    }

    /** O i-ésimo artista (base zero) em ordem alfabética, descendo pelos tamanhos das subárvores: O(log n). */
    public Artista artistaNaPosicao(int indice) {
        if (indice < 0 || indice >= tamanho()) {
            throw new IndexOutOfBoundsException("Posição " + indice + " fora de 0.." + (tamanho() - 1));
        }
        No atual = raiz;
        int restante = indice;
        while (true) {
            int daEsquerda = tamanho(atual.esquerda);
            if (restante < daEsquerda) {
                atual = atual.esquerda;
            } else if (restante == daEsquerda) {
                return visao(atual, indice);
            } else {
                restante -= daEsquerda + 1;
                atual = atual.direita;
            }
        }
    }

    /** Posição alfabética (base zero) do artista, ou −1 se ele não existe: O(log n). */
    public int posicaoDe(String artista) {
        String chave = normalizar(artista);
        No atual = raiz;
        int posicao = 0;
        while (atual != null) {
            int ordem = chave.compareTo(atual.chave);
            if (ordem == 0) {
                return posicao + tamanho(atual.esquerda);
            }
            if (ordem < 0) {
                atual = atual.esquerda;
            } else {
                posicao += tamanho(atual.esquerda) + 1;
                atual = atual.direita;
            }
        }
        return -1;
    }

    /**
     * Até {@code quantidade} artistas a partir da posição {@code inicio}: desce em
     * O(log n) até o início da página e segue pelo sucessor em ordem.
     */
    public List<Artista> fatia(int inicio, int quantidade) {
        List<Artista> resultado = new ArrayList<>(Math.max(0, Math.min(quantidade, tamanho() - inicio)));
        if (inicio < 0 || inicio >= tamanho() || quantidade <= 0) {
            return resultado;
        }
        // Ancestrais ainda não visitados (todos maiores que o nó atual); a altura da AVL limita o vetor.
        No[] pendentes = new No[altura() + 1];
        int topo = 0;
        No atual = raiz;
        int restante = inicio;
        while (true) {
            int daEsquerda = tamanho(atual.esquerda);
            if (restante < daEsquerda) {
                pendentes[topo++] = atual;
                atual = atual.esquerda;
            } else if (restante == daEsquerda) {
                break;
            } else {
                restante -= daEsquerda + 1;
                atual = atual.direita;
            }
        }
        int posicao = inicio;
        while (atual != null && resultado.size() < quantidade) {
            resultado.add(visao(atual, posicao++));
            if (atual.direita != null) {
                atual = atual.direita;
                while (atual.esquerda != null) {
                    pendentes[topo++] = atual;
                    atual = atual.esquerda;
                }
            } else {
                atual = topo > 0 ? pendentes[--topo] : null;
            }
        }
        return resultado;
    }

    /** Todos os artistas em ordem alfabética (percurso em ordem). */
    public List<Artista> emOrdem() {
        return fatia(0, tamanho());
    }

    /** Número de artistas. */
    public int tamanho() {
        return tamanho(raiz);
    }

    /** Altura em níveis (vazia = 0; nó único = 1). */
    public int altura() {
        return altura(raiz);
    }

    public Rotacoes rotacoes() {
        return new Rotacoes(simplesEsquerda, simplesDireita, duplaEsquerdaDireita, duplaDireitaEsquerda);
    }

    /** Raiz para inspeção (somente leitura); {@code null} se a árvore está vazia. */
    public No raiz() {
        return raiz;
    }

    private No localizar(String chave) {
        No atual = raiz;
        while (atual != null) {
            int ordem = chave.compareTo(atual.chave);
            if (ordem == 0) {
                return atual;
            }
            atual = ordem < 0 ? atual.esquerda : atual.direita;
        }
        return null;
    }

    private No inserir(No no, String chave, Obra obra) {
        if (no == null) {
            No novo = new No(chave, obra.artista());
            novo.obras.adicionar(obra);
            return novo;
        }
        int ordem = chave.compareTo(no.chave);
        if (ordem == 0) {
            no.obras.adicionar(obra);
            return no;
        }
        if (ordem < 0) {
            no.esquerda = inserir(no.esquerda, chave, obra);
        } else {
            no.direita = inserir(no.direita, chave, obra);
        }
        atualizar(no);
        return balancear(no);
    }

    private No balancear(No no) {
        int fator = altura(no.esquerda) - altura(no.direita);
        if (fator > 1) {
            if (altura(no.esquerda.esquerda) < altura(no.esquerda.direita)) {
                no.esquerda = rotacionarEsquerda(no.esquerda);
                duplaEsquerdaDireita++;
            } else {
                simplesDireita++;
            }
            return rotacionarDireita(no);
        }
        if (fator < -1) {
            if (altura(no.direita.direita) < altura(no.direita.esquerda)) {
                no.direita = rotacionarDireita(no.direita);
                duplaDireitaEsquerda++;
            } else {
                simplesEsquerda++;
            }
            return rotacionarEsquerda(no);
        }
        return no;
    }

    private No rotacionarDireita(No no) {
        No novaRaiz = no.esquerda;
        no.esquerda = novaRaiz.direita;
        novaRaiz.direita = no;
        atualizar(no);
        atualizar(novaRaiz);
        return novaRaiz;
    }

    private No rotacionarEsquerda(No no) {
        No novaRaiz = no.direita;
        no.direita = novaRaiz.esquerda;
        novaRaiz.esquerda = no;
        atualizar(no);
        atualizar(novaRaiz);
        return novaRaiz;
    }

    /** Recalcula altura e tamanho da subárvore a partir dos filhos (que já estão corretos). */
    private static void atualizar(No no) {
        no.altura = 1 + Math.max(altura(no.esquerda), altura(no.direita));
        no.tamanhoSubarvore = 1 + tamanho(no.esquerda) + tamanho(no.direita);
    }

    private static int altura(No no) {
        return no == null ? 0 : no.altura;
    }

    private static int tamanho(No no) {
        return no == null ? 0 : no.tamanhoSubarvore;
    }

    private static Artista visao(No no, int posicao) {
        return new Artista(no.nome, no.obras.tamanho(), no.visualizacoes, posicao);
    }
}
