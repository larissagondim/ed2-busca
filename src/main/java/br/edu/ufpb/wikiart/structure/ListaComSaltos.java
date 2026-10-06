package br.edu.ufpb.wikiart.structure;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Random;

/**
 * Skip List probabilística ordenada pela chave. A semente configurável permite
 * que benchmarks recriem exatamente a mesma topologia em execuções diferentes.
 *
 * <p><b>Modificação para o catálogo — lista indexável:</b> cada ponteiro guarda
 * também a sua <i>largura</i>, isto é, quantos nós do nível 0 ele pula. Com isso
 * {@link #obter(int)} desce pelos níveis somando larguras e chega à posição i em
 * O(log n) esperado, em vez de percorrer i nós. É isso que permite paginar
 * 42.500 obras (página 1.000 do catálogo) sem ordenar nem copiar nada a cada
 * requisição. A inserção mantém as larguras atualizadas.
 */
public final class ListaComSaltos<K extends Comparable<? super K>, V> {
    private static final int NIVEL_MAXIMO = 24;

    private static final class No<K, V> {
        private final K chave;
        private final V valor;
        private final No<K, V>[] proximos;
        /** larguras[n] = distância, em nós do nível 0, até proximos[n] (ou até o fim). */
        private final int[] larguras;

        @SuppressWarnings("unchecked")
        private No(K chave, V valor, int nivel) {
            this.chave = chave;
            this.valor = valor;
            this.proximos = (No<K, V>[]) new No[nivel + 1];
            this.larguras = new int[nivel + 1];
        }
    }

    /** Valor encontrado (ou {@code null}) e quantas chaves foram comparadas. */
    public record Busca<V>(V valor, long comparacoes) {
        public boolean encontrou() {
            return valor != null;
        }
    }

    private final No<K, V> cabeca = new No<>(null, null, NIVEL_MAXIMO);
    private final Random aleatorio;
    private int nivelAtual;
    private int tamanho;

    public ListaComSaltos(long semente) {
        aleatorio = new Random(semente);
        cabeca.larguras[0] = 1;
    }

    // IMPORTANTE, OLHAR AQUI
    public Busca<V> buscar(K chave) {
        No<K, V> atual = cabeca;
        long comparacoes = 0;
        // Busca clássica da Skip List: do nível mais alto para o mais baixo.
        // Em cada nível avança enquanto a próxima chave ainda é menor que a procurada.
        for (int nivel = nivelAtual; nivel >= 0; nivel--) {
            while (atual.proximos[nivel] != null) {
                comparacoes++;
                if (atual.proximos[nivel].chave.compareTo(chave) >= 0) {
                    break;
                }
                atual = atual.proximos[nivel];
            }
        }
        // No nível 0, o próximo nó é o primeiro candidato que pode ser igual à chave.
        atual = atual.proximos[0];
        if (atual != null) {
            comparacoes++;
            if (atual.chave.compareTo(chave) == 0) {
                return new Busca<>(atual.valor, comparacoes);
            }
        }
        return new Busca<>(null, comparacoes);
    }

    public void inserir(K chave, V valor) {
        Objects.requireNonNull(chave);
        Objects.requireNonNull(valor);
        @SuppressWarnings("unchecked")
        No<K, V>[] anteriores = (No<K, V>[]) new No[NIVEL_MAXIMO + 1];
        int[] posicaoDosAnteriores = new int[NIVEL_MAXIMO + 1];
        No<K, V> atual = cabeca;
        int posicao = 0; // a cabeça ocupa a posição 0; o primeiro dado, a 1
        // Guarda o predecessor em cada nível; as posições acumuladas permitem
        // atualizar as larguras sem percorrer a lista inteira após inserir.
        for (int nivel = nivelAtual; nivel >= 0; nivel--) {
            while (atual.proximos[nivel] != null
                    && atual.proximos[nivel].chave.compareTo(chave) < 0) {
                posicao += atual.larguras[nivel];
                atual = atual.proximos[nivel];
            }
            anteriores[nivel] = atual;
            posicaoDosAnteriores[nivel] = posicao;
        }
        No<K, V> seguinte = atual.proximos[0];
        if (seguinte != null && seguinte.chave.compareTo(chave) == 0) {
            throw new IllegalArgumentException("Chave duplicada: " + chave);
        }

        int novoNivel = sortearNivel();
        if (novoNivel > nivelAtual) {
            for (int nivel = nivelAtual + 1; nivel <= novoNivel; nivel++) {
                anteriores[nivel] = cabeca;
                posicaoDosAnteriores[nivel] = 0;
                cabeca.larguras[nivel] = tamanho + 1; // nível vazio: aponta para o fim
            }
            nivelAtual = novoNivel;
        }
        int posicaoDoNovo = posicaoDosAnteriores[0] + 1;
        No<K, V> novo = new No<>(chave, valor, novoNivel);
        for (int nivel = 0; nivel <= novoNivel; nivel++) {
            No<K, V> anterior = anteriores[nivel];
            novo.proximos[nivel] = anterior.proximos[nivel];
            anterior.proximos[nivel] = novo;
            // A largura antiga do anterior é dividida entre ele e o novo nó.
            int distanciaAteNovo = posicaoDoNovo - posicaoDosAnteriores[nivel];
            novo.larguras[nivel] = anterior.larguras[nivel] - distanciaAteNovo + 1;
            anterior.larguras[nivel] = distanciaAteNovo;
        }
        // Nos níveis acima do novo nó, quem passa por cima dele pula um nó a mais.
        for (int nivel = novoNivel + 1; nivel <= nivelAtual; nivel++) {
            anteriores[nivel].larguras[nivel]++;
        }
        tamanho++;
    }

    /** Valor na posição {@code indice} (base zero) da ordem das chaves. */
    public V obter(int indice) {
        return no(indice).valor;
    }

    /** Até {@code quantidade} valores a partir de {@code inicio}: um salto e depois o nível 0. */
    public List<V> fatia(int inicio, int quantidade) {
        List<V> resultado = new ArrayList<>(Math.max(0, Math.min(quantidade, tamanho - inicio)));
        if (inicio < 0 || inicio >= tamanho || quantidade <= 0) {
            return resultado;
        }
        for (No<K, V> atual = no(inicio); atual != null && resultado.size() < quantidade; atual = atual.proximos[0]) {
            resultado.add(atual.valor);
        }
        return resultado;
    }

    public List<V> paraLista() {
        return fatia(0, tamanho);
    }

    public int tamanho() {
        return tamanho;
    }

    /** Número de níveis em uso (nível 0 incluído), para a tela que explica a estrutura. */
    public int niveis() {
        return nivelAtual + 1;
    }

    // IMPORTANTE, OLHAR AQUI
    private No<K, V> no(int indice) {
        if (indice < 0 || indice >= tamanho) {
            throw new IndexOutOfBoundsException("Posição " + indice + " fora de 0.." + (tamanho - 1));
        }
        int alvo = indice + 1;
        int posicao = 0;
        No<K, V> atual = cabeca;
        // A largura informa quantos nós do nível 0 o ponteiro cobre.
        // Avançamos sem ultrapassar a posição desejada e descemos quando necessário.
        for (int nivel = nivelAtual; nivel >= 0; nivel--) {
            while (atual.proximos[nivel] != null && posicao + atual.larguras[nivel] <= alvo) {
                posicao += atual.larguras[nivel];
                atual = atual.proximos[nivel];
            }
        }
        return atual;
    }

    private int sortearNivel() {
        int nivel = 0;
        while (nivel < NIVEL_MAXIMO && aleatorio.nextBoolean()) {
            nivel++;
        }
        return nivel;
    }
}
