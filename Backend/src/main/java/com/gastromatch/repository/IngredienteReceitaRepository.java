package com.gastromatch.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.gastromatch.entity.IngredienteReceita;

public interface IngredienteReceitaRepository extends JpaRepository<IngredienteReceita, Integer> {

    @Query("select ir from IngredienteReceita ir join fetch ir.ingrediente where ir.receita.id = :idReceita order by ir.id")
    List<IngredienteReceita> buscarPorReceita(@Param("idReceita") Integer idReceita);

    // Usado ao substituir a lista de ingredientes de uma receita. Grava o que estiver
    // pendente antes e limpa o cache depois, para não sobrar linha antiga na memória.
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("delete from IngredienteReceita ir where ir.receita.id = :idReceita")
    void apagarPorReceita(@Param("idReceita") Integer idReceita);
}