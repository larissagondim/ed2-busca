package br.edu.ufpb.wikiart.service;

import br.edu.ufpb.wikiart.metric.*;
import br.edu.ufpb.wikiart.model.Obra;
import br.edu.ufpb.wikiart.search.*;

import java.util.*;
import java.util.function.Supplier;

public final class SessaoBusca {
    public static final List<TipoBusca> TIPOS = List.of(TipoBusca.SEQUENCIAL, TipoBusca.TRANSPOSICAO, TipoBusca.MOVER_PARA_INICIO, TipoBusca.BINARIA, TipoBusca.INTERPOLACAO, TipoBusca.LISTA_COM_SALTOS, TipoBusca.FIBONACCI, TipoBusca.DEDILHADA, TipoBusca.ARVORE_AFUNILADA);
    private final CatalogoService catalogo;
    private final MedidorBusca medidor = new MedidorBusca();
    private String periodo;
    private MotorDeBuscas motor;
    /** Uma posição por estratégia, na mesma ordem de {@link #TIPOS}. */
    private EstatisticasAcumuladas[] acumulados;

    public SessaoBusca(CatalogoService catalogo) { this.catalogo = catalogo; reiniciar(null); }
    public synchronized void reiniciar(String periodo) {
        List<Obra> subconjunto = catalogo.obras(periodo);
        this.periodo = periodo == null || periodo.isBlank() ? null : periodo;
        motor = new MotorDeBuscas(subconjunto);
        acumulados = new EstatisticasAcumuladas[TIPOS.size()];
        for (int i = 0; i < TIPOS.size(); i++) acumulados[i] = new EstatisticasAcumuladas(TIPOS.get(i));
    }
    public Comparacao comparar(long id) { return comparar(id, TIPOS); }
    /** Executa só as estratégias pedidas, sempre na ordem de {@link #TIPOS}, e acumula apenas essas. */
    public synchronized Comparacao comparar(long id, Collection<TipoBusca> tipos) {
        if (tipos.isEmpty() || !TIPOS.containsAll(tipos)) throw new IllegalArgumentException("Escolha ao menos uma das nove buscas exatas.");
        Obra obra = catalogo.porId(id);
        if (!catalogo.pertence(obra, periodo)) throw new RecursoNaoEncontrado("OBRA_FORA_DO_FILTRO", "A obra não pertence ao período selecionado.");
        List<MedicaoDto> medicoes = new ArrayList<>();
        for (int i = 0; i < TIPOS.size(); i++) {
            TipoBusca tipo = TIPOS.get(i);
            if (!tipos.contains(tipo)) continue;
            MedicaoBusca medicao = medidor.medir(operacao(tipo, id));
            acumulados[i].registrar(medicao);
            medicoes.add(MedicaoDto.de(medicao));
        }
        return new Comparacao(obra, List.copyOf(medicoes), resumo());
    }
    public Comparacao compararCodigo(String codigo) { return compararCodigo(codigo, TIPOS); }
    public Comparacao compararCodigo(String codigo, Collection<TipoBusca> tipos) { return comparar(catalogo.porCodigo(codigo).id(), tipos); }
    private Supplier<ResultadoBusca> operacao(TipoBusca tipo, long id) {
        return switch (tipo) {
            case SEQUENCIAL -> () -> motor.sequencial(id);
            case TRANSPOSICAO -> () -> motor.transposicao(id);
            case MOVER_PARA_INICIO -> () -> motor.moverParaInicio(id);
            case BINARIA -> () -> motor.binaria(id);
            case INTERPOLACAO -> () -> motor.interpolacao(id);
            case LISTA_COM_SALTOS -> () -> motor.listaComSaltos(id);
            case FIBONACCI -> () -> motor.fibonacci(id);
            case DEDILHADA -> () -> motor.dedilhada(id);
            case ARVORE_AFUNILADA -> () -> motor.arvoreAfunilada(id);
            default -> throw new IllegalArgumentException("Busca sem chave exata: " + tipo);
        };
    }
    /** As seis consultas que não procuram uma chave exata: respondem com várias obras ou com um extremo. */
    public static final List<TipoBusca> CONSULTAS = List.of(TipoBusca.CHAVE_SECUNDARIA, TipoBusca.PISO, TipoBusca.TETO, TipoBusca.INTERVALO, TipoBusca.MENOR_CHAVE, TipoBusca.MAIOR_CHAVE);
    private static final int LIMITE_CONSULTA = 24;
    /** Roda a consulta no subconjunto da sessão; não entra nos acumulados das buscas exatas. */
    public synchronized Consulta consultar(TipoBusca tipo, String artista, Long inicio, Long fim) {
        Supplier<ResultadoBusca> operacao = switch (tipo) {
            case CHAVE_SECUNDARIA -> () -> motor.porArtista(artista);
            case PISO -> () -> motor.piso(inicio);
            case TETO -> () -> motor.teto(inicio);
            case INTERVALO -> () -> motor.intervalo(inicio, fim);
            case MENOR_CHAVE -> motor::menorChave;
            case MAIOR_CHAVE -> motor::maiorChave;
            default -> throw new IllegalArgumentException("Não é uma consulta: " + tipo);
        };
        MedicaoBusca medicao = medidor.medir(operacao);
        List<Obra> obras = medicao.resultado().obras();
        return new Consulta(tipo.name(), tipo.nome(), List.copyOf(obras.subList(0, Math.min(LIMITE_CONSULTA, obras.size()))), obras.size(), medicao.resultado().comparacoes(), medicao.tempoDecorridoMicros());
    }
    public record Consulta(String tipo, String nome, List<Obra> obras, int total, long comparacoes, double tempoMicros) {}
    public synchronized Resumo resumo() { return new Resumo(periodo, catalogo.obras(periodo).size(), Arrays.stream(acumulados).map(AcumuladoDto::de).toList()); }
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
