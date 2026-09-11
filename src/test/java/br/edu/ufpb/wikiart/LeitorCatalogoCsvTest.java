package br.edu.ufpb.wikiart;

import org.junit.jupiter.api.Test;

import br.edu.ufpb.wikiart.data.LeitorCatalogoCsv;
import br.edu.ufpb.wikiart.model.Obra;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

// Testes do contrato CSV sem dependências externas.
public final class LeitorCatalogoCsvTest {
    LeitorCatalogoCsvTest() {
    }

    @Test
    void validaCsvLegado() throws Exception {
        main(new String[0]);
    }

    public static void main(String[] args) throws Exception {
        Path csv = Files.createTempFile("catalogo-wikiart-", ".csv");
        try {
            Files.writeString(csv, "\uFEFFtitulo,artista,estilo,caminho_imagem\n"
                    + "\"Título, com vírgula\",\"Artista \"\"A\"\"\",Barroco,imagens/1.jpg\n",
                    StandardCharsets.UTF_8);
            List<Obra> obras = new LeitorCatalogoCsv().ler(csv);
            exigir(obras.size() == 1, "Deve importar uma obra.");
            exigir(obras.get(0).id() == 0, "O primeiro ID deve ser zero.");
            exigir(obras.get(0).titulo().equals("Título, com vírgula"), "Deve preservar vírgulas entre aspas.");
            exigir(obras.get(0).artista().equals("Artista \"A\""), "Deve interpretar aspas duplicadas.");
        } finally {
            Files.deleteIfExists(csv);
        }
        System.out.println("OK — importação CSV validada.");
    }

    private static void exigir(boolean condicao, String mensagem) {
        if (!condicao) {
            throw new AssertionError(mensagem);
        }
    }
}
