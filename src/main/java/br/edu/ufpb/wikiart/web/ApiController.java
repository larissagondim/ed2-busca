package br.edu.ufpb.wikiart.web;

import br.edu.ufpb.wikiart.model.Obra;
import br.edu.ufpb.wikiart.search.TipoBusca;
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
        CatalogoService.Ordem criterio = switch (ordem) { case "id" -> CatalogoService.Ordem.ID; case "codigo" -> CatalogoService.Ordem.CODIGO; case "titulo" -> CatalogoService.Ordem.TITULO; default -> throw new EntradaInvalida("ORDEM_INVALIDA", "Ordenação desconhecida.", "ordem"); };
        int total = catalogo.quantidade(periodo);
        long inicio = (long) page * size;
        List<Obra> conteudo = inicio >= total ? List.of() : catalogo.fatia(periodo, criterio, (int) inicio, size);
        return new Pagina<>(conteudo, page, size, total, (total + size - 1) / size);
    }

    @GetMapping("/obras/{id}") public Obra obra(@PathVariable long id, HttpSession http) { return validarFiltro(catalogo.porId(id), sessao(http)); }
    @GetMapping("/obras/codigo/{codigo}") public Obra codigo(@PathVariable String codigo, HttpSession http) { return validarFiltro(catalogo.porCodigo(codigo), sessao(http)); }
    @PutMapping("/sessao/periodo/{slug}") public SessaoBusca.Resumo periodo(@PathVariable String slug, HttpSession http) { SessaoBusca s = sessao(http); s.reiniciar(slug.equals("global") ? null : slug); return s.resumo(); }
    @PostMapping("/buscas/comparar") public SessaoBusca.Comparacao comparar(@Valid @RequestBody BuscaRequest req, HttpSession http) {
        List<TipoBusca> estrategias = req.estrategias() == null ? SessaoBusca.TIPOS : req.estrategias();
        if (estrategias.isEmpty() || !SessaoBusca.TIPOS.containsAll(estrategias)) throw new EntradaInvalida("ESTRATEGIA_INVALIDA", "Escolha ao menos uma das oito buscas exatas.", "estrategias");
        try { long id = req.tipo() == TipoEntrada.ID ? Long.parseLong(req.valor()) : -1; if (req.tipo() == TipoEntrada.ID && id < 0) throw new NumberFormatException(); return req.tipo() == TipoEntrada.ID ? sessao(http).comparar(id, estrategias) : sessao(http).compararCodigo(req.valor(), estrategias); }
        catch (NumberFormatException e) { throw new EntradaInvalida("ID_INVALIDO", "O ID deve ser um inteiro não negativo.", "valor"); }
    }
    /** Abrir os detalhes de uma obra a move para o início dos recentes e transpõe o ranking (mais vistas). */
    @PostMapping("/obras/{id}/visualizacoes") public CatalogoService.Destaques visualizar(@PathVariable long id, @RequestParam(defaultValue="8") int limite) { return catalogo.visualizar(id, validarLimite(limite)); }
    @GetMapping("/destaques") public CatalogoService.Destaques destaques(@RequestParam(defaultValue="8") int limite) { return catalogo.destaques(validarLimite(limite)); }
    @PostMapping("/buscas/consulta") public SessaoBusca.Consulta consultar(@Valid @RequestBody ConsultaRequest req, HttpSession http) {
        if (!SessaoBusca.CONSULTAS.contains(req.tipo())) throw new EntradaInvalida("CONSULTA_INVALIDA", "Consulta desconhecida.", "tipo");
        if (req.tipo() == TipoBusca.CHAVE_SECUNDARIA && (req.artista() == null || req.artista().isBlank())) throw new EntradaInvalida("ARTISTA_INVALIDO", "Informe o nome do artista.", "artista");
        boolean usaInicio = req.tipo() == TipoBusca.PISO || req.tipo() == TipoBusca.TETO || req.tipo() == TipoBusca.INTERVALO;
        if (usaInicio && (req.inicio() == null || req.inicio() < 0)) throw new EntradaInvalida("ID_INVALIDO", "O ID deve ser um inteiro não negativo.", "inicio");
        if (req.tipo() == TipoBusca.INTERVALO && (req.fim() == null || req.fim() < req.inicio())) throw new EntradaInvalida("INTERVALO_INVALIDO", "O fim do intervalo deve ser maior ou igual ao início.", "fim");
        return sessao(http).consultar(req.tipo(), req.artista(), req.inicio(), req.fim());
    }
    @GetMapping("/sessao/resumo") public SessaoBusca.Resumo resumo(HttpSession http) { return sessao(http).resumo(); }
    @DeleteMapping("/sessao") @ResponseStatus(HttpStatus.NO_CONTENT) public void apagar(HttpSession http) { http.invalidate(); }

    private static int validarLimite(int limite) { if (limite < 1 || limite > 50) throw new EntradaInvalida("LIMITE_INVALIDO", "O limite deve estar entre 1 e 50.", "limite"); return limite; }
    private Obra validarFiltro(Obra obra, SessaoBusca sessao) { if (!catalogo.pertence(obra, sessao.periodo())) throw new RecursoNaoEncontrado("OBRA_FORA_DO_FILTRO", "A obra não pertence ao período selecionado."); return obra; }
    private SessaoBusca sessao(HttpSession http) { synchronized (http) { Object atual = http.getAttribute(CHAVE_SESSAO); if (atual instanceof SessaoBusca s) return s; SessaoBusca criada = new SessaoBusca(catalogo); http.setAttribute(CHAVE_SESSAO, criada); return criada; } }
    public enum TipoEntrada { ID, CODIGO }
    public record BuscaRequest(@NotNull TipoEntrada tipo, @NotBlank String valor, List<TipoBusca> estrategias) {}
    public record ConsultaRequest(@NotNull TipoBusca tipo, String artista, Long inicio, Long fim) {}
    public record Pagina<T>(List<T> conteudo, int pagina, int tamanho, long totalElementos, int totalPaginas) {}
}
