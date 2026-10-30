package com.gastromatch.controller;

import java.net.URI;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.gastromatch.dto.ComentarioRequest;
import com.gastromatch.dto.ComentarioResponse;
import com.gastromatch.dto.PaginaResponse;
import com.gastromatch.service.ComentarioService;

import jakarta.validation.Valid;

/** Ler comentários é público; comentar, editar e apagar exigem login (e ser o autor). */
@RestController
public class ComentarioController {

    private final ComentarioService comentarioService;

    public ComentarioController(ComentarioService comentarioService) {
        this.comentarioService = comentarioService;
    }

    @GetMapping("/receitas/{id}/comentarios")
    public ResponseEntity<PaginaResponse<ComentarioResponse>> listar(
            @PathVariable Integer id,
            @RequestParam(defaultValue = "0") int pagina,
            @RequestParam(defaultValue = "20") int tamanho) {
        var pageable = PageRequest.of(
                Math.max(pagina, 0), Math.min(Math.max(tamanho, 1), ReceitaController.TAMANHO_MAXIMO),
                Sort.by(Sort.Direction.DESC, "criadoEm", "id"));
        return ResponseEntity.ok(comentarioService.listar(id, pageable));
    }

    @PostMapping("/receitas/{id}/comentarios")
    public ResponseEntity<ComentarioResponse> criar(@AuthenticationPrincipal Integer usuarioId,
                                                    @PathVariable Integer id,
                                                    @Valid @RequestBody ComentarioRequest request) {
        ComentarioResponse criado = comentarioService.criar(usuarioId, id, request);
        return ResponseEntity.created(URI.create("/receitas/" + id + "/comentarios")).body(criado);
    }

    @PutMapping("/comentarios/{id}")
    public ResponseEntity<ComentarioResponse> atualizar(@AuthenticationPrincipal Integer usuarioId,
                                                        @PathVariable Integer id,
                                                        @Valid @RequestBody ComentarioRequest request) {
        return ResponseEntity.ok(comentarioService.atualizar(usuarioId, id, request));
    }

    @DeleteMapping("/comentarios/{id}")
    public ResponseEntity<Void> excluir(@AuthenticationPrincipal Integer usuarioId, @PathVariable Integer id) {
        comentarioService.excluir(usuarioId, id);
        return ResponseEntity.noContent().build();
    }
}
