package com.gastromatch.service;

import java.util.List;

import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.gastromatch.dto.IngredienteResponse;
import com.gastromatch.repository.IngredienteRepository;

@Service
public class IngredienteService {

    private final IngredienteRepository ingredienteRepository;

    public IngredienteService(IngredienteRepository ingredienteRepository) {
        this.ingredienteRepository = ingredienteRepository;
    }

    /** Catálogo em ordem alfabética; "nome" opcional filtra por trecho (sem diferenciar maiúsculas). */
    @Transactional(readOnly = true)
    public List<IngredienteResponse> listar(String nome) {
        var ingredientes = (nome == null || nome.isBlank())
                ? ingredienteRepository.findAll(Sort.by("nome"))
                : ingredienteRepository.findByNomeContainingIgnoreCaseOrderByNomeAsc(nome.trim());
        return ingredientes.stream().map(IngredienteResponse::de).toList();
    }
}
