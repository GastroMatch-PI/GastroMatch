package com.gastromatch.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import com.gastromatch.entity.Comentario;

public interface ComentarioRepository extends JpaRepository<Comentario, Integer> {

    // Traz o autor junto para mostrar o username sem uma consulta por comentário.
    @EntityGraph(attributePaths = "usuario")
    Page<Comentario> findByReceitaId(Integer idReceita, Pageable pageable);
}