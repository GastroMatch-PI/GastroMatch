package com.gastromatch.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.gastromatch.dto.IngredienteResponse;
import com.gastromatch.service.IngredienteService;

/** Catálogo de ingredientes (público). */
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
}
