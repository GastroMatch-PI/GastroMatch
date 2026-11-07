package com.gastromatch.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.gastromatch.entity.Comentario;

public interface ComentarioRepository extends JpaRepository<Comentario, Integer> {

    // Traz o autor junto para mostrar o username sem uma consulta por comentário.
    @EntityGraph(attributePaths = "usuario")
    Page<Comentario> findByReceitaId(Integer idReceita, Pageable pageable);

    /** Média (avg ignora nota nula) e quantidade de comentários COM nota, numa única consulta. */
    @Query("select avg(c.nota) as media, count(c.nota) as quantidade "
            + "from Comentario c where c.receita.id = :idReceita")
    NotaAgregada agregarNotas(@Param("idReceita") Integer idReceita);

    interface NotaAgregada {
        Double getMedia();

        long getQuantidade();
    }
}