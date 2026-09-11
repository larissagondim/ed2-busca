package br.edu.ufpb.wikiart.service;

import br.edu.ufpb.wikiart.data.LeitorCatalogoCsv;
import br.edu.ufpb.wikiart.model.Obra;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Path;
import java.text.Normalizer;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class CatalogoService {
    private final List<Obra> obras;
    private final Map<Long, Obra> porId;
    private final Map<String, Obra> porCodigo;
    private final Map<String, List<Obra>> porPeriodo;
    private final Map<String, String> nomes;

    @Autowired
    public CatalogoService(@Value("${wikiart.catalogo:data/classes.csv}") String csv) throws IOException {
        this(new LeitorCatalogoCsv().ler(Path.of(csv)));
    }

    public CatalogoService(List<Obra> obras) {
        this.obras = List.copyOf(obras);
        porId = unicos(obras, obra -> obra.id());
        porCodigo = unicos(obras, Obra::codigoAcervo);
        Map<String, List<Obra>> grupos = new TreeMap<>();
        Map<String, String> rotulos = new TreeMap<>();
        for (Obra obra : obras) {
            String slug = slug(obra.estilo());
            grupos.computeIfAbsent(slug, ignorado -> new ArrayList<>()).add(obra);
            rotulos.putIfAbsent(slug, obra.estilo());
        }
        porPeriodo = grupos.entrySet().stream().collect(Collectors.toUnmodifiableMap(Map.Entry::getKey, e -> List.copyOf(e.getValue())));
        nomes = Map.copyOf(rotulos);
    }

    private static <K> Map<K, Obra> unicos(List<Obra> obras, Function<Obra, K> chave) {
        Map<K, Obra> mapa = new HashMap<>();
        for (Obra obra : obras) if (mapa.put(chave.apply(obra), obra) != null) throw new IllegalArgumentException("Chave duplicada no catálogo: " + chave.apply(obra));
        return Map.copyOf(mapa);
    }

    public List<Obra> obras(String periodo) { return periodo == null || periodo.isBlank() ? obras : Optional.ofNullable(porPeriodo.get(periodo)).orElseThrow(() -> new RecursoNaoEncontrado("PERIODO_NAO_ENCONTRADO", "Período inexistente: " + periodo)); }
    public Obra porId(long id) { return Optional.ofNullable(porId.get(id)).orElseThrow(() -> new RecursoNaoEncontrado("OBRA_NAO_ENCONTRADA", "Obra inexistente: " + id)); }
    public Obra porCodigo(String codigo) { return Optional.ofNullable(porCodigo.get(codigo)).orElseThrow(() -> new RecursoNaoEncontrado("OBRA_NAO_ENCONTRADA", "Código inexistente: " + codigo)); }
    public boolean pertence(Obra obra, String periodo) { return periodo == null || periodo.isBlank() || slug(obra.estilo()).equals(periodo); }
    public List<Periodo> periodos() { return porPeriodo.keySet().stream().sorted().map(slug -> new Periodo(slug, nomes.get(slug), porPeriodo.get(slug).size())).toList(); }
    public boolean caminhoRegistrado(Path caminho) { Path alvo = caminho.toAbsolutePath().normalize(); return obras.stream().map(Obra::caminhoImagem).map(Path::of).map(p -> p.toAbsolutePath().normalize()).anyMatch(alvo::equals); }
    public static String slug(String valor) { return Normalizer.normalize(valor, Normalizer.Form.NFD).replaceAll("\\p{M}", "").toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+", "-").replaceAll("(^-|-$)", ""); }
    public record Periodo(String slug, String nome, int quantidade) {}
}
