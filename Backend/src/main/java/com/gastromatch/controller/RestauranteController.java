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

import com.gastromatch.dto.CadastroRestauranteRequest;
import com.gastromatch.dto.PaginaResponse;
import com.gastromatch.dto.RestauranteDetalheResponse;
import com.gastromatch.dto.RestauranteResponse;
import com.gastromatch.dto.RestauranteResumoResponse;
import com.gastromatch.service.RestauranteService;

import jakarta.validation.Valid;

/** Cadastro e perfil do restaurante da conta logada (exige login) e diretório público com mapa. */
@RestController
@RequestMapping("/restaurantes")
public class RestauranteController {

    private final RestauranteService restauranteService;

    public RestauranteController(RestauranteService restauranteService) {
        this.restauranteService = restauranteService;
    }

    @PostMapping
    public ResponseEntity<RestauranteResponse> criar(@AuthenticationPrincipal Integer usuarioId,
                                                     @Valid @RequestBody CadastroRestauranteRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(restauranteService.criarPerfil(usuarioId, request));
    }

    @GetMapping("/me")
    public ResponseEntity<RestauranteResponse> meuPerfil(@AuthenticationPrincipal Integer usuarioId) {
        return ResponseEntity.ok(restauranteService.meuPerfil(usuarioId));
    }

    @GetMapping
    public ResponseEntity<PaginaResponse<RestauranteResumoResponse>> listar(
            @RequestParam(required = false) String texto,
            @RequestParam(required = false) String cidade,
            @RequestParam(required = false) String bairro,
            @RequestParam(required = false) String estado,
            @RequestParam(defaultValue = "0") int pagina,
            @RequestParam(defaultValue = "20") int tamanho) {
        return ResponseEntity.ok(restauranteService.listar(texto, cidade, bairro, estado,
                Paginacao.de(pagina, tamanho, Sort.by("nome", "id"))));
    }

    @GetMapping("/{id}")
    public ResponseEntity<RestauranteDetalheResponse> detalhar(@PathVariable Integer id) {
        return ResponseEntity.ok(restauranteService.detalhar(id));
    }
}
