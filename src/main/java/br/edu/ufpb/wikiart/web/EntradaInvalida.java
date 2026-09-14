package br.edu.ufpb.wikiart.web;
public class EntradaInvalida extends RuntimeException {
    private final String codigo; private final String campo;
    public EntradaInvalida(String codigo, String mensagem, String campo) { super(mensagem); this.codigo = codigo; this.campo = campo; }
    public String codigo() { return codigo; } public String campo() { return campo; }
}
