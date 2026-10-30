package com.gastromatch.repository;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.gastromatch.entity.Receita;

public interface ReceitaRepository extends JpaRepository<Receita, Integer>, JpaSpecificationExecutor<Receita> {

    // Traz o chef junto (um JOIN só) para a listagem não fazer uma consulta por receita.
    @Override
    @EntityGraph(attributePaths = {"chef", "chef.profissional"})
    Page<Receita> findAll(Specification<Receita> spec, Pageable pageable);

    @Query("select r from Receita r join fetch r.chef c join fetch c.profissional where r.id = :id")
    Optional<Receita> buscarComChef(@Param("id") Integer id);
}