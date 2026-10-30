package com.gastromatch.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.gastromatch.entity.EtapaReceita;

public interface EtapaReceitaRepository extends JpaRepository<EtapaReceita, Integer> {

    List<EtapaReceita> findByReceitaIdOrderByOrdemAscIdAsc(Integer idReceita);

    // 0 quando a receita ainda não tem etapas: a próxima será a 1.
    @Query("select coalesce(max(e.ordem), 0) from EtapaReceita e where e.receita.id = :idReceita")
    int maiorOrdem(@Param("idReceita") Integer idReceita);
}