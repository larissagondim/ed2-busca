package br.edu.ufpb.wikiart.metric;

import br.edu.ufpb.wikiart.search.TipoBusca;

/* Acumula a história da sessão para mostrar se uma estratégia melhora com repetição. */
public final class EstatisticasAcumuladas {
    private final TipoBusca tipo;
    private long buscas;
    private long sucessos;
    private long comparacoes;
    private long reorganizacoes;
    private long tempoDecorridoNanos;
    private long tempoCpuNanos;
    private long medicoesCpu;

    public EstatisticasAcumuladas(TipoBusca tipo) {
        this.tipo = tipo;
    }

    public void registrar(MedicaoBusca medicao) {
        if (medicao.resultado().tipo() != tipo) {
            throw new IllegalArgumentException("A medição pertence a outro tipo de busca.");
        }
        buscas++;
        if (medicao.resultado().encontrou()) {
            sucessos++;
        }
        comparacoes += medicao.resultado().comparacoes();
        reorganizacoes += medicao.resultado().reorganizacoes();
        tempoDecorridoNanos += medicao.tempoDecorridoNanos();
        if (medicao.possuiTempoCpu()) {
            tempoCpuNanos += medicao.tempoCpuNanos();
            medicoesCpu++;
        }
    }

    public TipoBusca tipo() {
        return tipo;
    }

    public long buscas() {
        return buscas;
    }

    public long sucessos() {
        return sucessos;
    }

    public long comparacoes() {
        return comparacoes;
    }

    public long reorganizacoes() {
        return reorganizacoes;
    }

    public double eficaciaPercentual() {
        return buscas == 0 ? 0 : 100.0 * sucessos / buscas;
    }

    public double mediaComparacoes() {
        return buscas == 0 ? 0 : (double) comparacoes / buscas;
    }

    public double mediaTempoMicros() {
        return buscas == 0 ? 0 : tempoDecorridoNanos / 1_000.0 / buscas;
    }

    public double mediaCpuMicros() {
        return medicoesCpu == 0 ? Double.NaN : tempoCpuNanos / 1_000.0 / medicoesCpu;
    }
}
