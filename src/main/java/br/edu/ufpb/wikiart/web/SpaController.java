package br.edu.ufpb.wikiart.web;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class SpaController {
    @GetMapping(value = {"/", "/buscar", "/estruturas", "/acervo", "/artistas", "/museu", "/sobre", "/catalogo", "/resumo"}) public String pagina() { return "forward:/index.html"; }
}
