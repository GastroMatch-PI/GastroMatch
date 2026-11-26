package com.gastromatch.controller;

import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.gastromatch.dto.CadastroChefRequest;
import com.gastromatch.dto.ChefPerfilResponse;
import com.gastromatch.dto.ChefResponse;
import com.gastromatch.dto.PaginaResponse;
import com.gastromatch.dto.ReceitaResumoResponse;
import com.gastromatch.entity.enums.Especializacao;
import com.gastromatch.service.ChefService;

import jakarta.validation.Valid;

/** Perfil de chef da conta logada (exige login) e diretório público de chefs (só leitura). */
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

    @GetMapping
    public ResponseEntity<PaginaResponse<ChefPerfilResponse>> listar(
            @RequestParam(required = false) Especializacao especializacao,
            @RequestParam(defaultValue = "0") int pagina,
            @RequestParam(defaultValue = "20") int tamanho) {
        return ResponseEntity.ok(chefService.listar(especializacao,
                Paginacao.de(pagina, tamanho, Sort.by("id"))));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ChefPerfilResponse> perfilPublico(@PathVariable Integer id) {
        return ResponseEntity.ok(chefService.perfilPublico(id));
    }

    @GetMapping("/{id}/receitas")
    public ResponseEntity<PaginaResponse<ReceitaResumoResponse>> receitasDoChef(
            @PathVariable Integer id,
            @RequestParam(defaultValue = "0") int pagina,
            @RequestParam(defaultValue = "20") int tamanho) {
        var pageable = Paginacao.de(pagina, tamanho, Sort.by(Sort.Direction.DESC, "criadoEm", "id"));
        return ResponseEntity.ok(chefService.listarReceitas(id, pageable));
    }

    @PutMapping("/me")
    public ResponseEntity<ChefResponse> ajustarPerfil(@AuthenticationPrincipal Integer usuarioId,
                                                        @Valid @RequestBody CadastroChefRequest request) {
        return ResponseEntity.ok(chefService.atualizarPerfil(usuarioId, request));
    }
}
