package com.gastromatch.controller;

import java.net.URI;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.gastromatch.dto.IngredienteRequest;
import com.gastromatch.dto.IngredienteResponse;
import com.gastromatch.service.IngredienteService;

import jakarta.validation.Valid;

/** Catálogo de ingredientes: GET é público; POST/PUT/DELETE exigem ROLE_ADMIN (SecurityConfig). */
@RestController
@RequestMapping("/ingredientes")
public class IngredienteController {

    private final IngredienteService ingredienteService;

    public IngredienteController(IngredienteService ingredienteService) {
        this.ingredienteService = ingredienteService;
    }

    @GetMapping
    public ResponseEntity<List<IngredienteResponse>> listar(@RequestParam(required = false) String nome) {
        return ResponseEntity.ok(ingredienteService.listar(nome));
    }

    @PostMapping
    public ResponseEntity<IngredienteResponse> criar(@Valid @RequestBody IngredienteRequest request) {
        IngredienteResponse criado = ingredienteService.criar(request);
        return ResponseEntity.created(URI.create("/ingredientes/" + criado.id())).body(criado);
    }

    @PutMapping("/{id}")
    public ResponseEntity<IngredienteResponse> atualizar(@PathVariable Integer id,
                                                          @Valid @RequestBody IngredienteRequest request) {
        return ResponseEntity.ok(ingredienteService.atualizar(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable Integer id) {
        ingredienteService.excluir(id);
        return ResponseEntity.noContent().build();
    }
}
