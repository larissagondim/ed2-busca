package br.edu.ufpb.wikiart.service;

import br.edu.ufpb.wikiart.metric.*;
import br.edu.ufpb.wikiart.model.Obra;
import br.edu.ufpb.wikiart.search.*;

import java.util.*;
import java.util.function.Supplier;

public final class SessaoBusca {
    public static final List<TipoBusca> TIPOS = List.of(TipoBusca.SEQUENCIAL, TipoBusca.TRANSPOSICAO, TipoBusca.MOVER_PARA_INICIO, TipoBusca.BINARIA, TipoBusca.INTERPOLACAO, TipoBusca.LISTA_COM_SALTOS, TipoBusca.FIBONACCI, TipoBusca.DEDILHADA);
    private final CatalogoService catalogo;
    private final MedidorBusca medidor = new MedidorBusca();
    private String periodo;
    private MotorDeBuscas motor;
    private Map<TipoBusca, EstatisticasAcumuladas> acumulados;

    public SessaoBusca(CatalogoService catalogo) { this.catalogo = catalogo; reiniciar(null); }
    public synchronized void reiniciar(String periodo) {
        List<Obra> subconjunto = catalogo.obras(periodo);
        this.periodo = periodo == null || periodo.isBlank() ? null : periodo;
        motor = new MotorDeBuscas(subconjunto);
        acumulados = new EnumMap<>(TipoBusca.class);
        TIPOS.forEach(tipo -> acumulados.put(tipo, new EstatisticasAcumuladas(tipo)));
    }
    public synchronized Comparacao comparar(long id) {
        Obra obra = catalogo.porId(id);
        if (!catalogo.pertence(obra, periodo)) throw new RecursoNaoEncontrado("OBRA_FORA_DO_FILTRO", "A obra não pertence ao período selecionado.");
        List<Supplier<ResultadoBusca>> operacoes = List.of(() -> motor.sequencial(id), () -> motor.transposicao(id), () -> motor.moverParaInicio(id), () -> motor.binaria(id), () -> motor.interpolacao(id), () -> motor.listaComSaltos(id), () -> motor.fibonacci(id), () -> motor.dedilhada(id));
        List<MedicaoDto> medicoes = new ArrayList<>();
        for (Supplier<ResultadoBusca> operacao : operacoes) {
            MedicaoBusca medicao = medidor.medir(operacao);
            acumulados.get(medicao.resultado().tipo()).registrar(medicao);
            medicoes.add(MedicaoDto.de(medicao));
        }
        return new Comparacao(obra, List.copyOf(medicoes), resumo());
    }
    public Comparacao compararCodigo(String codigo) { return comparar(catalogo.porCodigo(codigo).id()); }
    public synchronized Resumo resumo() { return new Resumo(periodo, catalogo.obras(periodo).size(), acumulados.values().stream().map(AcumuladoDto::de).toList()); }
    public String periodo() { return periodo; }
    public record Comparacao(Obra obra, List<MedicaoDto> medicoes, Resumo resumo) {}
    public record MedicaoDto(String tipo, String nome, boolean encontrou, long comparacoes, long reorganizacoes, double tempoMicros, Double cpuMicros) {
        static MedicaoDto de(MedicaoBusca m) { ResultadoBusca r = m.resultado(); return new MedicaoDto(r.tipo().name(), r.tipo().nome(), r.encontrou(), r.comparacoes(), r.reorganizacoes(), m.tempoDecorridoMicros(), m.possuiTempoCpu() ? m.tempoCpuMicros() : null); }
    }
    public record AcumuladoDto(String tipo, String nome, long buscas, long sucessos, long comparacoes, long reorganizacoes, double eficaciaPercentual, double mediaComparacoes, double mediaTempoMicros, Double mediaCpuMicros) {
        static AcumuladoDto de(EstatisticasAcumuladas e) { double cpu = e.mediaCpuMicros(); return new AcumuladoDto(e.tipo().name(), e.tipo().nome(), e.buscas(), e.sucessos(), e.comparacoes(), e.reorganizacoes(), e.eficaciaPercentual(), e.mediaComparacoes(), e.mediaTempoMicros(), Double.isNaN(cpu) ? null : cpu); }
    }
    public record Resumo(String periodo, int quantidadeObras, List<AcumuladoDto> estrategias) {}
}
