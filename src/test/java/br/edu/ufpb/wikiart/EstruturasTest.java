package br.edu.ufpb.wikiart;

import br.edu.ufpb.wikiart.model.Obra;
import br.edu.ufpb.wikiart.structure.ListaComSaltos;
import br.edu.ufpb.wikiart.structure.ListaMaisVistas;
import br.edu.ufpb.wikiart.structure.ListaRecentes;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;

import static org.junit.jupiter.api.Assertions.*;

class EstruturasTest {
    private static Obra obra(long id) {
        return new Obra(id, "Obra " + id, "Artista", "Teste", "teste/" + id + ".jpg");
    }

    @Test
    void recentesMovemParaOInicioEDescartamOMaisAntigo() {
        ListaRecentes recentes = new ListaRecentes(3);
        Obra a = obra(1), b = obra(2), c = obra(3), d = obra(4);
        assertTrue(recentes.primeiros(5).isEmpty(), "Nada foi visto ainda.");
        recentes.registrar(a);
        recentes.registrar(b);
        recentes.registrar(c);
        assertEquals(List.of(c, b, a), recentes.primeiros(5));
        recentes.registrar(a);
        assertEquals(List.of(a, c, b), recentes.primeiros(5), "Rever uma obra a leva ao início sem duplicar.");
        recentes.registrar(d);
        assertEquals(List.of(d, a, c), recentes.primeiros(5), "Acima da capacidade, sai a vista há mais tempo.");
        assertEquals(3, recentes.tamanho());
        assertEquals(List.of(d), recentes.primeiros(1));
        assertTrue(recentes.primeiros(0).isEmpty());

        ListaRecentes unica = new ListaRecentes(1);
        unica.registrar(a);
        unica.registrar(b);
        assertEquals(List.of(b), unica.primeiros(5));
        assertThrows(IllegalArgumentException.class, () -> new ListaRecentes(0));
    }

    @Test
    void skipListOrdenaPorTextoParaOsPeriodos() {
        ListaComSaltos<String, String> periodos = new ListaComSaltos<>(1);
        for (String slug : List.of("romantismo", "barroco", "cubismo")) periodos.inserir(slug, slug);
        assertEquals(List.of("barroco", "cubismo", "romantismo"), periodos.paraLista());
        assertEquals("cubismo", periodos.buscar("cubismo").valor());
        assertNull(periodos.buscar("x").valor());
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
