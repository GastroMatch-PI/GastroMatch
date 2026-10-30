package com.gastromatch.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.gastromatch.entity.Nutricionista;

public interface NutricionistaRepository extends JpaRepository<Nutricionista, Integer> {

    boolean existsByCrn(String crn);
}
