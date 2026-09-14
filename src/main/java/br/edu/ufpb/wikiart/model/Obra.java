package br.edu.ufpb.wikiart.model;

import java.util.Objects;

/**
 * Os metadados ficam em memória; a imagem, não. Guardar apenas o caminho evita
 * que um experimento de busca acabe medindo o custo de decodificar milhares de JPGs.
 */
public record Obra(long id, String codigoAcervo, String titulo, String artista, String estilo, String caminhoImagem) {
    public Obra {
        if (id < 0) {
            throw new IllegalArgumentException("O ID da obra não pode ser negativo.");
        }
        codigoAcervo = textoObrigatorio(codigoAcervo, "código do acervo");
        titulo = textoObrigatorio(titulo, "título");
        artista = textoObrigatorio(artista, "artista");
        estilo = textoObrigatorio(estilo, "estilo");
        caminhoImagem = textoObrigatorio(caminhoImagem, "caminho da imagem");
    }

    /** Compatibilidade com os exercícios anteriores: deriva o código do arquivo. */
    public Obra(long id, String titulo, String artista, String estilo, String caminhoImagem) {
        this(id, codigoDoCaminho(caminhoImagem), titulo, artista, estilo, caminhoImagem);
    }

    private static String codigoDoCaminho(String caminho) {
        Objects.requireNonNull(caminho, "caminho da imagem não pode ser nulo");
        String nome = caminho.replace('\\', '/');
        nome = nome.substring(nome.lastIndexOf('/') + 1);
        int ponto = nome.lastIndexOf('.');
        return ponto > 0 ? nome.substring(0, ponto) : nome;
    }

    private static String textoObrigatorio(String valor, String campo) {
        Objects.requireNonNull(valor, campo + " não pode ser nulo");
        String limpo = valor.strip();
        if (limpo.isEmpty()) {
            throw new IllegalArgumentException("O " + campo + " não pode ficar vazio.");
        }
        return limpo;
    }
}
