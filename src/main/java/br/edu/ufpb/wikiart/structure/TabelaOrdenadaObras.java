package br.edu.ufpb.wikiart.structure;

import br.edu.ufpb.wikiart.model.Obra;

import java.util.Collection;
import java.util.Comparator;

/** Visão indexada e ordenada por ID, necessária às buscas que pulam posições. */
public final class TabelaOrdenadaObras {
    private final Obra[] obras;

    public TabelaOrdenadaObras(Collection<Obra> origem) {
        obras = origem.toArray(Obra[]::new);
        java.util.Arrays.sort(obras, Comparator.comparingLong(Obra::id));
        for (int i = 1; i < obras.length; i++) {
            if (obras[i - 1].id() == obras[i].id()) {
                throw new IllegalArgumentException("ID primário duplicado: " + obras[i].id());
            }
        }
    }

    public int tamanho() {
        return obras.length;
    }

    public Obra obter(int indice) {
        return obras[indice];
    }
}
