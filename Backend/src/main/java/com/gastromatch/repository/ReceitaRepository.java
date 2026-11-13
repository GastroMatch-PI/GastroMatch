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
import java.util.List;
import com.gastromatch.entity.Receita;
import com.gastromatch.entity.enums.Dificuldade;
import com.gastromatch.entity.enums.MetodoPreparo;
import com.gastromatch.entity.enums.Ocasiao;
import com.gastromatch.entity.enums.PerfilAlimentar;
import com.gastromatch.entity.enums.TipoRefeicao;

public interface ReceitaRepository extends JpaRepository<Receita, Integer>, JpaSpecificationExecutor<Receita> {

    // Traz o chef junto (um JOIN só) para a listagem não fazer uma consulta por
    // receita.
    @Override
    @EntityGraph(attributePaths = { "chef", "chef.profissional" })
    Page<Receita> findAll(Specification<Receita> spec, Pageable pageable);

    @Query("select r from Receita r join fetch r.chef c join fetch c.profissional where r.id = :id")
    Optional<Receita> buscarComChef(@Param("id") Integer id);

    @Query("select distinct r.tipo from Receita r where r.tipo is not null")
    List<TipoRefeicao> tiposDisponiveis();

    @Query("select distinct r.metodoPreparo from Receita r where r.metodoPreparo is not null")
    List<MetodoPreparo> metodosDisponiveis();

    @Query("select distinct r.ocasiao from Receita r where r.ocasiao is not null")
    List<Ocasiao> ocasioesDisponiveis();

    @Query("select distinct r.perfil from Receita r where r.perfil is not null")
    List<PerfilAlimentar> perfisDisponiveis();

    @Query("select distinct r.dificuldade from Receita r where r.dificuldade is not null")
    List<Dificuldade> dificuldadesDisponiveis();

    @Query("select min(r.tempoPreparo) from Receita r")
    Integer tempoMinimoDisponivel();

    @Query("select max(r.tempoPreparo) from Receita r")
    Integer tempoMaximoDisponivel();
}