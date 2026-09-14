package br.edu.ufpb.wikiart.web;

import br.edu.ufpb.wikiart.service.ImagemService;
import org.springframework.core.io.*;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.nio.file.*;

@RestController
@RequestMapping("/api/imagens")
public class ImagemController {
    private final ImagemService imagens;
    public ImagemController(ImagemService imagens) { this.imagens = imagens; }
    @GetMapping("/{id}/miniatura") public ResponseEntity<Resource> miniatura(@PathVariable long id) throws IOException { return resposta(imagens.miniatura(id), MediaType.IMAGE_JPEG); }
    @GetMapping("/{id}/original") public ResponseEntity<Resource> original(@PathVariable long id) throws IOException { Path p = imagens.original(id); String tipo = Files.probeContentType(p); return resposta(p, tipo == null ? MediaType.APPLICATION_OCTET_STREAM : MediaType.parseMediaType(tipo)); }
    private ResponseEntity<Resource> resposta(Path caminho, MediaType tipo) { return ResponseEntity.ok().contentType(tipo).cacheControl(CacheControl.maxAge(java.time.Duration.ofHours(1)).cachePublic()).body(new FileSystemResource(caminho)); }
}
