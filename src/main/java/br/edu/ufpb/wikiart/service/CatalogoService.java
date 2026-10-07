package br.edu.ufpb.wikiart.service;

import br.edu.ufpb.wikiart.data.LeitorCatalogoCsv;
import br.edu.ufpb.wikiart.model.Obra;
import br.edu.ufpb.wikiart.structure.ArvoreAvlArtistas;
import br.edu.ufpb.wikiart.structure.ArvoreBuscaBinariaArtistas;
import br.edu.ufpb.wikiart.structure.ListaComSaltos;
import br.edu.ufpb.wikiart.structure.ListaMaisVistas;
import br.edu.ufpb.wikiart.structure.ListaRecentes;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Path;
import java.text.Normalizer;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/*
 * Armazenamento do catálogo inteiramente nas estruturas do projeto:
 *
 *   ListaComSaltos indexável por ID, código e título, global e por período — índice principal, paginação e busca por código;
 *   ListaComSaltos por slug — os períodos, listados em ordem alfabética pelo nível 0;
 *   ListaRecentes — histórico "vistas recentemente" por movimentação para o início;
 *   ListaMaisVistas — ranking por transposição;
 *   ArvoreAvlArtistas — estrutura hierárquica: índice dos artistas em ordem alfabética, com estatística de ordem e visualizações agregadas;
 *   ArvoreBuscaBinariaArtistas — ABB sem balanceamento, construída só para comparar alturas e comparações com a AVL.
 *
 */
@Service
public class CatalogoService {
    private static final long SEMENTE = 20260911L;
    /* Igual ao maior limite aceito pela API. */
    private static final int CAPACIDADE_RECENTES = 50;

    public enum Ordem { ID, CODIGO, TITULO }

    /* Títulos se repetem ("Obra sem título"); o ID desempata e mantém a chave única. */
    private record ChaveTitulo(String titulo, long id) implements Comparable<ChaveTitulo> {
        @Override
        public int compareTo(ChaveTitulo outra) {
            int porTitulo = String.CASE_INSENSITIVE_ORDER.compare(titulo, outra.titulo);
            return porTitulo != 0 ? porTitulo : Long.compare(id, outra.id);
        }
    }

    /* Um subconjunto (global ou período) com uma Skip List por ordenação. */
    private static final class Grupo {
        private final String slug;
        private final String nome;
        private final ListaComSaltos<Long, Obra> porId = new ListaComSaltos<>(SEMENTE);
        private final ListaComSaltos<String, Obra> porCodigo = new ListaComSaltos<>(SEMENTE);
        private final ListaComSaltos<ChaveTitulo, Obra> porTitulo = new ListaComSaltos<>(SEMENTE);

        private Grupo(String slug, String nome) {
            this.slug = slug;
            this.nome = nome;
        }

        private void adicionar(Obra obra) {
            porId.inserir(obra.id(), obra);
            porCodigo.inserir(obra.codigoAcervo(), obra);
            porTitulo.inserir(new ChaveTitulo(obra.titulo(), obra.id()), obra);
        }

        private List<Obra> fatia(Ordem ordem, int inicio, int quantidade) {
            return switch (ordem) {
                case ID -> porId.fatia(inicio, quantidade);
                case CODIGO -> porCodigo.fatia(inicio, quantidade);
                case TITULO -> porTitulo.fatia(inicio, quantidade);
            };
        }
    }

    private final Grupo global = new Grupo(null, "Todos os períodos");
    private final ListaComSaltos<String, Grupo> periodos = new ListaComSaltos<>(SEMENTE);
    private final ListaRecentes recentes = new ListaRecentes(CAPACIDADE_RECENTES);
    private final ListaMaisVistas maisVistas = new ListaMaisVistas();
    private final ArvoreAvlArtistas artistas = new ArvoreAvlArtistas();
    /* Não é usada pela aplicação: existe só para as métricas AVL x ABB. */
    private final ArvoreBuscaBinariaArtistas arvoreSemBalanceamento = new ArvoreBuscaBinariaArtistas();

    @Autowired
    public CatalogoService(@Value("${wikiart.catalogo:data/classes.csv}") String csv) throws IOException {
        this(new LeitorCatalogoCsv().ler(Path.of(csv)));
    }

    public CatalogoService(List<Obra> obras) {
        for (Obra obra : obras) {
            try {
                global.adicionar(obra);
            } catch (IllegalArgumentException duplicada) {
                throw new IllegalArgumentException("Chave duplicada no catálogo: " + duplicada.getMessage(), duplicada);
            }
            String slug = slug(obra.estilo());
            Grupo grupo = periodos.buscar(slug).valor();
            if (grupo == null) {
                grupo = new Grupo(slug, obra.estilo());
                periodos.inserir(slug, grupo);
            }
            grupo.adicionar(obra);
            // Mesma ordem de inserção nas duas árvores, para a comparação ser justa.
            artistas.inserir(obra);
            arvoreSemBalanceamento.inserir(obra);
        }
    }

    /* Todas as obras do subconjunto, em ordem de ID. */
    public List<Obra> obras(String periodo) {
        return grupo(periodo).porId.paraLista();
    }

    public int quantidade(String periodo) {
        return grupo(periodo).porId.tamanho();
    }

    /* Página do catálogo obtida pela Skip List indexável, sem ordenar nem copiar o subconjunto. */
    public List<Obra> fatia(String periodo, Ordem ordem, int inicio, int quantidade) {
        return grupo(periodo).fatia(ordem, inicio, quantidade);
    }

    /* Leitura interna: não conta como visualização. */
    public Obra porId(long id) {
        Obra obra = global.porId.buscar(id).valor();
        if (obra == null) throw new RecursoNaoEncontrado("OBRA_NAO_ENCONTRADA", "Obra inexistente: " + id);
        return obra;
    }

    public Obra porCodigo(String codigo) {
        Obra obra = global.porCodigo.buscar(codigo).valor();
        if (obra == null) throw new RecursoNaoEncontrado("OBRA_NAO_ENCONTRADA", "Código inexistente: " + codigo);
        return obra;
    }

    /* O usuário abriu a obra: vai para o início dos recentes e transpõe no ranking (mais vistas). */
    public synchronized Destaques visualizar(long id, int limite) {
        Obra obra = porId(id);
        recentes.registrar(obra);
        maisVistas.registrar(obra);
        artistas.registrarVisualizacao(obra); // busca O(log n) na AVL + incremento do artista
        return destaques(limite);
    }

    public synchronized Destaques destaques(int limite) {
        List<Destaque> ranking = maisVistas.primeiros(limite).stream()
                .map(entrada -> new Destaque(entrada.obra(), entrada.visualizacoes())).toList();
        return new Destaques(recentes.primeiros(limite), ranking, artistasVistos());
    }

    /* Artistas com ao menos uma visualização, em ordem alfabética (percurso da AVL); quem ranqueia é o chamador. */
    private List<ArvoreAvlArtistas.Artista> artistasVistos() {
        List<ArvoreAvlArtistas.Artista> vistos = new ArrayList<>();
        for (ArvoreAvlArtistas.Artista artista : artistas.emOrdem()) {
            if (artista.visualizacoes() > 0) vistos.add(artista);
        }
        return vistos;
    }

    /* Página de artistas em ordem alfabética: desce pelos tamanhos das subárvores da AVL até o início da página. */
    public synchronized PaginaArtistas artistas(int pagina, int tamanho) {
        int total = artistas.tamanho();
        long inicio = (long) pagina * tamanho;
        List<ArvoreAvlArtistas.Artista> conteudo = inicio >= total ? List.of() : artistas.fatia((int) inicio, tamanho);
        return new PaginaArtistas(conteudo, pagina, tamanho, total, (total + tamanho - 1) / tamanho);
    }

    /* Obras do artista (busca insensível a acentos e maiúsculas), com as comparações e a profundidade do nó na AVL. */
    public synchronized ObrasDoArtista obrasDoArtista(String nome, int pagina, int tamanho) {
        ArvoreAvlArtistas.Busca busca = artistas.buscar(nome);
        if (!busca.encontrou()) throw new RecursoNaoEncontrado("ARTISTA_NAO_ENCONTRADO", "Artista inexistente: " + nome);
        List<Obra> todas = busca.obras();
        long inicio = (long) pagina * tamanho;
        List<Obra> conteudo = inicio >= todas.size() ? List.of() : todas.subList((int) inicio, (int) Math.min(todas.size(), inicio + tamanho));
        return new ObrasDoArtista(busca.artista(), conteudo, pagina, tamanho, todas.size(), (todas.size() + tamanho - 1) / tamanho, busca.comparacoes(), busca.profundidade());
    }

    /* AVL x ABB com os dados reais: alturas, rotações e comparações médias de busca sobre todos os artistas. */
    public synchronized MetricasArvores metricasArvores() {
        int n = artistas.tamanho();
        long soma = 0;
        for (ArvoreAvlArtistas.Artista artista : artistas.emOrdem()) {
            soma += artistas.buscar(artista.nome()).comparacoes();
        }
        double mediaAvl = n == 0 ? 0 : (double) soma / n;
        // Menor altura possível para n nós, em níveis: piso(log2 n) + 1.
        int alturaMinima = n == 0 ? 0 : (31 - Integer.numberOfLeadingZeros(n)) + 1;
        return new MetricasArvores(n, artistas.altura(), arvoreSemBalanceamento.altura(), alturaMinima,
                artistas.rotacoes(), mediaAvl, arvoreSemBalanceamento.mediaDeBusca().comparacoesMedias(), global.porId.tamanho());
    }

    /* Métricas de todas as estruturas para a tela "Estruturas por dentro". */
    public synchronized Estruturas estruturas() {
        List<SkipListInfo> skipLists = List.of(
                new SkipListInfo("Por ID (global)", global.porId.tamanho(), global.porId.niveis()),
                new SkipListInfo("Por código (global)", global.porCodigo.tamanho(), global.porCodigo.niveis()),
                new SkipListInfo("Por título (global)", global.porTitulo.tamanho(), global.porTitulo.niveis()),
                new SkipListInfo("Períodos", periodos.tamanho(), periodos.niveis()));
        return new Estruturas(skipLists, recentes.tamanho(), CAPACIDADE_RECENTES, maisVistas.tamanho(), metricasArvores());
    }

    public boolean pertence(Obra obra, String periodo) { return periodo == null || periodo.isBlank() || slug(obra.estilo()).equals(periodo); }

    public List<Periodo> periodos() {
        return periodos.paraLista().stream().map(grupo -> new Periodo(grupo.slug, grupo.nome, grupo.porId.tamanho())).toList();
    }

    public static String slug(String valor) { return Normalizer.normalize(valor, Normalizer.Form.NFD).replaceAll("\\p{M}", "").toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+", "-").replaceAll("(^-|-$)", ""); }

    private Grupo grupo(String periodo) {
        if (periodo == null || periodo.isBlank()) return global;
        Grupo grupo = periodos.buscar(periodo).valor();
        if (grupo == null) throw new RecursoNaoEncontrado("PERIODO_NAO_ENCONTRADO", "Período inexistente: " + periodo);
        return grupo;
    }

    public record Periodo(String slug, String nome, int quantidade) {}
    public record Destaque(Obra obra, long visualizacoes) {}
    public record Destaques(List<Obra> recentes, List<Destaque> maisVistas, List<ArvoreAvlArtistas.Artista> artistasVistos) {}
    public record PaginaArtistas(List<ArvoreAvlArtistas.Artista> conteudo, int pagina, int tamanho, long totalElementos, int totalPaginas) {}
    public record ObrasDoArtista(ArvoreAvlArtistas.Artista artista, List<Obra> conteudo, int pagina, int tamanho, long totalElementos, int totalPaginas, long comparacoes, int profundidade) {}
    public record MetricasArvores(int artistas, int alturaAvl, int alturaAbb, int alturaMinimaTeorica, ArvoreAvlArtistas.Rotacoes rotacoes,
                                  double comparacoesMediasAvl, double comparacoesMediasAbb, int obras) {}
    public record SkipListInfo(String nome, int tamanho, int niveis) {}
    public record Estruturas(List<SkipListInfo> skipLists, int recentes, int capacidadeRecentes, int maisVistas, MetricasArvores arvores) {}
}
