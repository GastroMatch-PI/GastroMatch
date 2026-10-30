package com.gastromatch.controller;

import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.gastromatch.dto.PaginaResponse;
import com.gastromatch.dto.ReceitaResumoResponse;
import com.gastromatch.service.FavoritoService;

/** Favoritos da conta logada. Tudo exige login. */
@RestController
public class FavoritoController {

    private final FavoritoService favoritoService;

    public FavoritoController(FavoritoService favoritoService) {
        this.favoritoService = favoritoService;
    }

    @PutMapping("/receitas/{id}/favorito")
    public ResponseEntity<Void> favoritar(@AuthenticationPrincipal Integer usuarioId, @PathVariable Integer id) {
        favoritoService.favoritar(usuarioId, id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/receitas/{id}/favorito")
    public ResponseEntity<Void> desfavoritar(@AuthenticationPrincipal Integer usuarioId, @PathVariable Integer id) {
        favoritoService.desfavoritar(usuarioId, id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/usuarios/me/favoritos")
    public ResponseEntity<PaginaResponse<ReceitaResumoResponse>> listar(
            @AuthenticationPrincipal Integer usuarioId,
            @RequestParam(defaultValue = "0") int pagina,
            @RequestParam(defaultValue = "20") int tamanho) {
        var pageable = PageRequest.of(
                Math.max(pagina, 0), Math.min(Math.max(tamanho, 1), ReceitaController.TAMANHO_MAXIMO));
        return ResponseEntity.ok(favoritoService.listar(usuarioId, pageable));
    }
}
