package br.edu.ufpb.wikiart.data;

import br.edu.ufpb.wikiart.model.Obra;

import java.io.BufferedReader;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;

/** Lê o catálogo gerado pelo projeto sem carregar ou validar os arquivos JPG. */
public final class LeitorCatalogoCsv {
    private static final List<String> CABECALHO =
            List.of("codigo_acervo", "titulo", "artista", "estilo", "caminho_imagem");
    private static final List<String> CABECALHO_LEGADO =
            List.of("titulo", "artista", "estilo", "caminho_imagem");

    public List<Obra> ler(Path csv) throws IOException {
        List<Obra> obras = new ArrayList<>();
        try (BufferedReader leitor = Files.newBufferedReader(csv, StandardCharsets.UTF_8)) {
            String primeiraLinha = leitor.readLine();
            if (primeiraLinha == null) {
                return List.of();
            }
            primeiraLinha = removerBom(primeiraLinha);
            List<String> cabecalho = parsearLinha(primeiraLinha);
            boolean legado = cabecalho.equals(CABECALHO_LEGADO);
            if (!legado && !cabecalho.equals(CABECALHO)) {
                throw new IOException("Cabeçalho CSV inválido em " + csv
                        + ". Esperado: " + String.join(",", CABECALHO));
            }

            String linha;
            long numeroLinha = 1;
            while ((linha = leitor.readLine()) != null) {
                numeroLinha++;
                if (linha.isBlank()) {
                    continue;
                }
                List<String> campos;
                try {
                    campos = parsearLinha(linha);
                } catch (IllegalArgumentException erro) {
                    throw new IOException("CSV inválido na linha " + numeroLinha + ": " + erro.getMessage(), erro);
                }
                int colunas = legado ? CABECALHO_LEGADO.size() : CABECALHO.size();
                if (campos.size() != colunas) {
                    throw new IOException("CSV inválido na linha " + numeroLinha
                            + ": esperadas " + colunas + " colunas, encontradas " + campos.size());
                }
                obras.add(legado
                        ? new Obra(obras.size(), campos.get(0), campos.get(1), campos.get(2), campos.get(3))
                        : new Obra(obras.size(), campos.get(0), campos.get(1), campos.get(2), campos.get(3), campos.get(4)));
            }
        }
        return List.copyOf(obras);
    }

    static List<String> parsearLinha(String linha) {
        List<String> campos = new ArrayList<>();
        StringBuilder atual = new StringBuilder();
        boolean entreAspas = false;
        for (int i = 0; i < linha.length(); i++) {
            char caractere = linha.charAt(i);
            if (caractere == '"') {
                if (entreAspas && i + 1 < linha.length() && linha.charAt(i + 1) == '"') {
                    atual.append('"');
                    i++;
                } else {
                    entreAspas = !entreAspas;
                }
            } else if (caractere == ',' && !entreAspas) {
                campos.add(atual.toString());
                atual.setLength(0);
            } else {
                atual.append(caractere);
            }
        }
        if (entreAspas) {
            throw new IllegalArgumentException("aspas não fechadas");
        }
        campos.add(atual.toString());
        return List.copyOf(campos);
    }

    private static String removerBom(String texto) {
        return !texto.isEmpty() && texto.charAt(0) == '\uFEFF' ? texto.substring(1) : texto;
    }
}
