package com.gastromatch.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.gastromatch.entity.Ingrediente;

public interface IngredienteRepository extends JpaRepository<Ingrediente, Integer> {

    List<Ingrediente> findByNomeContainingIgnoreCaseOrderByNomeAsc(String nome);
}