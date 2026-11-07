package com.gastromatch.controller;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.time.Duration;

import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.gastromatch.dto.ImagemResponse;
import com.gastromatch.service.ImagemService;

/** Envio (com login) e leitura (pública) de imagens de receita, etapa e comentário. */
@RestController
@RequestMapping("/imagens")
public class ImagemController {

    private final ImagemService imagemService;

    public ImagemController(ImagemService imagemService) {
        this.imagemService = imagemService;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ImagemResponse> enviar(@RequestParam("arquivo") MultipartFile arquivo) {
        try {
            String url = imagemService.enviar(arquivo.getBytes());
            return ResponseEntity.status(HttpStatus.CREATED).body(new ImagemResponse(url));
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }

    @GetMapping("/{nome}")
    public ResponseEntity<Resource> baixar(@PathVariable String nome) {
        Resource imagem = imagemService.abrir(nome);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(ImagemService.tipoMime(nome)))
                // O navegador não pode "adivinhar" outro tipo para o arquivo.
                .header("X-Content-Type-Options", "nosniff")
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline")
                // O nome é aleatório e o conteúdo nunca muda, então pode ficar em cache.
                .cacheControl(CacheControl.maxAge(Duration.ofDays(7)).cachePublic())
                .body(imagem);
    }
}
