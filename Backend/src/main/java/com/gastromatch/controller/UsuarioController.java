package com.gastromatch.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.gastromatch.dto.TrocaSenhaRequest;
import com.gastromatch.dto.UsuarioResponse;
import com.gastromatch.service.UsuarioService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/usuarios")
public class UsuarioController {

    private final UsuarioService usuarioService;

    public UsuarioController(UsuarioService usuarioService) {
        this.usuarioService = usuarioService;
    }

    // O JwtAuthFilter coloca o id do usuário como principal; o Spring o injeta aqui.
    @GetMapping("/me")
    public ResponseEntity<UsuarioResponse> perfil(@AuthenticationPrincipal Integer usuarioId) {
        return ResponseEntity.ok(usuarioService.buscarPorId(usuarioId));
    }

    @PostMapping("/me/senha")
    public ResponseEntity<Void> trocarSenha(@AuthenticationPrincipal Integer usuarioId,
                                            @Valid @RequestBody TrocaSenhaRequest request) {
        usuarioService.trocarSenha(usuarioId, request);
        return ResponseEntity.noContent().build();
    }
}
