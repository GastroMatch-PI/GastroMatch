package com.gastromatch.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.gastromatch.entity.Dica;

public interface DicaRepository extends JpaRepository<Dica, Integer> {

    // Todas as dicas da receita de uma vez (evita buscar etapa por etapa).
    @Query("select d from Dica d join fetch d.chef where d.etapaReceita.receita.id = :idReceita order by d.id")
    List<Dica> buscarPorReceita(@Param("idReceita") Integer idReceita);
}