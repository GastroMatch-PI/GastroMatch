package com.gastromatch.controller;

import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.gastromatch.dto.CadastroNutricionistaRequest;
import com.gastromatch.dto.NutricionistaResponse;
import com.gastromatch.dto.NutricionistaResumoResponse;
import com.gastromatch.dto.PaginaResponse;
import com.gastromatch.service.NutricionistaService;

import jakarta.validation.Valid;

/** Cadastro e perfil da nutricionista logada (exige login) e diretório público das verificadas. */
@RestController
@RequestMapping("/nutricionistas")
public class NutricionistaController {

    private final NutricionistaService nutricionistaService;

    public NutricionistaController(NutricionistaService nutricionistaService) {
        this.nutricionistaService = nutricionistaService;
    }

    @PostMapping
    public ResponseEntity<NutricionistaResponse> criar(@AuthenticationPrincipal Integer usuarioId,
                                                       @Valid @RequestBody CadastroNutricionistaRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(nutricionistaService.criarPerfil(usuarioId, request));
    }

    @GetMapping("/me")
    public ResponseEntity<NutricionistaResponse> meuPerfil(@AuthenticationPrincipal Integer usuarioId) {
        return ResponseEntity.ok(nutricionistaService.meuPerfil(usuarioId));
    }

    @GetMapping
    public ResponseEntity<PaginaResponse<NutricionistaResumoResponse>> listar(
            @RequestParam(defaultValue = "0") int pagina,
            @RequestParam(defaultValue = "20") int tamanho) {
        return ResponseEntity.ok(nutricionistaService.listar(Paginacao.de(pagina, tamanho, Sort.by("id"))));
    }

    @GetMapping("/{id}")
    public ResponseEntity<NutricionistaResumoResponse> perfilPublico(@PathVariable Integer id) {
        return ResponseEntity.ok(nutricionistaService.buscar(id));
    }
}
