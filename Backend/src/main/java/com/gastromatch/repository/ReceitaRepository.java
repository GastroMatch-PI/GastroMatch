package com.gastromatch.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.gastromatch.entity.Receita;

public interface ReceitaRepository extends JpaRepository<Receita, Integer> {
}
