package br.edu.ufpb.wikiart.search;

/** Os 14 tipos levantados no material da disciplina. */
public enum TipoBusca {
    SEQUENCIAL("Busca sequencial simples"),
    TRANSPOSICAO("Busca sequencial com transposição"),
    MOVER_PARA_INICIO("Busca sequencial com movimentação para o início"),
    BINARIA("Busca binária"),
    INTERPOLACAO("Busca por interpolação"),
    LISTA_COM_SALTOS("Busca em lista com saltos (Skip List)"),
    FIBONACCI("Busca de Fibonacci"),
    CHAVE_SECUNDARIA("Busca com chave secundária"),
    PISO("Busca de piso"),
    TETO("Busca de teto"),
    INTERVALO("Busca de intervalo"),
    DEDILHADA("Busca dedilhada"),
    MENOR_CHAVE("Busca da menor chave"),
    MAIOR_CHAVE("Busca da maior chave");

    private final String nome;

    TipoBusca(String nome) {
        this.nome = nome;
    }

    public String nome() {
        return nome;
    }
}
