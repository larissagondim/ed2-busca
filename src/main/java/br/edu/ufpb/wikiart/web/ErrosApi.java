package br.edu.ufpb.wikiart.web;

import br.edu.ufpb.wikiart.service.RecursoNaoEncontrado;
import org.springframework.http.*;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

@RestControllerAdvice
public class ErrosApi {
    @ExceptionHandler(RecursoNaoEncontrado.class) ResponseEntity<Erro> naoEncontrado(RecursoNaoEncontrado e) { return ResponseEntity.status(404).body(new Erro(e.codigo(), e.getMessage(), null)); }
    @ExceptionHandler(EntradaInvalida.class) ResponseEntity<Erro> entrada(EntradaInvalida e) { return ResponseEntity.badRequest().body(new Erro(e.codigo(), e.getMessage(), e.campo())); }
    @ExceptionHandler({MethodArgumentNotValidException.class, MethodArgumentTypeMismatchException.class, ArithmeticException.class}) ResponseEntity<Erro> formato(Exception e) { return ResponseEntity.badRequest().body(new Erro("ENTRADA_INVALIDA", "Revise os dados enviados.", null)); }
    public record Erro(String codigo, String mensagem, String campo) {}
}
