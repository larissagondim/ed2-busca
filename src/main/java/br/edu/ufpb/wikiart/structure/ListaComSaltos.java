package br.edu.ufpb.wikiart.structure;

import br.edu.ufpb.wikiart.model.Obra;
import br.edu.ufpb.wikiart.search.ResultadoBusca;
import br.edu.ufpb.wikiart.search.TipoBusca;

import java.util.Collection;
import java.util.List;
import java.util.Random;

/**
 * Skip List probabilística ordenada por ID. A semente configurável permite que
 * benchmarks recriem exatamente a mesma topologia em execuções diferentes.
 */
public final class ListaComSaltos {
    private static final int NIVEL_MAXIMO = 24;

    private static final class No {
        private final Obra obra;
        private final No[] proximos;

        private No(Obra obra, int nivel) {
            this.obra = obra;
            this.proximos = new No[nivel + 1];
        }
    }

    private final No cabeca = new No(null, NIVEL_MAXIMO);
    private final Random aleatorio;
    private int nivelAtual;

    public ListaComSaltos(Collection<Obra> obras, long semente) {
        aleatorio = new Random(semente);
        for (Obra obra : obras) {
            inserir(obra);
        }
    }

    public ResultadoBusca buscar(long id) {
        No atual = cabeca;
        long comparacoes = 0;
        for (int nivel = nivelAtual; nivel >= 0; nivel--) {
            while (atual.proximos[nivel] != null) {
                comparacoes++;
                if (atual.proximos[nivel].obra.id() >= id) {
                    break;
                }
                atual = atual.proximos[nivel];
            }
        }
        atual = atual.proximos[0];
        if (atual != null) {
            comparacoes++;
            if (atual.obra.id() == id) {
                return new ResultadoBusca(TipoBusca.LISTA_COM_SALTOS,
                        List.of(atual.obra), comparacoes, 0);
            }
        }
        return ResultadoBusca.vazio(TipoBusca.LISTA_COM_SALTOS, comparacoes);
    }

    private void inserir(Obra obra) {
        No[] anteriores = new No[NIVEL_MAXIMO + 1];
        No atual = cabeca;
        for (int nivel = nivelAtual; nivel >= 0; nivel--) {
            while (atual.proximos[nivel] != null
                    && atual.proximos[nivel].obra.id() < obra.id()) {
                atual = atual.proximos[nivel];
            }
            anteriores[nivel] = atual;
        }
        atual = atual.proximos[0];
        if (atual != null && atual.obra.id() == obra.id()) {
            throw new IllegalArgumentException("ID primário duplicado: " + obra.id());
        }

        int novoNivel = sortearNivel();
        if (novoNivel > nivelAtual) {
            for (int nivel = nivelAtual + 1; nivel <= novoNivel; nivel++) {
                anteriores[nivel] = cabeca;
            }
            nivelAtual = novoNivel;
        }
        No novo = new No(obra, novoNivel);
        for (int nivel = 0; nivel <= novoNivel; nivel++) {
            novo.proximos[nivel] = anteriores[nivel].proximos[nivel];
            anteriores[nivel].proximos[nivel] = novo;
        }
    }

    private int sortearNivel() {
        int nivel = 0;
        while (nivel < NIVEL_MAXIMO && aleatorio.nextBoolean()) {
            nivel++;
        }
        return nivel;
    }
}
