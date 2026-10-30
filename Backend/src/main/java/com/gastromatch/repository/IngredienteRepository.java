package com.gastromatch.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.gastromatch.entity.Ingrediente;

public interface IngredienteRepository extends JpaRepository<Ingrediente, Integer> {
}
