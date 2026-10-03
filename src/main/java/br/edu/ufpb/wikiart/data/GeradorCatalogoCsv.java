package br.edu.ufpb.wikiart.data;

import br.edu.ufpb.wikiart.structure.ListaComSaltos;

import java.io.BufferedWriter;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.stream.Stream;

/**
 * Gera os CSVs a partir das pastas do dataset WikiArt ({@code Estilo/artista_titulo.jpg}).
 * Artista e título saem do nome do arquivo; nenhuma imagem é aberta. A mesma
 * pintura pode aparecer em dois estilos, então o código repetido ganha o estilo
 * como sufixo para continuar único.
 */
public final class GeradorCatalogoCsv {
    private static final int TAMANHO_AMOSTRA = 5_007;

    private GeradorCatalogoCsv() {
    }

    public static void main(String[] args) throws IOException {
        Path raiz = Path.of(args.length > 0 ? args[0] : "data/archive");
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
        // Amostra espaçada: pega obras de todos os estilos, não só do primeiro em ordem alfabética.
        int passo = Math.max(1, imagens.size() / TAMANHO_AMOSTRA);
        List<Path> espacadas = new ArrayList<>();
        for (int i = 0; i < imagens.size() && espacadas.size() < TAMANHO_AMOSTRA; i += passo) {
            espacadas.add(imagens.get(i));
        }
        escrever(amostra, raiz, espacadas);
        System.out.printf("Catálogos gerados: %,d obras em %s e %,d na amostra %s.%n",
                imagens.size(), catalogo, Math.min(TAMANHO_AMOSTRA, imagens.size()), amostra);
    }

    private static void escrever(Path destino, Path raiz, List<Path> imagens) throws IOException {
        Path pai = destino.toAbsolutePath().getParent();
        if (pai != null) {
            Files.createDirectories(pai);
        }
        // Códigos já emitidos, numa Skip List do próprio projeto, para detectar repetições.
        ListaComSaltos<String, String> codigos = new ListaComSaltos<>(1);
        try (BufferedWriter escritor = Files.newBufferedWriter(destino, StandardCharsets.UTF_8)) {
            escritor.write("codigo_acervo,titulo,artista,estilo,caminho_imagem");
            escritor.newLine();
            for (Path imagem : imagens) {
                Path relativo = raiz.relativize(imagem);
                String arquivo = imagem.getFileName().toString();
                int ponto = arquivo.lastIndexOf('.');
                String nome = ponto < 0 ? arquivo : arquivo.substring(0, ponto);
                String pasta = relativo.getNameCount() > 1 ? relativo.getName(0).toString() : "Desconhecido";
                String estilo = pasta.replace('_', ' ');
                String codigo = nome;
                if (codigos.buscar(codigo).encontrou()) {
                    codigo = nome + "-" + pasta.toLowerCase(Locale.ROOT).replace('_', '-');
                }
                codigos.inserir(codigo, codigo);
                int separador = nome.indexOf('_');
                String artista = separador > 0 ? capitalizarPalavras(nome.substring(0, separador)) : "Artista desconhecido";
                String titulo = titulo(separador > 0 ? nome.substring(separador + 1) : nome);
                escreverCampo(escritor, codigo);
                escritor.write(',');
                escreverCampo(escritor, titulo);
                escritor.write(',');
                escreverCampo(escritor, artista);
                escritor.write(',');
                escreverCampo(escritor, estilo);
                escritor.write(',');
                escreverCampo(escritor, normalizar(imagem.toString()));
                escritor.newLine();
            }
        }
    }

    /** "the-starry-night-1889" → "The starry night 1889"; "not_detected_220255" → "Sem título (220255)". */
    static String titulo(String slug) {
        String texto = slug.replace('_', ' ').replace('-', ' ').strip().replaceAll(" +", " ");
        if (texto.startsWith("not detected")) {
            String resto = texto.substring("not detected".length()).strip();
            return resto.isEmpty() ? "Sem título" : "Sem título (" + resto + ")";
        }
        return texto.isEmpty() ? "Sem título" : Character.toUpperCase(texto.charAt(0)) + texto.substring(1);
    }

    /** "vincent-van-gogh" → "Vincent Van Gogh". */
    static String capitalizarPalavras(String slug) {
        StringBuilder resultado = new StringBuilder();
        for (String palavra : slug.split("[-_ ]+")) {
            if (palavra.isEmpty()) continue;
            if (!resultado.isEmpty()) resultado.append(' ');
            resultado.append(Character.toUpperCase(palavra.charAt(0))).append(palavra.substring(1));
        }
        return resultado.isEmpty() ? "Artista desconhecido" : resultado.toString();
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
