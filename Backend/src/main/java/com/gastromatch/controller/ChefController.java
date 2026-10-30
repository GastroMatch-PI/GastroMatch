package com.gastromatch.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.gastromatch.dto.CadastroChefRequest;
import com.gastromatch.dto.ChefResponse;
import com.gastromatch.service.ChefService;

import jakarta.validation.Valid;

/** Perfil de chef da conta logada. */
@RestController
@RequestMapping("/chefs")
public class ChefController {

    private final ChefService chefService;

    public ChefController(ChefService chefService) {
        this.chefService = chefService;
    }

    @PostMapping
    public ResponseEntity<ChefResponse> criar(@AuthenticationPrincipal Integer usuarioId,
                                              @Valid @RequestBody CadastroChefRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(chefService.criarPerfil(usuarioId, request));
    }

    @GetMapping("/me")
    public ResponseEntity<ChefResponse> meuPerfil(@AuthenticationPrincipal Integer usuarioId) {
        return ResponseEntity.ok(chefService.meuPerfil(usuarioId));
    }
}
