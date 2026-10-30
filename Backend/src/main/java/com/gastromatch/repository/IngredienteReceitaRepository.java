package com.gastromatch.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.gastromatch.entity.IngredienteReceita;

public interface IngredienteReceitaRepository extends JpaRepository<IngredienteReceita, Integer> {

    @Query("select ir from IngredienteReceita ir join fetch ir.ingrediente where ir.receita.id = :idReceita order by ir.id")
    List<IngredienteReceita> buscarPorReceita(@Param("idReceita") Integer idReceita);
}