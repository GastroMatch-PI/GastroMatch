package com.gastromatch.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.gastromatch.entity.Chef;

public interface ChefRepository extends JpaRepository<Chef, Integer> {

    // Chef do perfil profissional (no máximo um, garantido pelo UNIQUE do SQL).
    Optional<Chef> findByProfissionalId(Integer idProfissional);
}
