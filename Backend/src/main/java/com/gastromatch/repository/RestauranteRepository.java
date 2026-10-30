package com.gastromatch.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.gastromatch.entity.Restaurante;

public interface RestauranteRepository extends JpaRepository<Restaurante, Integer> {

    boolean existsByCnpj(String cnpj);
}
