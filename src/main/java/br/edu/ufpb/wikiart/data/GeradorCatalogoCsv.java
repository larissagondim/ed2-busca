package br.edu.ufpb.wikiart.data;

import java.io.BufferedWriter;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.stream.Stream;

/** Gera os CSVs consumidos pela CLI a partir das pastas de imagens do dataset. */
public final class GeradorCatalogoCsv {
    private static final int TAMANHO_AMOSTRA = 5_007;

    private GeradorCatalogoCsv() {
    }

    public static void main(String[] args) throws IOException {
        Path raiz = Path.of(args.length > 0 ? args[0] : "data/wikiart");
        Path catalogo = Path.of(args.length > 1 ? args[1] : "data/classes.csv");
        Path amostra = Path.of(args.length > 2 ? args[2] : "data/amostra-classes.csv");
        if (!Files.isDirectory(raiz)) {
            throw new IOException("Diretório de imagens não encontrado: " + raiz);
        }

        List<Path> imagens;
        try (Stream<Path> caminhos = Files.walk(raiz)) {
            imagens = caminhos.filter(Files::isRegularFile)
                    .filter(GeradorCatalogoCsv::ehImagem)
                    .sorted(Comparator.comparing(path -> normalizar(path.toString())))
                    .toList();
        }
        if (imagens.isEmpty()) {
            throw new IOException("Nenhuma imagem JPG/PNG encontrada em " + raiz);
        }

        escrever(catalogo, raiz, imagens);
        escrever(amostra, raiz, imagens.subList(0, Math.min(TAMANHO_AMOSTRA, imagens.size())));
        System.out.printf("Catálogos gerados: %,d obras em %s e %,d na amostra %s.%n",
                imagens.size(), catalogo, Math.min(TAMANHO_AMOSTRA, imagens.size()), amostra);
    }

    private static void escrever(Path destino, Path raiz, List<Path> imagens) throws IOException {
        Path pai = destino.toAbsolutePath().getParent();
        if (pai != null) {
            Files.createDirectories(pai);
        }
        try (BufferedWriter escritor = Files.newBufferedWriter(destino, StandardCharsets.UTF_8)) {
            escritor.write("codigo_acervo,titulo,artista,estilo,caminho_imagem");
            escritor.newLine();
            for (Path imagem : imagens) {
                Path relativo = raiz.relativize(imagem);
                String arquivo = imagem.getFileName().toString();
                int ponto = arquivo.lastIndexOf('.');
                String codigo = ponto < 0 ? arquivo : arquivo.substring(0, ponto);
                String estilo = relativo.getNameCount() > 1
                        ? relativo.getName(0).toString().replace('_', ' ')
                        : "Desconhecido";
                escreverCampo(escritor, codigo);
                escritor.write(',');
                escreverCampo(escritor, "Obra " + codigo);
                escritor.write(',');
                escreverCampo(escritor, "Artista desconhecido");
                escritor.write(',');
                escreverCampo(escritor, estilo);
                escritor.write(',');
                escreverCampo(escritor, normalizar(imagem.toString()));
                escritor.newLine();
            }
        }
    }

    private static void escreverCampo(BufferedWriter escritor, String campo) throws IOException {
        escritor.write('"');
        escritor.write(campo.replace("\"", "\"\""));
        escritor.write('"');
    }

    private static boolean ehImagem(Path caminho) {
        String nome = caminho.getFileName().toString().toLowerCase(Locale.ROOT);
        return nome.endsWith(".jpg") || nome.endsWith(".jpeg") || nome.endsWith(".png");
    }

    private static String normalizar(String caminho) {
        return caminho.replace('\\', '/');
    }
}
