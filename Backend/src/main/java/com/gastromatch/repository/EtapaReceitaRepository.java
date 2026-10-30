package com.gastromatch.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.gastromatch.entity.EtapaReceita;

public interface EtapaReceitaRepository extends JpaRepository<EtapaReceita, Integer> {

    List<EtapaReceita> findByReceitaIdOrderByOrdemAscIdAsc(Integer idReceita);
}