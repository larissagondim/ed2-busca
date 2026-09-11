package br.edu.ufpb.wikiart.web;

import br.edu.ufpb.wikiart.model.Obra;
import br.edu.ufpb.wikiart.service.*;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api")
public class ApiController {
    private static final String CHAVE_SESSAO = SessaoBusca.class.getName();
    private final CatalogoService catalogo;
    public ApiController(CatalogoService catalogo) { this.catalogo = catalogo; }

    @GetMapping("/periodos") public List<CatalogoService.Periodo> periodos() { return catalogo.periodos(); }

    @GetMapping("/obras") public Pagina<Obra> obras(@RequestParam(required=false) String periodo, @RequestParam(defaultValue="0") int page, @RequestParam(defaultValue="24") int size, @RequestParam(defaultValue="id") String ordem) {
        if (page < 0) throw new EntradaInvalida("PAGINA_INVALIDA", "A página não pode ser negativa.", "page");
        if (size < 1 || size > 100) throw new EntradaInvalida("TAMANHO_INVALIDO", "O tamanho deve estar entre 1 e 100.", "size");
        Comparator<Obra> comparador = switch (ordem) { case "id" -> Comparator.comparingLong(Obra::id); case "codigo" -> Comparator.comparing(Obra::codigoAcervo); case "titulo" -> Comparator.comparing(Obra::titulo, String.CASE_INSENSITIVE_ORDER); default -> throw new EntradaInvalida("ORDEM_INVALIDA", "Ordenação desconhecida.", "ordem"); };
        List<Obra> todas = catalogo.obras(periodo).stream().sorted(comparador).toList();
        int inicio = Math.min(todas.size(), Math.multiplyExact(page, size));
        int fim = Math.min(todas.size(), inicio + size);
        int paginas = (todas.size() + size - 1) / size;
        return new Pagina<>(todas.subList(inicio, fim), page, size, todas.size(), paginas);
    }

    @GetMapping("/obras/{id}") public Obra obra(@PathVariable long id, HttpSession http) { return validarFiltro(catalogo.porId(id), sessao(http)); }
    @GetMapping("/obras/codigo/{codigo}") public Obra codigo(@PathVariable String codigo, HttpSession http) { return validarFiltro(catalogo.porCodigo(codigo), sessao(http)); }
    @PutMapping("/sessao/periodo/{slug}") public SessaoBusca.Resumo periodo(@PathVariable String slug, HttpSession http) { SessaoBusca s = sessao(http); s.reiniciar(slug.equals("global") ? null : slug); return s.resumo(); }
    @PostMapping("/buscas/comparar") public SessaoBusca.Comparacao comparar(@Valid @RequestBody BuscaRequest req, HttpSession http) {
        try { long id = req.tipo() == TipoEntrada.ID ? Long.parseLong(req.valor()) : -1; if (req.tipo() == TipoEntrada.ID && id < 0) throw new NumberFormatException(); return req.tipo() == TipoEntrada.ID ? sessao(http).comparar(id) : sessao(http).compararCodigo(req.valor()); }
        catch (NumberFormatException e) { throw new EntradaInvalida("ID_INVALIDO", "O ID deve ser um inteiro não negativo.", "valor"); }
    }
    @GetMapping("/sessao/resumo") public SessaoBusca.Resumo resumo(HttpSession http) { return sessao(http).resumo(); }
    @DeleteMapping("/sessao") @ResponseStatus(HttpStatus.NO_CONTENT) public void apagar(HttpSession http) { http.invalidate(); }

    private Obra validarFiltro(Obra obra, SessaoBusca sessao) { if (!catalogo.pertence(obra, sessao.periodo())) throw new RecursoNaoEncontrado("OBRA_FORA_DO_FILTRO", "A obra não pertence ao período selecionado."); return obra; }
    private SessaoBusca sessao(HttpSession http) { synchronized (http) { Object atual = http.getAttribute(CHAVE_SESSAO); if (atual instanceof SessaoBusca s) return s; SessaoBusca criada = new SessaoBusca(catalogo); http.setAttribute(CHAVE_SESSAO, criada); return criada; } }
    public enum TipoEntrada { ID, CODIGO }
    public record BuscaRequest(@NotNull TipoEntrada tipo, @NotBlank String valor) {}
    public record Pagina<T>(List<T> conteudo, int pagina, int tamanho, long totalElementos, int totalPaginas) {}
}
