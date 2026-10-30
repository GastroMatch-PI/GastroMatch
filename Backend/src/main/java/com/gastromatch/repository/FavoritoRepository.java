package com.gastromatch.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.gastromatch.entity.Favorito;

public interface FavoritoRepository extends JpaRepository<Favorito, Integer> {
}
