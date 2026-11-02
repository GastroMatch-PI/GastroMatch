package com.gastromatch.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import com.gastromatch.entity.Restaurante;

public interface RestauranteRepository
        extends JpaRepository<Restaurante, Integer>, JpaSpecificationExecutor<Restaurante> {

    boolean existsByCnpj(String cnpj);

    @EntityGraph(attributePaths = {"profissional"})
    Optional<Restaurante> findByProfissionalId(Integer idProfissional);
}
