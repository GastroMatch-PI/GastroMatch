package com.gastromatch.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.gastromatch.dto.UsuarioResponse;
import com.gastromatch.dto.AtualizarPerfilUsuarioRequest;
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

    @PutMapping("/me")
    public ResponseEntity<UsuarioResponse> atualizarPerfil(
            @AuthenticationPrincipal Integer usuarioId,
            @Valid @RequestBody AtualizarPerfilUsuarioRequest request) {
        return ResponseEntity.ok(usuarioService.atualizarPerfil(usuarioId, request));
    }
}
