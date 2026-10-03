package br.edu.ufpb.wikiart.app;

import br.edu.ufpb.wikiart.data.LeitorCatalogoCsv;
import br.edu.ufpb.wikiart.model.Obra;
import br.edu.ufpb.wikiart.service.*;

import java.io.IOException;
import java.nio.file.Path;
import java.util.*;

/** Interface textual independente do servidor web. */
public final class CatalogoCli {
    private static final int DESTAQUES = 8;
    private CatalogoCli() {}
    public static void main(String[] args) throws IOException {
        Path csv = Path.of(args.length == 0 ? "data/amostra-classes.csv" : args[0]);
        CatalogoService catalogo = new CatalogoService(new LeitorCatalogoCsv().ler(csv));
        executar(new Scanner(System.in), catalogo);
    }
    static void executar(Scanner entrada, CatalogoService catalogo) {
        SessaoBusca sessao = new SessaoBusca(catalogo);
        String periodo = null;
        while (true) {
            System.out.println("\n1 Períodos | 2 Filtro | 3 Listar | 4 ID | 5 Código | 6 Comparar | 7 Métricas | 8 Reiniciar | 9 Sair | 10 Destaques");
            if (!entrada.hasNextLine()) return;
            try {
                switch (entrada.nextLine().strip()) {
                    case "1" -> catalogo.periodos().forEach(p -> System.out.printf("%s (%s): %,d%n", p.nome(), p.slug(), p.quantidade()));
                    case "2" -> { System.out.print("Slug (vazio remove): "); periodo = entrada.nextLine().strip(); if (periodo.isBlank()) periodo = null; sessao.reiniciar(periodo); System.out.println("Filtro atualizado."); }
                    case "3" -> listar(entrada, catalogo, periodo);
                    case "4" -> visualizar(catalogo.porId(lerLong(entrada, "ID: ")), periodo, catalogo);
                    case "5" -> { System.out.print("Código: "); visualizar(catalogo.porCodigo(entrada.nextLine().strip()), periodo, catalogo); }
                    case "6" -> comparar(entrada, sessao);
                    case "7" -> resumo(sessao.resumo());
                    case "8" -> { sessao.reiniciar(periodo); System.out.println("Estruturas e estatísticas reiniciadas."); }
                    case "9" -> { return; }
                    case "10" -> destaques(catalogo.destaques(DESTAQUES));
                    default -> System.out.println("Opção inválida.");
                }
            } catch (RuntimeException e) { System.out.println("Erro: " + e.getMessage()); }
        }
    }
    /** A página vem direto da Skip List indexável: um salto até a posição e 24 passos no nível 0. */
    private static void listar(Scanner entrada, CatalogoService catalogo, String periodo) { int tamanho=24; long pagina=lerLong(entrada,"Página (a partir de 0): "); int total=catalogo.quantidade(periodo); long inicio=Math.max(0,pagina)*tamanho; if(inicio<total) catalogo.fatia(periodo,CatalogoService.Ordem.ID,(int)inicio,tamanho).forEach(CatalogoCli::mostrar); System.out.printf("%,d obra(s).%n",total); }
    private static void visualizar(Obra obra,String periodo,CatalogoService catalogo){mostrar(obra,periodo,catalogo);catalogo.visualizar(obra.id(),DESTAQUES);}
    private static void destaques(CatalogoService.Destaques d){System.out.println("Vistas recentemente (lista com movimentação para o início):");d.recentes().forEach(CatalogoCli::mostrar);System.out.println("Mais vistas (lista com transposição):");d.maisVistas().forEach(item->{System.out.printf("%,dx  ",item.visualizacoes());mostrar(item.obra());});}
    private static void comparar(Scanner entrada, SessaoBusca sessao) { System.out.print("Tipo (ID/CODIGO): "); String tipo=entrada.nextLine().strip(); System.out.print("Valor: "); String valor=entrada.nextLine().strip(); SessaoBusca.Comparacao c=tipo.equalsIgnoreCase("CODIGO")?sessao.compararCodigo(valor):sessao.comparar(Long.parseLong(valor)); mostrar(c.obra()); c.medicoes().forEach(m->System.out.printf("%-45s %,d comparações, %,d reorganizações, %.2f µs%n",m.nome(),m.comparacoes(),m.reorganizacoes(),m.tempoMicros())); }
    private static void resumo(SessaoBusca.Resumo r) { System.out.printf("Subconjunto: %,d obra(s)%n",r.quantidadeObras()); r.estrategias().forEach(e->System.out.printf("%-45s %,d buscas, %.1f%% eficácia%n",e.nome(),e.buscas(),e.eficaciaPercentual())); }
    private static void mostrar(Obra obra,String periodo,CatalogoService catalogo){if(!catalogo.pertence(obra,periodo))throw new RecursoNaoEncontrado("OBRA_FORA_DO_FILTRO","A obra não pertence ao período atual.");mostrar(obra);}
    private static void mostrar(Obra o){System.out.printf("ID %d | %s | %s | %s%n",o.id(),o.codigoAcervo(),o.titulo(),o.estilo());}
    private static long lerLong(Scanner e,String rotulo){System.out.print(rotulo);return Long.parseLong(e.nextLine().strip());}
}
