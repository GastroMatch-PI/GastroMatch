package com.gastromatch.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.gastromatch.entity.Usuario;

public interface UsuarioRepository extends JpaRepository <Usuario, Long>{

}
