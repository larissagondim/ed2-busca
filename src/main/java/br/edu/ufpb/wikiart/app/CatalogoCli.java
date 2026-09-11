package br.edu.ufpb.wikiart.app;

import br.edu.ufpb.wikiart.data.LeitorCatalogoCsv;
import br.edu.ufpb.wikiart.metric.EstatisticasAcumuladas;
import br.edu.ufpb.wikiart.metric.MedicaoBusca;
import br.edu.ufpb.wikiart.metric.MedidorBusca;
import br.edu.ufpb.wikiart.model.Obra;
import br.edu.ufpb.wikiart.search.ResultadoBusca;
import br.edu.ufpb.wikiart.search.TipoBusca;
import br.edu.ufpb.wikiart.service.MotorDeBuscas;

import java.io.IOException;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.OptionalLong;
import java.util.Scanner;
import java.util.function.Supplier;

/** Interface contínua para comparar as buscas de ID usando a mesma sequência de consultas. */
public final class CatalogoCli {
    private static final List<TipoBusca> BUSCAS_POR_ID = List.of(
            TipoBusca.SEQUENCIAL,
            TipoBusca.TRANSPOSICAO,
            TipoBusca.MOVER_PARA_INICIO,
            TipoBusca.BINARIA,
            TipoBusca.INTERPOLACAO,
            TipoBusca.LISTA_COM_SALTOS,
            TipoBusca.FIBONACCI,
            TipoBusca.DEDILHADA
    );

    private CatalogoCli() {
    }

    public static void main(String[] args) throws IOException {
        Path csv = Path.of(args.length == 0 ? "data/amostra-classes.csv" : args[0]);
        List<Obra> obras = new LeitorCatalogoCsv().ler(csv);
        MotorDeBuscas motor = new MotorDeBuscas(obras);

        // Uma única instância evita que buffers de vários Scanners disputem System.in.
        try (Scanner entrada = new Scanner(System.in)) {
            executarSessao(entrada, motor, obras.size());
        }
    }

    static void executarSessao(Scanner entrada, MotorDeBuscas motor, int totalObras) {
        MedidorBusca medidor = new MedidorBusca();
        Map<TipoBusca, EstatisticasAcumuladas> estatisticas = criarEstatisticas();
        long idsConsultados = 0;

        System.out.printf("Catálogo carregado com %,d obras.%n", totalObras);
        System.out.println("Informe um ID e as 8 buscas de chave primária serão comparadas.");
        System.out.println("Use -1 para encerrar e ver o resumo, ou Ctrl+C para interromper.");

        while (true) {
            OptionalLong leitura = lerId(entrada);
            if (leitura.isEmpty()) {
                // EOF também termina de modo limpo, algo útil ao redirecionar um arquivo para a CLI.
                mostrarResumo(estatisticas, idsConsultados);
                return;
            }
            long id = leitura.getAsLong();
            if (id == -1) {
                mostrarResumo(estatisticas, idsConsultados);
                return;
            }
            if (id < -1) {
                System.out.println("O ID não pode ser negativo. Digite -1 somente quando quiser sair.");
                continue;
            }

            idsConsultados++;
            List<MedicaoBusca> medicoes = executarBuscas(motor, medidor, id);
            medicoes.forEach(medicao -> estatisticas.get(medicao.resultado().tipo()).registrar(medicao));
            mostrarConsulta(id, idsConsultados, medicoes, estatisticas);
        }
    }

    private static List<MedicaoBusca> executarBuscas(MotorDeBuscas motor, MedidorBusca medidor, long id) {
        List<Supplier<ResultadoBusca>> operacoes = List.of(
                () -> motor.sequencial(id),
                () -> motor.transposicao(id),
                () -> motor.moverParaInicio(id),
                () -> motor.binaria(id),
                () -> motor.interpolacao(id),
                () -> motor.listaComSaltos(id),
                () -> motor.fibonacci(id),
                () -> motor.dedilhada(id)
        );
        List<MedicaoBusca> medicoes = new ArrayList<>(operacoes.size());
        for (Supplier<ResultadoBusca> operacao : operacoes) {
            medicoes.add(medidor.medir(operacao));
        }
        return List.copyOf(medicoes);
    }

    private static void mostrarConsulta(
            long id,
            long numeroConsulta,
            List<MedicaoBusca> medicoes,
            Map<TipoBusca, EstatisticasAcumuladas> estatisticas
    ) {
        Obra encontrada = medicoes.stream()
                .flatMap(medicao -> medicao.resultado().primeira().stream())
                .findFirst()
                .orElse(null);

        System.out.printf("%nConsulta %,d — ID %d: %s%n", numeroConsulta, id,
                encontrada == null ? "obra não encontrada" : "obra encontrada");
        if (encontrada != null) {
            System.out.printf("Obra: %s — %s [%s]%n",
                    encontrada.titulo(), encontrada.artista(), encontrada.estilo());
            System.out.printf("Imagem: %s%n", encontrada.caminhoImagem());
        }

        System.out.println();
        System.out.printf("%-50s %7s %11s %8s %11s %10s %7s %9s%n",
                "Busca", "Achou?", "Interações", "Reord.", "Tempo µs", "CPU µs", "Buscas", "Eficácia");
        System.out.println("-".repeat(122));
        for (MedicaoBusca medicao : medicoes) {
            EstatisticasAcumuladas acumulada = estatisticas.get(medicao.resultado().tipo());
            String cpu = medicao.possuiTempoCpu()
                    ? String.format("%.2f", medicao.tempoCpuMicros())
                    : "n/d";
            System.out.printf("%-50s %7s %,11d %,8d %,11.2f %10s %,7d %8.1f%%%n",
                    medicao.resultado().tipo().nome(),
                    medicao.resultado().encontrou() ? "sim" : "não",
                    medicao.resultado().comparacoes(),
                    medicao.resultado().reorganizacoes(),
                    medicao.tempoDecorridoMicros(),
                    cpu,
                    acumulada.buscas(),
                    acumulada.eficaciaPercentual());
        }
        System.out.println("Interações correspondem às comparações de chaves feitas pelo algoritmo.");
    }

    private static void mostrarResumo(
            Map<TipoBusca, EstatisticasAcumuladas> estatisticas,
            long idsConsultados
    ) {
        System.out.printf("%nResumo da sessão — %,d ID(s) consultado(s), %,d execução(ões) de busca.%n",
                idsConsultados, idsConsultados * BUSCAS_POR_ID.size());
        if (idsConsultados == 0) {
            System.out.println("Nenhuma busca foi executada.");
            return;
        }
        System.out.printf("%-50s %7s %9s %13s %12s %12s %11s%n",
                "Busca", "Buscas", "Eficácia", "Média inter.", "Reord. total", "Tempo méd.", "CPU méd.");
        System.out.println("-".repeat(125));
        for (TipoBusca tipo : BUSCAS_POR_ID) {
            EstatisticasAcumuladas e = estatisticas.get(tipo);
            String cpu = Double.isNaN(e.mediaCpuMicros()) ? "n/d" : String.format("%.2f µs", e.mediaCpuMicros());
            System.out.printf("%-50s %,7d %8.1f%% %,13.2f %,12d %,9.2f µs %11s%n",
                    tipo.nome(), e.buscas(), e.eficaciaPercentual(), e.mediaComparacoes(),
                    e.reorganizacoes(), e.mediaTempoMicros(), cpu);
        }
    }

    private static Map<TipoBusca, EstatisticasAcumuladas> criarEstatisticas() {
        Map<TipoBusca, EstatisticasAcumuladas> estatisticas = new EnumMap<>(TipoBusca.class);
        BUSCAS_POR_ID.forEach(tipo -> estatisticas.put(tipo, new EstatisticasAcumuladas(tipo)));
        return estatisticas;
    }

    private static OptionalLong lerId(Scanner entrada) {
        while (true) {
            System.out.println();
            System.out.print("ID da obra (-1 encerra): ");
            System.out.flush();
            if (!entrada.hasNextLine()) {
                return OptionalLong.empty();
            }
            String texto = entrada.nextLine().strip();
            try {
                return OptionalLong.of(Long.parseLong(texto));
            } catch (NumberFormatException erro) {
                System.out.println("Digite um ID inteiro válido.");
            }
        }
    }
}
