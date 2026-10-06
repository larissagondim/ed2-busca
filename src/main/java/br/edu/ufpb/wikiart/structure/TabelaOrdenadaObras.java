package br.edu.ufpb.wikiart.structure;

import br.edu.ufpb.wikiart.model.Obra;

import java.util.List;

/**
 * Visão indexada e ordenada por ID, necessária às buscas que pulam posições.
 *
 * <p>Nenhuma ordenação acontece aqui: o vetor é preenchido a partir de uma
 * sequência que já vem ordenada (o nível 0 da {@link ListaComSaltos} por ID), e o
 * construtor apenas confere que os IDs são estritamente crescentes. Isso custa
 * O(n), contra O(n log n) de ordenar de novo.
 */
public final class TabelaOrdenadaObras {
    private final Obra[] obras;

    public TabelaOrdenadaObras(List<Obra> ordenadasPorId) {
        obras = ordenadasPorId.toArray(Obra[]::new);
        for (int i = 1; i < obras.length; i++) {
            if (obras[i - 1].id() == obras[i].id()) {
                throw new IllegalArgumentException("ID primário duplicado: " + obras[i].id());
            }
            if (obras[i - 1].id() > obras[i].id()) {
                throw new IllegalArgumentException("As obras devem chegar ordenadas por ID.");
            }
        }
    }

    public int tamanho() {
        return obras.length;
    }

    public Obra obter(int indice) {
        // Acesso direto em O(1), usado pelas buscas binária e por interpolação.
        return obras[indice];
    }
}
