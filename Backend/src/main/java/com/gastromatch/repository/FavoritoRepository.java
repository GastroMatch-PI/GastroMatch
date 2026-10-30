package com.gastromatch.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.gastromatch.entity.Favorito;
import com.gastromatch.entity.Receita;

public interface FavoritoRepository extends JpaRepository<Favorito, Integer> {

    boolean existsByUsuarioIdAndReceitaId(Integer idUsuario, Integer idReceita);

    void deleteByUsuarioIdAndReceitaId(Integer idUsuario, Integer idReceita);

    // Receitas favoritadas, da mais recente para a mais antiga, com o chef já carregado.
    @Query(value = "select r from Favorito f join f.receita r join fetch r.chef c join fetch c.profissional "
            + "where f.usuario.id = :idUsuario order by f.criadoEm desc, f.id desc",
            countQuery = "select count(f) from Favorito f where f.usuario.id = :idUsuario")
    Page<Receita> receitasFavoritas(@Param("idUsuario") Integer idUsuario, Pageable pageable);
}