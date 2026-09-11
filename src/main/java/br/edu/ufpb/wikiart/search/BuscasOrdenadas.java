package br.edu.ufpb.wikiart.search;

import br.edu.ufpb.wikiart.model.Obra;
import br.edu.ufpb.wikiart.structure.TabelaOrdenadaObras;

import java.util.ArrayList;
import java.util.List;

/** Buscas que dependem de acesso direto a posições de uma tabela ordenada. */
public final class BuscasOrdenadas {
    private BuscasOrdenadas() {
    }

    public static ResultadoBusca binaria(TabelaOrdenadaObras tabela, long id) {
        int esquerda = 0;
        int direita = tabela.tamanho() - 1;
        long comparacoes = 0;
        while (esquerda <= direita) {
            // Esta forma evita overflow que poderia ocorrer em (esquerda + direita) / 2.
            int meio = esquerda + (direita - esquerda) / 2;
            long atual = tabela.obter(meio).id();
            comparacoes++;
            if (atual == id) {
                return unico(TipoBusca.BINARIA, tabela.obter(meio), comparacoes);
            }
            if (atual < id) {
                esquerda = meio + 1;
            } else {
                direita = meio - 1;
            }
        }
        return ResultadoBusca.vazio(TipoBusca.BINARIA, comparacoes);
    }

    public static ResultadoBusca interpolacao(TabelaOrdenadaObras tabela, long id) {
        int inferior = 0;
        int superior = tabela.tamanho() - 1;
        long comparacoes = 0;
        while (inferior <= superior && tabela.tamanho() > 0) {
            long menorId = tabela.obter(inferior).id();
            long maiorId = tabela.obter(superior).id();
            if (id < menorId || id > maiorId) {
                comparacoes++;
                break;
            }
            if (menorId == maiorId) {
                comparacoes++;
                return menorId == id
                        ? unico(TipoBusca.INTERPOLACAO, tabela.obter(inferior), comparacoes)
                        : ResultadoBusca.vazio(TipoBusca.INTERPOLACAO, comparacoes);
            }

            // Converter antes da subtração também protege IDs próximos aos limites de long.
            double fracao = ((double) id - menorId) / ((double) maiorId - menorId);
            int posicao = inferior + (int) ((superior - inferior) * fracao);
            long atual = tabela.obter(posicao).id();
            comparacoes++;
            if (atual == id) {
                return unico(TipoBusca.INTERPOLACAO, tabela.obter(posicao), comparacoes);
            }
            if (atual < id) {
                inferior = posicao + 1;
            } else {
                superior = posicao - 1;
            }
        }
        return ResultadoBusca.vazio(TipoBusca.INTERPOLACAO, comparacoes);
    }

    public static ResultadoBusca fibonacci(TabelaOrdenadaObras tabela, long id) {
        int n = tabela.tamanho();
        int fibAnterior2 = 0;
        int fibAnterior1 = 1;
        int fibAtual = fibAnterior1;
        while (fibAtual < n) {
            fibAnterior2 = fibAnterior1;
            fibAnterior1 = fibAtual;
            fibAtual = fibAnterior1 + fibAnterior2;
        }

        int deslocamento = -1;
        long comparacoes = 0;
        while (fibAtual > 1) {
            int indice = Math.min(deslocamento + fibAnterior2, n - 1);
            long atual = tabela.obter(indice).id();
            comparacoes++;
            if (atual < id) {
                fibAtual = fibAnterior1;
                fibAnterior1 = fibAnterior2;
                fibAnterior2 = fibAtual - fibAnterior1;
                deslocamento = indice;
            } else if (atual > id) {
                fibAtual = fibAnterior2;
                fibAnterior1 = fibAnterior1 - fibAnterior2;
                fibAnterior2 = fibAtual - fibAnterior1;
            } else {
                return unico(TipoBusca.FIBONACCI, tabela.obter(indice), comparacoes);
            }
        }
        if (fibAnterior1 == 1 && deslocamento + 1 < n) {
            comparacoes++;
            if (tabela.obter(deslocamento + 1).id() == id) {
                return unico(TipoBusca.FIBONACCI, tabela.obter(deslocamento + 1), comparacoes);
            }
        }
        return ResultadoBusca.vazio(TipoBusca.FIBONACCI, comparacoes);
    }

    public static ResultadoBusca piso(TabelaOrdenadaObras tabela, long id) {
        int esquerda = 0;
        int direita = tabela.tamanho() - 1;
        int melhor = -1;
        long comparacoes = 0;
        while (esquerda <= direita) {
            int meio = esquerda + (direita - esquerda) / 2;
            comparacoes++;
            if (tabela.obter(meio).id() <= id) {
                melhor = meio;
                esquerda = meio + 1;
            } else {
                direita = meio - 1;
            }
        }
        return melhor < 0 ? ResultadoBusca.vazio(TipoBusca.PISO, comparacoes)
                : unico(TipoBusca.PISO, tabela.obter(melhor), comparacoes);
    }

    public static ResultadoBusca teto(TabelaOrdenadaObras tabela, long id) {
        int esquerda = 0;
        int direita = tabela.tamanho() - 1;
        int melhor = -1;
        long comparacoes = 0;
        while (esquerda <= direita) {
            int meio = esquerda + (direita - esquerda) / 2;
            comparacoes++;
            if (tabela.obter(meio).id() >= id) {
                melhor = meio;
                direita = meio - 1;
            } else {
                esquerda = meio + 1;
            }
        }
        return melhor < 0 ? ResultadoBusca.vazio(TipoBusca.TETO, comparacoes)
                : unico(TipoBusca.TETO, tabela.obter(melhor), comparacoes);
    }

    public static ResultadoBusca intervalo(TabelaOrdenadaObras tabela, long inicio, long fim) {
        if (inicio > fim) {
            throw new IllegalArgumentException("O início do intervalo deve ser menor ou igual ao fim.");
        }
        Limite inferior = primeiroMaiorOuIgual(tabela, inicio);
        Limite superior = primeiroMaiorQue(tabela, fim);
        List<Obra> obras = new ArrayList<>();
        for (int i = inferior.indice; i < superior.indice; i++) {
            obras.add(tabela.obter(i));
        }
        return new ResultadoBusca(TipoBusca.INTERVALO, obras,
                inferior.comparacoes + superior.comparacoes, 0);
    }

    private static Limite primeiroMaiorOuIgual(TabelaOrdenadaObras tabela, long id) {
        int esquerda = 0;
        int direita = tabela.tamanho();
        long comparacoes = 0;
        while (esquerda < direita) {
            int meio = esquerda + (direita - esquerda) / 2;
            comparacoes++;
            if (tabela.obter(meio).id() < id) {
                esquerda = meio + 1;
            } else {
                direita = meio;
            }
        }
        return new Limite(esquerda, comparacoes);
    }

    private static Limite primeiroMaiorQue(TabelaOrdenadaObras tabela, long id) {
        int esquerda = 0;
        int direita = tabela.tamanho();
        long comparacoes = 0;
        while (esquerda < direita) {
            int meio = esquerda + (direita - esquerda) / 2;
            comparacoes++;
            if (tabela.obter(meio).id() <= id) {
                esquerda = meio + 1;
            } else {
                direita = meio;
            }
        }
        return new Limite(esquerda, comparacoes);
    }

    private static ResultadoBusca unico(TipoBusca tipo, Obra obra, long comparacoes) {
        return new ResultadoBusca(tipo, List.of(obra), comparacoes, 0);
    }

    private record Limite(int indice, long comparacoes) {
    }
}
