package br.edu.ufpb.wikiart.structure;

import br.edu.ufpb.wikiart.model.Obra;

import java.util.Objects;

/*
 * Árvore binária de busca comum, sem balanceamento, mantida somente para
 * comparação didática com ArvoreAvlArtistas: a aplicação não a usa. Ela
 * recebe as mesmas chaves, na mesma ordem de inserção, e só guarda a chave (o nome
 * normalizado) — o objetivo é medir altura, número de nós e comparações de busca.
 *
 * Algoritmo clássico: insere descendo da raiz, à esquerda se a chave é menor
 * e à direita se é maior. Sem rebalancear, chaves que chegam ordenadas formam uma
 * lista (altura = n). Como o CSV traz os artistas em ordem alfabética dentro de cada
 * estilo, é exatamente o que acontece com os dados reais.
 *
 * Tudo é iterativo (e o percurso usa o ponteiro para o pai): uma árvore degenerada
 * com milhares de níveis estouraria a pilha de uma implementação recursiva.
 *
 * Convenção de altura: árvore vazia = 0; nó único = 1.
 */
public final class ArvoreBuscaBinariaArtistas {
    private static final class No {
        private final String chave;
        private final No pai;
        private No esquerda;
        private No direita;

        private No(String chave, No pai) {
            this.chave = chave;
            this.pai = pai;
        }
    }

    /* Chaves comparadas até encontrar (ou concluir que não existe) e se foi encontrada. */
    public record Busca(boolean encontrou, long comparacoes) {}

    /* Médias de comparação sobre todos os artistas da árvore. */
    public record MediaBusca(int artistas, double comparacoesMedias) {}

    private No raiz;
    private int tamanho;
    private int altura;

    /* Insere o artista da obra; se a chave já existe, nada muda (como na AVL, que só anexa a obra). */
    public void inserir(Obra obra) {
        Objects.requireNonNull(obra);
        String chave = ArvoreAvlArtistas.normalizar(obra.artista());
        if (raiz == null) {
            raiz = new No(chave, null);
            tamanho = altura = 1;
            return;
        }
        No atual = raiz;
        int nivel = 1;
        while (true) {
            int ordem = chave.compareTo(atual.chave);
            if (ordem == 0) {
                return;
            }
            nivel++;
            No proximo = ordem < 0 ? atual.esquerda : atual.direita;
            if (proximo == null) {
                No novo = new No(chave, atual);
                if (ordem < 0) {
                    atual.esquerda = novo;
                } else {
                    atual.direita = novo;
                }
                tamanho++;
                altura = Math.max(altura, nivel);
                return;
            }
            atual = proximo;
        }
    }

    public Busca buscar(String artista) {
        String chave = ArvoreAvlArtistas.normalizar(artista);
        No atual = raiz;
        long comparacoes = 0;
        while (atual != null) {
            comparacoes++;
            int ordem = chave.compareTo(atual.chave);
            if (ordem == 0) {
                return new Busca(true, comparacoes);
            }
            atual = ordem < 0 ? atual.esquerda : atual.direita;
        }
        return new Busca(false, comparacoes);
    }

    /* Busca cada artista da árvore (percurso em ordem iterativo) e devolve a média de comparações. */
    public MediaBusca mediaDeBusca() {
        No atual = raiz;
        if (atual == null) {
            return new MediaBusca(0, 0);
        }
        while (atual.esquerda != null) {
            atual = atual.esquerda;
        }
        long total = 0;
        int artistas = 0;
        while (atual != null) {
            total += buscar(atual.chave).comparacoes();
            artistas++;
            atual = sucessor(atual);
        }
        return new MediaBusca(artistas, (double) total / artistas);
    }

    /* Número de nós (artistas distintos). */
    public int tamanho() {
        return tamanho;
    }

    /* Altura em níveis; igual ao número de nós quando a árvore degenera em lista. */
    public int altura() {
        return altura;
    }

    private static No sucessor(No no) {
        if (no.direita != null) {
            No atual = no.direita;
            while (atual.esquerda != null) {
                atual = atual.esquerda;
            }
            return atual;
        }
        No atual = no;
        while (atual.pai != null && atual == atual.pai.direita) {
            atual = atual.pai;
        }
        return atual.pai;
    }
}
