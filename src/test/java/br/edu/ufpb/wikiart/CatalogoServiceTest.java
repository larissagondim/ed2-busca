package br.edu.ufpb.wikiart;

import br.edu.ufpb.wikiart.model.Obra;
import br.edu.ufpb.wikiart.service.*;
import org.junit.jupiter.api.Test;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;

class CatalogoServiceTest {
    private final Obra a = new Obra(0,"A1","Obra A","Desconhecido","Arte Acadêmica","a.jpg");
    private final Obra b = new Obra(1,"B1","Obra B","Desconhecido","Barroco","b.jpg");
    private final CatalogoService catalogo = new CatalogoService(List.of(a,b));
    @Test void indexaPeriodoIdECodigo() { assertEquals(a,catalogo.porId(0));assertEquals(b,catalogo.porCodigo("B1"));assertEquals(2,catalogo.periodos().size());assertEquals("arte-academica",CatalogoService.slug("Arte Acadêmica"));assertEquals(List.of(b),catalogo.obras("barroco"));assertTrue(catalogo.pertence(b,"barroco"));assertFalse(catalogo.pertence(a,"barroco")); }
    @Test void rejeitaAusentesEDuplicados() { assertThrows(RecursoNaoEncontrado.class,()->catalogo.porId(99));assertThrows(RecursoNaoEncontrado.class,()->catalogo.porCodigo("X"));assertThrows(RecursoNaoEncontrado.class,()->catalogo.obras("x"));assertThrows(IllegalArgumentException.class,()->new CatalogoService(List.of(a,a))); }
    @Test void sessaoFiltraComparaEReinicia() { SessaoBusca s=new SessaoBusca(catalogo);assertEquals(8,s.compararCodigo("A1").medicoes().size());assertEquals(1,s.resumo().estrategias().getFirst().buscas());s.reiniciar("barroco");assertThrows(RecursoNaoEncontrado.class,()->s.comparar(0));assertEquals(8,s.comparar(1).medicoes().size());s.reiniciar(null);assertEquals(2,s.resumo().quantidadeObras()); }
}
