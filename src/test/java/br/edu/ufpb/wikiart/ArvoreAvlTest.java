package br.edu.ufpb.wikiart;

import br.edu.ufpb.wikiart.data.LeitorCatalogoCsv;
import br.edu.ufpb.wikiart.model.Obra;
import br.edu.ufpb.wikiart.search.ResultadoBusca;
import br.edu.ufpb.wikiart.service.CatalogoService;
import br.edu.ufpb.wikiart.service.MotorDeBuscas;
import br.edu.ufpb.wikiart.service.RecursoNaoEncontrado;
import br.edu.ufpb.wikiart.structure.ArvoreAvlArtistas;
import br.edu.ufpb.wikiart.structure.ArvoreAvlArtistas.Artista;
import br.edu.ufpb.wikiart.structure.ArvoreBuscaBinariaArtistas;
import org.junit.jupiter.api.Test;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

import static org.junit.jupiter.api.Assertions.*;
import static org.junit.jupiter.api.Assumptions.assumeTrue;

class ArvoreAvlTest {
    private static long proximoId;

    private static Obra obra(String artista) {
        long id = proximoId++;
        return new Obra(id, "cod-" + id, "Obra " + id, artista, "Teste", "teste/" + id + ".jpg");
    }

    private static ArvoreAvlArtistas avl(String... artistas) {
        ArvoreAvlArtistas arvore = new ArvoreAvlArtistas();
        for (String artista : artistas) arvore.inserir(obra(artista));
        return arvore;
    }

    private static String nome(int i) {
        return String.format("artista %05d", i);
    }

    /* Verificador recursivo: ordem da ABB, alturas, tamanhos de subárvore e fator de balanceamento. */
    private static int verificar(ArvoreAvlArtistas.No no, String minimo, String maximo) {
        if (no == null) return 0;
        if (minimo != null) assertTrue(no.chave().compareTo(minimo) > 0, "ordem da ABB violada em " + no.chave());
        if (maximo != null) assertTrue(no.chave().compareTo(maximo) < 0, "ordem da ABB violada em " + no.chave());
        int esquerda = verificar(no.esquerda(), minimo, no.chave());
        int direita = verificar(no.direita(), no.chave(), maximo);
        assertEquals(1 + Math.max(altura(no.esquerda()), altura(no.direita())), no.altura(), "altura de " + no.chave());
        int fator = altura(no.esquerda()) - altura(no.direita());
        assertTrue(fator >= -1 && fator <= 1, "fator de balanceamento " + fator + " em " + no.chave());
        assertEquals(1 + esquerda + direita, no.tamanhoSubarvore(), "tamanho da subárvore de " + no.chave());
        return no.tamanhoSubarvore();
    }

    private static int altura(ArvoreAvlArtistas.No no) {
        return no == null ? 0 : no.altura();
    }

    private static void exigirAlturaAvl(ArvoreAvlArtistas arvore, int n) {
        verificar(arvore.raiz(), null, null);
        assertEquals(n, arvore.tamanho());
        double limite = 1.4405 * Math.log(n + 2) / Math.log(2) - 0.3277;
        assertTrue(arvore.altura() <= limite + 1e-9, "altura " + arvore.altura() + " acima de " + limite);
    }

    @Test
    void mantemInvariantesEmInsercaoCrescenteDecrescenteEAleatoria() {
        int n = 3000;
        ArvoreAvlArtistas crescente = new ArvoreAvlArtistas();
        ArvoreAvlArtistas decrescente = new ArvoreAvlArtistas();
        ArvoreAvlArtistas aleatoria = new ArvoreAvlArtistas();
        List<Integer> embaralhado = new ArrayList<>();
        for (int i = 0; i < n; i++) embaralhado.add(i);
        java.util.Collections.shuffle(embaralhado, new Random(7)); // só prepara a entrada do teste
        for (int i = 0; i < n; i++) {
            crescente.inserir(obra(nome(i)));
            decrescente.inserir(obra(nome(n - i)));
            aleatoria.inserir(obra(nome(embaralhado.get(i))));
        }
        exigirAlturaAvl(crescente, n);
        exigirAlturaAvl(decrescente, n);
        exigirAlturaAvl(aleatoria, n);
        assertTrue(crescente.rotacoes().simplesEsquerda() > 0 && crescente.rotacoes().simplesDireita() == 0);
        assertTrue(decrescente.rotacoes().simplesDireita() > 0 && decrescente.rotacoes().simplesEsquerda() == 0);
    }

    @Test
    void invariantesValemAPartirDeCadaInsercao() {
        ArvoreAvlArtistas arvore = new ArvoreAvlArtistas();
        Random sorteio = new Random(3);
        for (int i = 1; i <= 400; i++) {
            arvore.inserir(obra(nome(sorteio.nextInt(250))));
            verificar(arvore.raiz(), null, null);
        }
    }

    @Test
    void quatroCasosDeRotacao() {
        ArvoreAvlArtistas ee = avl("c", "b", "a");
        assertEquals(new ArvoreAvlArtistas.Rotacoes(0, 1, 0, 0), ee.rotacoes());
        assertEquals("b", ee.raiz().chave());

        ArvoreAvlArtistas dd = avl("a", "b", "c");
        assertEquals(new ArvoreAvlArtistas.Rotacoes(1, 0, 0, 0), dd.rotacoes());
        assertEquals("b", dd.raiz().chave());

        ArvoreAvlArtistas ed = avl("c", "a", "b");
        assertEquals(new ArvoreAvlArtistas.Rotacoes(0, 0, 1, 0), ed.rotacoes());
        assertEquals("b", ed.raiz().chave());

        ArvoreAvlArtistas de = avl("a", "c", "b");
        assertEquals(new ArvoreAvlArtistas.Rotacoes(0, 0, 0, 1), de.rotacoes());
        assertEquals("b", de.raiz().chave());

        for (ArvoreAvlArtistas arvore : List.of(ee, dd, ed, de)) {
            assertEquals(1, arvore.rotacoes().total());
            assertEquals(2, arvore.altura());
            verificar(arvore.raiz(), null, null);
        }
    }

    @Test
    void posicaoEArtistaNaPosicaoBatemComOPercursoEmOrdem() {
        ArvoreAvlArtistas arvore = new ArvoreAvlArtistas();
        List<Integer> ordem = new ArrayList<>();
        for (int i = 0; i < 500; i++) ordem.add(i);
        java.util.Collections.shuffle(ordem, new Random(11));
        for (int i : ordem) arvore.inserir(obra(nome(i)));
        List<Artista> emOrdem = arvore.emOrdem();
        assertEquals(500, emOrdem.size());
        for (int i = 0; i < 500; i++) {
            assertEquals(nome(i), emOrdem.get(i).nome());
            assertEquals(i, emOrdem.get(i).posicao());
            assertEquals(nome(i), arvore.artistaNaPosicao(i).nome());
            assertEquals(i, arvore.posicaoDe(nome(i)));
        }
        assertThrows(IndexOutOfBoundsException.class, () -> arvore.artistaNaPosicao(-1));
        assertThrows(IndexOutOfBoundsException.class, () -> arvore.artistaNaPosicao(500));
        assertEquals(-1, arvore.posicaoDe("ninguém"));
    }

    @Test
    void fatiaNosLimites() {
        ArvoreAvlArtistas arvore = new ArvoreAvlArtistas();
        for (int i = 99; i >= 0; i--) arvore.inserir(obra(nome(i)));
        List<Artista> todos = arvore.emOrdem();
        assertEquals(todos.subList(0, 10), arvore.fatia(0, 10));
        assertEquals(todos.subList(95, 100), arvore.fatia(95, 10), "a última página é parcial");
        assertEquals(todos.subList(99, 100), arvore.fatia(99, 1));
        assertTrue(arvore.fatia(100, 5).isEmpty());
        assertTrue(arvore.fatia(1000, 5).isEmpty());
        assertTrue(arvore.fatia(-1, 5).isEmpty());
        assertTrue(arvore.fatia(10, 0).isEmpty());
        assertTrue(arvore.fatia(10, -3).isEmpty());
        for (int inicio = 0; inicio < 100; inicio += 7) {
            for (int tamanho : new int[]{1, 3, 24, 150}) {
                assertEquals(todos.subList(inicio, Math.min(100, inicio + tamanho)), arvore.fatia(inicio, tamanho));
            }
        }
    }

    @Test
    void arvoreVaziaEArtistaInexistente() {
        ArvoreAvlArtistas vazia = new ArvoreAvlArtistas();
        assertEquals(0, vazia.tamanho());
        assertEquals(0, vazia.altura());
        assertNull(vazia.raiz());
        assertTrue(vazia.emOrdem().isEmpty());
        assertTrue(vazia.fatia(0, 5).isEmpty());
        assertFalse(vazia.buscar("x").encontrou());
        assertEquals(0, vazia.buscar("x").comparacoes());
        assertThrows(IndexOutOfBoundsException.class, () -> vazia.artistaNaPosicao(0));
        assertEquals(0, vazia.registrarVisualizacao(obra("x")));

        ArvoreAvlArtistas arvore = avl("Monet", "Degas");
        ArvoreAvlArtistas.Busca ausente = arvore.buscar("Renoir");
        assertFalse(ausente.encontrou());
        assertTrue(ausente.obras().isEmpty());
        assertEquals(-1, ausente.profundidade());
        assertTrue(ausente.comparacoes() >= 1);
    }

    @Test
    void normalizaAcentosEMaiusculasEGuardaONomeOriginal() {
        ArvoreAvlArtistas arvore = new ArvoreAvlArtistas();
        Obra a = obra("Joan Miró"), b = obra("joan miro"), c = obra("Édouard Manet");
        arvore.inserir(a);
        arvore.inserir(b);
        arvore.inserir(c);
        assertEquals(2, arvore.tamanho());
        ArvoreAvlArtistas.Busca busca = arvore.buscar("  JOAN MIRÓ ");
        assertTrue(busca.encontrou());
        assertEquals(List.of(a, b), busca.obras(), "as obras mantêm a ordem de inserção");
        assertEquals("Joan Miró", busca.artista().nome());
        assertEquals(2, busca.artista().quantidadeObras());
        assertEquals(List.of(c), arvore.buscar("edouard manet").obras());
        assertEquals("joan miro", ArvoreAvlArtistas.normalizar(" Joan Miró "));
        assertEquals(1, arvore.posicaoDe("JOAN MIRO"));
    }

    @Test
    void buscaInformaComparacoesEProfundidade() {
        ArvoreAvlArtistas arvore = avl("b", "a", "c");
        ArvoreAvlArtistas.Busca raiz = arvore.buscar("b");
        assertEquals(0, raiz.profundidade());
        assertEquals(1, raiz.comparacoes());
        ArvoreAvlArtistas.Busca folha = arvore.buscar("c");
        assertEquals(1, folha.profundidade());
        assertEquals(2, folha.comparacoes());
        assertEquals(2, folha.artista().posicao());
    }

    @Test
    void visualizacoesAgregadasPorArtista() {
        ArvoreAvlArtistas arvore = new ArvoreAvlArtistas();
        Obra a1 = obra("Monet"), a2 = obra("Monet"), d = obra("Degas");
        arvore.inserir(a1);
        arvore.inserir(a2);
        arvore.inserir(d);
        assertEquals(1, arvore.registrarVisualizacao(a1));
        assertEquals(2, arvore.registrarVisualizacao(a2));
        assertEquals(1, arvore.registrarVisualizacao(d));
        assertEquals(2, arvore.buscar("monet").artista().visualizacoes());
        assertEquals(1, arvore.buscar("degas").artista().visualizacoes());
        assertEquals(0, arvore.registrarVisualizacao(obra("Desconhecido")));
        assertEquals(List.of("Degas", "Monet"), arvore.emOrdem().stream().map(Artista::nome).toList());
    }

    @Test
    void abbDegeneraComInsercaoOrdenadaEAvlContinuaLogaritmica() {
        int n = 2000;
        ArvoreAvlArtistas arvore = new ArvoreAvlArtistas();
        ArvoreBuscaBinariaArtistas abb = new ArvoreBuscaBinariaArtistas();
        for (int i = 0; i < n; i++) {
            Obra obra = obra(nome(i));
            arvore.inserir(obra);
            abb.inserir(obra);
        }
        assertEquals(n, abb.altura(), "ABB com chaves ordenadas vira uma lista");
        assertEquals(n, abb.tamanho());
        assertTrue(arvore.altura() <= 12, "AVL com 2000 chaves cabe em 12 níveis, tem " + arvore.altura());
        assertTrue(abb.mediaDeBusca().comparacoesMedias() > 900);
        assertEquals(n + 1, abb.buscar("zzz").comparacoes() + 1);
        assertTrue(abb.buscar(nome(5)).encontrou());
        assertEquals(0, new ArvoreBuscaBinariaArtistas().altura());
        assertEquals(0, new ArvoreBuscaBinariaArtistas().mediaDeBusca().artistas());
    }

    @Test
    void abbIterativaNaoEstouraAPilhaComMilharesDeNiveis() {
        ArvoreBuscaBinariaArtistas abb = new ArvoreBuscaBinariaArtistas();
        for (int i = 0; i < 12_000; i++) abb.inserir(obra(nome(i)));
        assertEquals(12_000, abb.altura());
        assertEquals(12_000, abb.mediaDeBusca().artistas());
    }

    @Test
    void chaveSecundariaPorAvlDevolveExatamenteOMesmoQueABuscaSequencial() {
        List<Obra> obras = List.of(
                new Obra(1, "Abaporu", "Tarsila do Amaral", "Modernismo", "a.jpg"),
                new Obra(2, "Mona Lisa", "Leonardo da Vinci", "Renascença", "b.jpg"),
                new Obra(3, "O Mamoeiro", "tarsila do amaral", "Modernismo", "c.jpg"),
                new Obra(4, "Paisagem", "Joan Miró", "Surrealismo", "d.jpg"),
                new Obra(5, "Estrela", "JOAN MIRO", "Surrealismo", "e.jpg"),
                new Obra(6, "Guernica", "Pablo Picasso", "Cubismo", "f.jpg"));
        MotorDeBuscas motor = new MotorDeBuscas(obras);
        for (String consulta : List.of("Tarsila do Amaral", "TARSILA DO AMARAL", "  tarsila do amaral ", "Joan Miró", "joan miro",
                "JOAN MIRÓ", "Pablo Picasso", "Leonardo da Vinci", "Artista Inexistente", "", "Picasso")) {
            ResultadoBusca sequencial = motor.porArtista(consulta);
            ResultadoBusca arvore = motor.porArtistaAvl(consulta);
            assertEquals(sequencial.obras(), arvore.obras(), "consulta: '" + consulta + "'");
        }
        assertEquals(2, motor.porArtistaAvl("joan MIRÓ").obras().size());
        assertTrue(motor.porArtistaAvl("ninguém").obras().isEmpty());
        assertEquals(obras.size(), motor.porArtista("Pablo Picasso").comparacoes(), "a linha de base percorre todos os nós");
        assertTrue(motor.porArtistaAvl("Pablo Picasso").comparacoes() <= 3);
        assertEquals(0, new MotorDeBuscas(List.of()).porArtistaAvl("x").comparacoes());
    }

    @Test
    void catalogoRegistraVisualizacoesAgregadasEExpoeArtistas() {
        Obra a = new Obra(0, "A1", "Obra A", "Monet", "Impressionismo", "a.jpg");
        Obra b = new Obra(1, "B1", "Obra B", "Monet", "Impressionismo", "b.jpg");
        Obra c = new Obra(2, "C1", "Obra C", "Degas", "Impressionismo", "c.jpg");
        Obra d = new Obra(3, "D1", "Obra D", "Édouard Manet", "Impressionismo", "d.jpg");
        CatalogoService catalogo = new CatalogoService(List.of(a, b, c, d));

        CatalogoService.PaginaArtistas pagina = catalogo.artistas(0, 2);
        assertEquals(3, pagina.totalElementos());
        assertEquals(2, pagina.totalPaginas());
        assertEquals(List.of("Degas", "Édouard Manet"), pagina.conteudo().stream().map(Artista::nome).toList());
        assertEquals(List.of("Monet"), catalogo.artistas(1, 2).conteudo().stream().map(Artista::nome).toList());
        assertTrue(catalogo.artistas(5, 2).conteudo().isEmpty());

        catalogo.visualizar(0, 5);
        catalogo.visualizar(1, 5);
        CatalogoService.Destaques destaques = catalogo.visualizar(0, 5);
        assertEquals(1, destaques.artistasVistos().size());
        assertEquals("Monet", destaques.artistasVistos().getFirst().nome());
        assertEquals(3, destaques.artistasVistos().getFirst().visualizacoes());
        assertEquals(2, destaques.artistasVistos().getFirst().posicao(), "Degas, Édouard Manet, Monet");

        CatalogoService.ObrasDoArtista obras = catalogo.obrasDoArtista("MONET", 0, 1);
        assertEquals(List.of(a), obras.conteudo());
        assertEquals(2, obras.totalElementos());
        assertEquals(2, obras.totalPaginas());
        assertEquals(3, obras.artista().visualizacoes());
        assertTrue(obras.comparacoes() >= 1 && obras.profundidade() >= 0);
        assertEquals(List.of(b), catalogo.obrasDoArtista("monet", 1, 1).conteudo());
        assertTrue(catalogo.obrasDoArtista("monet", 9, 1).conteudo().isEmpty());
        assertEquals(List.of(d), catalogo.obrasDoArtista("edouard manet", 0, 10).conteudo());
        assertThrows(RecursoNaoEncontrado.class, () -> catalogo.obrasDoArtista("Renoir", 0, 10));

        CatalogoService.MetricasArvores metricas = catalogo.metricasArvores();
        assertEquals(3, metricas.artistas());
        assertEquals(2, metricas.alturaAvl());
        assertEquals(2, metricas.alturaMinimaTeorica());
        assertEquals(4, metricas.obras());
        assertTrue(metricas.comparacoesMediasAvl() > 0);
        CatalogoService.Estruturas estruturas = catalogo.estruturas();
        assertEquals(4, estruturas.skipLists().size());
        assertEquals(2, estruturas.recentes());
        assertEquals(2, estruturas.maisVistas());
        assertEquals(metricas, estruturas.arvores());
    }

    @Test
    void catalogoCompletoMostraAbbDegenerandoEAvlLogaritmica() throws Exception {
        Path csv = Path.of("data/classes.csv");
        assumeTrue(Files.exists(csv), "catálogo completo ausente");
        CatalogoService catalogo = new CatalogoService(new LeitorCatalogoCsv().ler(csv));
        CatalogoService.MetricasArvores m = catalogo.metricasArvores();
        System.out.println("[métricas reais] " + m);
        assertTrue(m.alturaAvl() <= 1.4405 * Math.log(m.artistas() + 2) / Math.log(2));
        assertTrue(m.alturaAbb() > 4 * m.alturaAvl(), "a ABB deve degenerar com os dados ordenados por estilo");
        assertTrue(m.comparacoesMediasAbb() > 4 * m.comparacoesMediasAvl());
    }

    @Test
    void arvoreAvlPorIdFicaLogaritmicaComIdsOrdenadosEAcha() {
        br.edu.ufpb.wikiart.structure.ArvoreAvlObras arvore = new br.edu.ufpb.wikiart.structure.ArvoreAvlObras();
        int n = 5000;
        for (int i = 0; i < n; i++) arvore.inserir(new Obra(i, "c" + i, "t", "a", "e", "x.jpg"));
        assertEquals(n, arvore.tamanho());
        assertTrue(arvore.altura() <= 1.4405 * Math.log(n + 2) / Math.log(2));
        for (int i = 0; i < n; i += 97) {
            br.edu.ufpb.wikiart.structure.ArvoreAvlObras.Busca busca = arvore.buscar(i);
            assertEquals(i, busca.obra().id());
            assertEquals(busca.profundidade() + 1, busca.comparacoes());
            assertTrue(busca.comparacoes() <= arvore.altura());
        }
        assertFalse(arvore.buscar(n).encontrou());
        assertEquals(-1, arvore.buscar(-5).profundidade());
        assertThrows(IllegalArgumentException.class, () -> arvore.inserir(new Obra(3, "z", "t", "a", "e", "x.jpg")));
        assertEquals(0, new br.edu.ufpb.wikiart.structure.ArvoreAvlObras().buscar(1).comparacoes());
    }
}
