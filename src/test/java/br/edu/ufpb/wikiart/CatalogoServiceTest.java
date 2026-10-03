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
    @Test void paginaPorOrdemSemOrdenarNaRequisicao() {
        Obra c=new Obra(2,"C0","Abacate","Desconhecido","Barroco","c.jpg");
        CatalogoService tres=new CatalogoService(List.of(b,c,a));
        assertEquals(List.of(a,b,c),tres.obras(null));
        assertEquals(List.of(c,a),tres.fatia(null,CatalogoService.Ordem.TITULO,0,2));
        assertEquals(List.of(b),tres.fatia(null,CatalogoService.Ordem.CODIGO,1,1));
        assertEquals(List.of(c),tres.fatia("barroco",CatalogoService.Ordem.ID,1,5));
        assertEquals(2,tres.quantidade("barroco"));
        assertEquals(List.of("arte-academica","barroco"),tres.periodos().stream().map(CatalogoService.Periodo::slug).toList());
        assertThrows(IllegalArgumentException.class,()->new CatalogoService(List.of(a,new Obra(5,"A1","Outra","X","Y","z.jpg"))));
    }
    @Test void visualizacoesAlimentamRecentesEMaisVistas() {
        assertTrue(catalogo.destaques(5).recentes().isEmpty());
        catalogo.visualizar(1,5);catalogo.visualizar(0,5);
        CatalogoService.Destaques d=catalogo.visualizar(0,5);
        assertEquals(a,d.recentes().getFirst());
        assertEquals(List.of(a,b),d.recentes());
        assertEquals(a,d.maisVistas().getFirst().obra());
        assertEquals(2,d.maisVistas().getFirst().visualizacoes());
        assertThrows(RecursoNaoEncontrado.class,()->catalogo.visualizar(99,5));
    }
}
