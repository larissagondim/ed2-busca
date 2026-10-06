package br.edu.ufpb.wikiart.metric;

import br.edu.ufpb.wikiart.search.ResultadoBusca;

/* Uma execução medida sem misturar impressão ou leitura de arquivo ao algoritmo. */
public record MedicaoBusca(ResultadoBusca resultado, long tempoDecorridoNanos, long tempoCpuNanos) {
    public MedicaoBusca {
        if (tempoDecorridoNanos < 0 || tempoCpuNanos < -1) {
            throw new IllegalArgumentException("Tempos inválidos para uma medição.");
        }
    }

    public boolean possuiTempoCpu() {
        return tempoCpuNanos >= 0;
    }

    public double tempoDecorridoMicros() {
        return tempoDecorridoNanos / 1_000.0;
    }

    public double tempoCpuMicros() {
        return possuiTempoCpu() ? tempoCpuNanos / 1_000.0 : Double.NaN;
    }
}
