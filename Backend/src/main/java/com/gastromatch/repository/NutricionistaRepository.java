package com.gastromatch.repository;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import com.gastromatch.entity.Nutricionista;
import com.gastromatch.entity.enums.StatusVerificacao;

public interface NutricionistaRepository extends JpaRepository<Nutricionista, Integer> {

    boolean existsByCrn(String crn);

    @EntityGraph(attributePaths = {"profissional"})
    Optional<Nutricionista> findByProfissionalId(Integer idProfissional);

    // Diretório público: só quem teve o registro verificado pela equipe.
    @EntityGraph(attributePaths = {"profissional"})
    Page<Nutricionista> findByStatusVerificacao(StatusVerificacao status, Pageable pageable);

    @EntityGraph(attributePaths = {"profissional"})
    Optional<Nutricionista> findByIdAndStatusVerificacao(Integer id, StatusVerificacao status);
}
