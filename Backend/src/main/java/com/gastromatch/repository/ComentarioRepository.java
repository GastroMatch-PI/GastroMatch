package com.gastromatch.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.gastromatch.entity.Comentario;

public interface ComentarioRepository extends JpaRepository<Comentario, Integer> {
}
