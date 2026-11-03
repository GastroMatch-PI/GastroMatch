package com.gastromatch.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.gastromatch.entity.Chef;
import com.gastromatch.entity.enums.Especializacao;

public interface ChefRepository extends JpaRepository<Chef, Integer> {

    // Chef do perfil profissional (no máximo um, garantido pelo UNIQUE do SQL).
    Optional<Chef> findByProfissionalId(Integer idProfissional);

    // Diretório: já traz o perfil e o restaurante de cada chef, para não gerar uma consulta por linha.
    @Override
    @EntityGraph(attributePaths = {"profissional", "restaurante"})
    Page<Chef> findAll(Pageable pageable);

    @EntityGraph(attributePaths = {"profissional", "restaurante"})
    Page<Chef> findByEspecializacao(Especializacao especializacao, Pageable pageable);

    @Query("select c from Chef c join fetch c.profissional left join fetch c.restaurante where c.id = :id")
    Optional<Chef> buscarComPerfil(@Param("id") Integer id);

    // Chefs que trabalham em um restaurante.
    @EntityGraph(attributePaths = {"profissional"})
    List<Chef> findByRestauranteIdOrderByIdAsc(Integer idRestaurante);
}
