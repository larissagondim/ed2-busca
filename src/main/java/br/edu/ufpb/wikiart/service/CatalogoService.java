package br.edu.ufpb.wikiart.service;

import br.edu.ufpb.wikiart.data.LeitorCatalogoCsv;
import br.edu.ufpb.wikiart.model.Obra;
import br.edu.ufpb.wikiart.structure.ArvoreAfunilada;
import br.edu.ufpb.wikiart.structure.ListaComSaltos;
import br.edu.ufpb.wikiart.structure.ListaMaisVistas;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Path;
import java.text.Normalizer;
import java.util.List;
import java.util.Locale;

/**
 * Armazenamento do catálogo inteiramente nas estruturas do projeto:
 * <ul>
 *   <li>{@link ArvoreAfunilada} por ID — índice principal e histórico de "vistas recentemente";</li>
 *   <li>{@link ListaComSaltos} indexável por ID, código e título, global e por período — paginação e busca por código;</li>
 *   <li>{@link ArvoreAfunilada} por slug — os períodos, listados em ordem alfabética pelo percurso em ordem;</li>
 *   <li>{@link ListaMaisVistas} — ranking por transposição.</li>
 * </ul>
 */
@Service
public class CatalogoService {
    private static final long SEMENTE = 20260911L;
    private static final int PROFUNDIDADE_RECENTES = 8;

    public enum Ordem { ID, CODIGO, TITULO }

    /** Títulos se repetem ("Obra sem título"); o ID desempata e mantém a chave única. */
    private record ChaveTitulo(String titulo, long id) implements Comparable<ChaveTitulo> {
        @Override
        public int compareTo(ChaveTitulo outra) {
            int porTitulo = String.CASE_INSENSITIVE_ORDER.compare(titulo, outra.titulo);
            return porTitulo != 0 ? porTitulo : Long.compare(id, outra.id);
        }
    }

    /** Um subconjunto (global ou período) com uma Skip List por ordenação. */
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
    private final ArvoreAfunilada<String, Grupo> periodos = new ArvoreAfunilada<>();
    private final ArvoreAfunilada<Long, Obra> porId;
    private final ListaMaisVistas maisVistas = new ListaMaisVistas();

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
            Grupo grupo = periodos.consultar(slug);
            if (grupo == null) {
                grupo = new Grupo(slug, obra.estilo());
                periodos.inserir(slug, grupo);
            }
            grupo.adicionar(obra);
        }
        // A Skip List por ID já entrega as obras ordenadas para a carga balanceada.
        porId = ArvoreAfunilada.deOrdenados(global.porId.paraLista(), Obra::id);
    }

    /** Todas as obras do subconjunto, em ordem de ID. */
    public List<Obra> obras(String periodo) {
        return grupo(periodo).porId.paraLista();
    }

    public int quantidade(String periodo) {
        return grupo(periodo).porId.tamanho();
    }

    /** Página do catálogo obtida pela Skip List indexável, sem ordenar nem copiar o subconjunto. */
    public List<Obra> fatia(String periodo, Ordem ordem, int inicio, int quantidade) {
        return grupo(periodo).fatia(ordem, inicio, quantidade);
    }

    /** Leitura interna: não afunila, para não contar como visualização. */
    public synchronized Obra porId(long id) {
        Obra obra = porId.consultar(id);
        if (obra == null) throw new RecursoNaoEncontrado("OBRA_NAO_ENCONTRADA", "Obra inexistente: " + id);
        return obra;
    }

    public Obra porCodigo(String codigo) {
        Obra obra = global.porCodigo.buscar(codigo).valor();
        if (obra == null) throw new RecursoNaoEncontrado("OBRA_NAO_ENCONTRADA", "Código inexistente: " + codigo);
        return obra;
    }

    /** O usuário abriu a obra: afunila na árvore (recentes) e transpõe no ranking (mais vistas). */
    public synchronized Destaques visualizar(long id, int limite) {
        ArvoreAfunilada.Acesso<Obra> acesso = porId.acessar(id);
        if (!acesso.encontrou()) throw new RecursoNaoEncontrado("OBRA_NAO_ENCONTRADA", "Obra inexistente: " + id);
        maisVistas.registrar(acesso.valor());
        return destaques(limite);
    }

    public synchronized Destaques destaques(int limite) {
        List<Destaque> ranking = maisVistas.primeiros(limite).stream()
                .map(entrada -> new Destaque(entrada.obra(), entrada.visualizacoes())).toList();
        return new Destaques(porId.recentes(limite, PROFUNDIDADE_RECENTES), ranking);
    }

    public boolean pertence(Obra obra, String periodo) { return periodo == null || periodo.isBlank() || slug(obra.estilo()).equals(periodo); }

    public List<Periodo> periodos() {
        return periodos.emOrdem().stream().map(grupo -> new Periodo(grupo.slug, grupo.nome, grupo.porId.tamanho())).toList();
    }

    public static String slug(String valor) { return Normalizer.normalize(valor, Normalizer.Form.NFD).replaceAll("\\p{M}", "").toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+", "-").replaceAll("(^-|-$)", ""); }

    private Grupo grupo(String periodo) {
        if (periodo == null || periodo.isBlank()) return global;
        Grupo grupo = periodos.consultar(periodo);
        if (grupo == null) throw new RecursoNaoEncontrado("PERIODO_NAO_ENCONTRADO", "Período inexistente: " + periodo);
        return grupo;
    }

    public record Periodo(String slug, String nome, int quantidade) {}
    public record Destaque(Obra obra, long visualizacoes) {}
    public record Destaques(List<Obra> recentes, List<Destaque> maisVistas) {}
}
