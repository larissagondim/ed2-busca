package br.edu.ufpb.wikiart;

import org.junit.jupiter.api.Test;

import br.edu.ufpb.wikiart.model.Obra;
import br.edu.ufpb.wikiart.metric.EstatisticasAcumuladas;
import br.edu.ufpb.wikiart.metric.MedicaoBusca;
import br.edu.ufpb.wikiart.metric.MedidorBusca;
import br.edu.ufpb.wikiart.search.ResultadoBusca;
import br.edu.ufpb.wikiart.search.TipoBusca;
import br.edu.ufpb.wikiart.service.MotorDeBuscas;

import java.util.EnumSet;
import java.util.List;
import java.util.Set;

/* Testes sem biblioteca externa, para também rodarem nos laboratórios da disciplina. */
public final class BuscaTest {
    private static final Obra O30 = obra(30, "Guernica", "Pablo Picasso");
    private static final Obra O10 = obra(10, "Abaporu", "Tarsila do Amaral");
    private static final Obra O40 = obra(40, "Mona Lisa", "Leonardo da Vinci");
    private static final Obra O20 = obra(20, "O Mamoeiro", "Tarsila do Amaral");

    BuscaTest() {
    }

    @Test
    void validaTodasAsEstrategias() {
        main(new String[0]);
    }

    public static void main(String[] args) {
        MotorDeBuscas motor = novoMotor();
        Set<TipoBusca> exercitadas = EnumSet.noneOf(TipoBusca.class);

        verificarId(motor.sequencial(40), 40, exercitadas);
        verificarId(motor.sequencial(30), 30, exercitadas); // primeiro nó
        verificarId(motor.sequencial(20), 20, exercitadas); // último nó
        verificarId(motor.transposicao(40), 40, exercitadas);
        exigir(ids(motor.ordemTransposicao()).equals(List.of(30L, 40L, 10L, 20L)),
                "A transposição deve avançar exatamente uma posição.");

        verificarId(motor.moverParaInicio(20), 20, exercitadas);
        exigir(ids(motor.ordemMoverParaInicio()).equals(List.of(20L, 30L, 10L, 40L)),
                "A movimentação deve levar o nó encontrado ao início.");

        verificarId(motor.binaria(30), 30, exercitadas);
        verificarId(motor.interpolacao(30), 30, exercitadas);
        verificarId(motor.listaComSaltos(30), 30, exercitadas);
        verificarId(motor.arvoreAvl(30), 30, exercitadas);

        ResultadoBusca secundarias = motor.porArtista("tarsila do amaral");
        exercitadas.add(secundarias.tipo());
        exigir(secundarias.obras().size() == 2, "A chave secundária deve retornar todos os casamentos.");
        ResultadoBusca porArvore = motor.porArtistaAvl("Tarsila do Amaral");
        exercitadas.add(porArvore.tipo());
        exigir(porArvore.obras().equals(secundarias.obras()), "A AVL deve devolver as mesmas obras da busca sequencial.");

        verificarId(motor.piso(25), 20, exercitadas);
        verificarId(motor.teto(25), 30, exercitadas);

        ResultadoBusca intervalo = motor.intervalo(15, 35);
        exercitadas.add(intervalo.tipo());
        exigir(ids(intervalo.obras()).equals(List.of(20L, 30L)), "O intervalo deve incluir os limites.");

        verificarId(motor.dedilhada(40), 40, exercitadas);
        verificarId(motor.dedilhada(10), 10, exercitadas); // força a volta ao começo
        verificarId(motor.dedilhada(10), 10, exercitadas); // acesso repetido começa no dedo
        verificarId(motor.menorChave(), 10, exercitadas);
        verificarId(motor.maiorChave(), 40, exercitadas);

        testarAusencias();
        testarListaVazia();
        testarMetricas();
        exigir(exercitadas.equals(EnumSet.allOf(TipoBusca.class)), "As 14 buscas (e a variante em AVL) devem ser exercitadas.");
        System.out.println("OK — 14 buscas (e a chave secundária em AVL) validadas, incluindo ausências e catálogo vazio.");
    }

    private static void testarAusencias() {
        MotorDeBuscas motor = novoMotor();
        exigir(!motor.sequencial(999).encontrou(), "Sequencial não deve inventar um ID.");
        exigir(!motor.binaria(999).encontrou(), "Binária não deve inventar um ID.");
        exigir(!motor.interpolacao(999).encontrou(), "Interpolação não deve inventar um ID.");
        exigir(!motor.listaComSaltos(999).encontrou(), "Skip List não deve inventar um ID.");
        exigir(!motor.arvoreAvl(999).encontrou(), "A AVL não deve inventar um ID.");
        exigir(!motor.teto(999).encontrou(), "Não existe teto acima do maior ID.");
        exigir(!motor.piso(1).encontrou(), "Não existe piso abaixo do menor ID.");
    }

    private static void testarListaVazia() {
        MotorDeBuscas vazio = new MotorDeBuscas(List.of());
        exigir(!vazio.sequencial(1).encontrou(), "Lista vazia deve produzir resultado vazio.");
        exigir(!vazio.interpolacao(1).encontrou(), "Interpolação deve aceitar tabela vazia.");
        exigir(!vazio.arvoreAvl(1).encontrou(), "A AVL deve aceitar catálogo vazio.");
        exigir(!vazio.listaComSaltos(1).encontrou(), "Skip List deve aceitar tabela vazia.");
        exigir(!vazio.menorChave().encontrou(), "Lista vazia não tem menor chave.");
        exigir(!vazio.maiorChave().encontrou(), "Lista vazia não tem maior chave.");
    }

    private static void testarMetricas() {
        MedicaoBusca medicao = new MedidorBusca().medir(() -> novoMotor().sequencial(30));
        EstatisticasAcumuladas acumuladas = new EstatisticasAcumuladas(TipoBusca.SEQUENCIAL);
        acumuladas.registrar(medicao);
        exigir(medicao.tempoDecorridoNanos() >= 0, "O tempo decorrido deve ser medido.");
        exigir(acumuladas.buscas() == 1, "A sessão deve contar a busca executada.");
        exigir(acumuladas.sucessos() == 1, "A sessão deve contar o acerto.");
        exigir(acumuladas.eficaciaPercentual() == 100.0, "Uma busca com acerto tem eficácia de 100%.");
    }

    private static MotorDeBuscas novoMotor() {
        return new MotorDeBuscas(List.of(O30, O10, O40, O20));
    }

    private static void verificarId(ResultadoBusca resultado, long esperado, Set<TipoBusca> exercitadas) {
        exercitadas.add(resultado.tipo());
        exigir(resultado.primeira().orElseThrow().id() == esperado,
                resultado.tipo().nome() + " retornou o ID errado.");
    }

    private static List<Long> ids(List<Obra> obras) {
        return obras.stream().map(Obra::id).toList();
    }

    private static Obra obra(long id, String titulo, String artista) {
        return new Obra(id, titulo, artista, "Teste", "teste/" + id + ".jpg");
    }

    private static void exigir(boolean condicao, String mensagem) {
        if (!condicao) {
            throw new AssertionError(mensagem);
        }
    }
}
