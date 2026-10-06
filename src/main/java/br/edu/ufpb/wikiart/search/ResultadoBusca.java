package br.edu.ufpb.wikiart.search;

import br.edu.ufpb.wikiart.model.Obra;

import java.util.List;
import java.util.Optional;

/*
 * Resultado e métricas viajam juntos para ninguém precisar medir o algoritmo
 * imprimindo mensagens no meio da busca — I/O distorceria o experimento.
 */
public record ResultadoBusca(
        TipoBusca tipo,
        List<Obra> obras,
        long comparacoes,
        long reorganizacoes
) {
    public ResultadoBusca {
        obras = List.copyOf(obras);
        if (comparacoes < 0 || reorganizacoes < 0) {
            throw new IllegalArgumentException("As métricas não podem ser negativas.");
        }
    }

    public boolean encontrou() {
        return !obras.isEmpty();
    }

    public Optional<Obra> primeira() {
        return obras.stream().findFirst();
    }

    public static ResultadoBusca vazio(TipoBusca tipo, long comparacoes) {
        return new ResultadoBusca(tipo, List.of(), comparacoes, 0);
    }
}
