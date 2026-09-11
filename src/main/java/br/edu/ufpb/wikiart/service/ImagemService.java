package br.edu.ufpb.wikiart.service;

import br.edu.ufpb.wikiart.model.Obra;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.nio.file.*;

@Service
public class ImagemService {
    private final CatalogoService catalogo;
    private final Path thumbnails;
    public ImagemService(CatalogoService catalogo, @Value("${wikiart.thumbnails:data/thumbnails}") String thumbnails) { this.catalogo = catalogo; this.thumbnails = Path.of(thumbnails).toAbsolutePath().normalize(); }

    public Path original(long id) { return validar(catalogo.porId(id)); }
    public Path miniatura(long id) throws IOException {
        Obra obra = catalogo.porId(id);
        Path origem = validar(obra);
        Files.createDirectories(thumbnails);
        Path destino = thumbnails.resolve(id + ".jpg").normalize();
        if (!destino.startsWith(thumbnails)) throw new SecurityException("Destino de miniatura inválido.");
        if (Files.isRegularFile(destino) && Files.getLastModifiedTime(destino).compareTo(Files.getLastModifiedTime(origem)) >= 0) return destino;
        BufferedImage imagem = ImageIO.read(origem.toFile());
        if (imagem == null) throw new IOException("Formato de imagem inválido: " + origem);
        double escala = Math.min(1.0, 480.0 / Math.max(imagem.getWidth(), imagem.getHeight()));
        int largura = Math.max(1, (int) Math.round(imagem.getWidth() * escala));
        int altura = Math.max(1, (int) Math.round(imagem.getHeight() * escala));
        BufferedImage saida = new BufferedImage(largura, altura, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = saida.createGraphics();
        try { g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR); g.drawImage(imagem, 0, 0, largura, altura, null); } finally { g.dispose(); }
        Path temporario = Files.createTempFile(thumbnails, id + "-", ".tmp");
        try { if (!ImageIO.write(saida, "jpg", temporario.toFile())) throw new IOException("Não foi possível gerar JPEG."); Files.move(temporario, destino, StandardCopyOption.REPLACE_EXISTING, StandardCopyOption.ATOMIC_MOVE); } finally { Files.deleteIfExists(temporario); }
        return destino;
    }
    private Path validar(Obra obra) { Path caminho = Path.of(obra.caminhoImagem()).toAbsolutePath().normalize(); if (!catalogo.caminhoRegistrado(caminho) || !Files.isRegularFile(caminho)) throw new RecursoNaoEncontrado("IMAGEM_NAO_ENCONTRADA", "Imagem indisponível para a obra " + obra.id()); return caminho; }
}
