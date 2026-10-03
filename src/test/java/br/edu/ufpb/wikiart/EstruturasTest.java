package br.edu.ufpb.wikiart;

import br.edu.ufpb.wikiart.model.Obra;
import br.edu.ufpb.wikiart.structure.ArvoreAfunilada;
import br.edu.ufpb.wikiart.structure.ListaComSaltos;
import br.edu.ufpb.wikiart.structure.ListaMaisVistas;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;
import java.util.function.Function;
import java.util.stream.LongStream;

import static org.junit.jupiter.api.Assertions.*;

class EstruturasTest {
    private static Obra obra(long id) {
        return new Obra(id, "Obra " + id, "Artista", "Teste", "teste/" + id + ".jpg");
    }

    @Test
    void cargaEmLoteBalanceiaAArvore() {
        List<Long> chaves = LongStream.range(0, 42_500).boxed().toList();
        ArvoreAfunilada<Long, Long> arvore = ArvoreAfunilada.deOrdenados(chaves, Function.identity());
        assertEquals(42_500, arvore.tamanho());
        assertEquals(16, arvore.altura(), "ceil(log2(42.501)) = 16 níveis");
        ArvoreAfunilada.Acesso<Long> acesso = arvore.acessar(0L);
        assertTrue(acesso.comparacoes() <= 16, "Sem a carga balanceada seriam 42.500 comparações.");
        assertEquals(chaves, arvore.emOrdem());
        assertThrows(IllegalArgumentException.class, () -> ArvoreAfunilada.deOrdenados(List.of(2L, 1L), Function.identity()));
    }

    @Test
    void acessarAfunilaEConsultarNao() {
        ArvoreAfunilada<Long, Long> arvore = ArvoreAfunilada.deOrdenados(LongStream.range(0, 15).boxed().toList(), Function.identity());
        assertEquals(7L, arvore.chaveDaRaiz());
        assertEquals(3L, arvore.consultar(3L));
        assertNull(arvore.consultar(99L));
        assertEquals(7L, arvore.chaveDaRaiz(), "Consulta interna não muda a forma da árvore.");

        ArvoreAfunilada.Acesso<Long> acesso = arvore.acessar(3L);
        assertTrue(acesso.encontrou());
        assertTrue(acesso.rotacoes() > 0);
        assertEquals(3L, arvore.chaveDaRaiz());
        assertEquals(1, arvore.acessar(3L).comparacoes(), "O último acesso fica na raiz.");

        assertFalse(arvore.acessar(100L).encontrou());
        assertEquals(14L, arvore.chaveDaRaiz(), "Na ausência, afunila o último nó visitado.");
        assertEquals(LongStream.range(0, 15).boxed().toList(), arvore.emOrdem(), "Rotações preservam a ordem.");
    }

    @Test
    void insercaoClassicaComZigZigEZigZag() {
        ArvoreAfunilada<Integer, String> arvore = new ArvoreAfunilada<>();
        assertTrue(arvore.recentes(5, 3).isEmpty());
        assertEquals(0, arvore.altura());
        assertNull(arvore.chaveDaRaiz());
        int[] chaves = {50, 20, 80, 10, 30, 70, 90, 25, 35, 5};
        for (int chave : chaves) {
            arvore.inserir(chave, "v" + chave);
            assertEquals(chave, arvore.chaveDaRaiz());
        }
        assertThrows(IllegalArgumentException.class, () -> arvore.inserir(30, "dup"));
        List<String> ordem = arvore.emOrdem();
        assertEquals(List.of("v5", "v10", "v20", "v25", "v30", "v35", "v50", "v70", "v80", "v90"), ordem);
    }

    @Test
    void recentesSaoOsAcessadosMaisProximosDaRaiz() {
        ArvoreAfunilada<Long, Long> arvore = ArvoreAfunilada.deOrdenados(LongStream.range(0, 1_000).boxed().toList(), Function.identity());
        assertTrue(arvore.recentes(8, 8).isEmpty(), "Nada foi visto ainda.");
        arvore.acessar(500L);
        arvore.acessar(10L);
        arvore.acessar(900L);
        List<Long> recentes = arvore.recentes(8, 8);
        assertEquals(900L, recentes.getFirst());
        assertTrue(recentes.containsAll(List.of(10L, 500L)));
        assertEquals(List.of(900L), arvore.recentes(1, 8));
        assertTrue(arvore.recentes(0, 8).isEmpty());
    }

    @Test
    void skipListIndexavelAcertaQualquerPosicao() {
        ListaComSaltos<Integer, Integer> lista = new ListaComSaltos<>(7);
        List<Integer> chaves = new ArrayList<>();
        Random aleatorio = new Random(3);
        while (chaves.size() < 2_000) {
            int chave = aleatorio.nextInt(1_000_000);
            if (!chaves.contains(chave)) {
                chaves.add(chave);
                lista.inserir(chave, chave);
            }
        }
        List<Integer> ordenadas = chaves.stream().sorted().toList();
        assertEquals(ordenadas, lista.paraLista());
        for (int i = 0; i < ordenadas.size(); i += 37) {
            assertEquals(ordenadas.get(i), lista.obter(i));
        }
        assertEquals(ordenadas.subList(1_990, 2_000), lista.fatia(1_990, 50));
        assertTrue(lista.fatia(2_000, 5).isEmpty());
        assertTrue(lista.fatia(-1, 5).isEmpty());
        assertThrows(IndexOutOfBoundsException.class, () -> lista.obter(2_000));
        assertThrows(IllegalArgumentException.class, () -> lista.inserir(ordenadas.getFirst(), 0));
        assertTrue(lista.buscar(ordenadas.get(100)).encontrou());
        assertFalse(lista.buscar(-5).encontrou());
        assertFalse(new ListaComSaltos<Integer, Integer>(1).buscar(3).encontrou());
    }

    @Test
    void maisVistasTranspoeSoQuandoAFrequenciaJustifica() {
        ListaMaisVistas ranking = new ListaMaisVistas();
        Obra a = obra(1), b = obra(2), c = obra(3);
        for (int i = 0; i < 3; i++) ranking.registrar(a);
        ranking.registrar(b);
        ListaMaisVistas.Registro registro = ranking.registrar(c);
        assertEquals(3, registro.posicao(), "Primeira visualização entra no fim.");
        assertEquals(3, ranking.tamanho());

        registro = ranking.registrar(c);
        assertTrue(registro.transpos(), "c (2) passa b (1).");
        assertEquals(2, registro.posicao());

        registro = ranking.registrar(c);
        assertFalse(registro.transpos(), "c (3) empata com a (3) e não ultrapassa.");
        assertEquals(2, registro.posicao());

        registro = ranking.registrar(c);
        assertTrue(registro.transpos(), "c (4) passa a (3) e chega ao topo.");
        assertEquals(1, registro.posicao());
        assertEquals(List.of(c, a, b), ranking.primeiros(10).stream().map(ListaMaisVistas.Entrada::obra).toList());
        assertEquals(4, ranking.primeiros(1).getFirst().visualizacoes());

        ranking.registrar(b);
        ranking.registrar(b);
        assertEquals(List.of(c, a, b), ranking.primeiros(3).stream().map(ListaMaisVistas.Entrada::obra).toList());
        registro = ranking.registrar(b);
        assertTrue(registro.transpos(), "b (4) passa a (3); o último nó também pode subir.");
        assertEquals(List.of(c, b, a), ranking.primeiros(3).stream().map(ListaMaisVistas.Entrada::obra).toList());
    }
}
