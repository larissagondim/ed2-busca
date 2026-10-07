package br.edu.ufpb.wikiart.metric;

import br.edu.ufpb.wikiart.search.ResultadoBusca;

import java.lang.management.ManagementFactory;
import java.lang.management.ThreadMXBean;
import java.util.function.Supplier;

/* Mede uma busca na thread atual e usa tempo de CPU somente quando a JVM oferece suporte. */
public final class MedidorBusca {
    private final ThreadMXBean threads = ManagementFactory.getThreadMXBean();
    private final boolean cpuDisponivel;

    public MedidorBusca() {
        cpuDisponivel = prepararTempoCpu();
    }

    public MedicaoBusca medir(Supplier<ResultadoBusca> operacao) {
        long cpuInicial = lerTempoCpu();
        long inicio = System.nanoTime();
        ResultadoBusca resultado = operacao.get();
        long fim = System.nanoTime();
        long cpuFinal = lerTempoCpu();

        long cpuConsumida = cpuInicial >= 0 && cpuFinal >= 0 ? cpuFinal - cpuInicial : -1;
        return new MedicaoBusca(resultado, fim - inicio, cpuConsumida);
    }

    private boolean prepararTempoCpu() {
        if (!threads.isCurrentThreadCpuTimeSupported()) {
            return false;
        }
        try {
            if (!threads.isThreadCpuTimeEnabled()) {
                threads.setThreadCpuTimeEnabled(true);
            }
            return threads.isThreadCpuTimeEnabled();
        } catch (SecurityException | UnsupportedOperationException erro) {
            // Tempo decorrido continua disponível; CPU é uma métrica opcional.
            return false;
        }
    }

    private long lerTempoCpu() {
        return cpuDisponivel ? threads.getCurrentThreadCpuTime() : -1;
    }
}
