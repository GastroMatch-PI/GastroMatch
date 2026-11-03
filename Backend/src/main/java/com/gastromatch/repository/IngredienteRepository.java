package com.gastromatch.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.gastromatch.entity.Ingrediente;

public interface IngredienteRepository extends JpaRepository<Ingrediente, Integer> {

    // Sem diferenciar maiúscula nem acento. O padrão vem de BuscaTexto.padraoContem
    // (já minúsculo, sem acento e com % _ escapados); o unaccent() é do PostgreSQL.
    @Query("select i from Ingrediente i "
            + "where cast(function('unaccent', lower(i.nome)) as string) like :padrao escape '\\' "
            + "order by i.nome asc")
    List<Ingrediente> buscarPorPadraoDeNome(@Param("padrao") String padrao);

    default List<Ingrediente> buscarPorNome(String nome) {
        return buscarPorPadraoDeNome(BuscaTexto.padraoContem(nome));
    }
}
